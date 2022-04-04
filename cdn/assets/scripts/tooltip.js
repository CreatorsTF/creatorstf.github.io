let gTooltipsEnabled = true;
let gTooltipsPersist = false;

function TOOLTIPS_ENABLE() {
    gTooltipsEnabled = true;
}

function TOOLTIPS_ALLOW_PERSIST() {
    gTooltipsPersist = true;
}

function TOOLTIPS_DISABLE() {
    gTooltipsEnabled = false;
}

document.addEventListener("mouseover", (e) => {
    if (!gTooltipsEnabled) return;

    if (e.target.hasAttribute("tooltip")) {

        function step(el) {
            let parent = el.parentElement;
            if (!parent) return el;
            if (parent == document.body) return parent;
            if (parent.hasAttribute("tooltip-viewport")) return parent;
            return step(parent);
        }

        let target = e.target;
        let viewport = step(target);
        let timeout = (+(e.target.getAttribute("tooltip-timeout") || 100));

        let html = e.target.querySelector(".tooltip__html");
        if (!!html) {
            target.__tooltip = new CTFTooltip({
                target: target,
                viewport: viewport,
                innerHTML: html.innerHTML,
                timeout: timeout,
                top: e.target.hasAttribute("tooltip-top") ? true : false
            });
        } else {
            target.__tooltip = new CTFTooltip({
                target: target,
                viewport: viewport,
                innerText: e.target.getAttribute("tooltip"),
                timeout: timeout,
                top: e.target.hasAttribute("tooltip-top") ? true : false
            });
        }
    }
});


const SOUND_CONTEXT_OPEN = SOUND_BASE + "ui/buttonclickrelease.wav";
Creators.Actions.Sounds.precache(SOUND_CONTEXT_OPEN);

document.addEventListener("click", evContextMenu, false);
document.addEventListener("contextmenu", evContextMenu, false);

function evContextMenu(e) {
    // If click event was run we clean all context menus. (Except if target is context menu itself).
    if (e.target.classList.contains("context-menu") || hasParentWithSelector(e.target, ".context-menu")) return;
    for (let a of document.querySelectorAll(".context-menu")) a.remove();

    if (!e.target.classList.contains("contextmenu")) return;
    let html = e.target.querySelector(".contextmenu__html");
    if (!!html) {
        if (e.type == "contextmenu") e.preventDefault();
        // If dom element has contexmenu info available - we read it and apply.
        let iContext = new CTFContextMenu({
            innerHTML: html.innerHTML
        });
        document.body.appendChild(iContext.DOM);
        Creators.Actions.Sounds.play(SOUND_CONTEXT_OPEN);

        // Position this context box to be right under the cursor.
        iContext.DOM.style.left = `${e.clientX + window.scrollX}px`;
        iContext.DOM.style.top = `${e.clientY + window.scrollY}px`;
    }
}

function persistTooltip(tooltip) {
    tooltip.DOM.setAttribute('data-keepalive', true);
}

function clearOverlayAll() {
    $('*[data-overlay-dom]')
        .each((_, element) => {
            if (element.__overlay) element.__overlay.forceClose();
            else element.close();
        });
}

function clearOverlay(overlayElement) {
    if (!overlayElement || !overlayElement.__overlay) {
        console.info('removeTooltip(HtmlElement) was passed a null ref, fail-safe proceeding.');
        clearOverlayAll();
        return;
    }

    overlayElement.__overlay.closeAndKill();
}

/**
 * (safe) Returns true if parent item has a tooltip currently visible.
 *
 * @param parent
 * @returns {boolean|*}
 */
function hasPersistingTooltip(parent) {
    if (!parent || !parent.__tooltip || !parent.__tooltip.DOM)
        return false;

    if (!parent.__tooltip.isActive())
        return false;

    return parent.__tooltip.DOM.hasAttribute('data-keepalive');
}

class CTFBaseOverlayElement {
    constructor(data) {
        this.DOM = document.createElement("div");
        this.DOM.setAttribute('data-overlay-dom', '1');
        this.DOM.object = this;
        this.DOM.__overlay = this;
        this.dismissed = false;
    }

    open() {
        this.DOM.style.opacity = 1;
    }

    close() {
        this.DOM.style.animation = '';
        this.DOM.style.opacity = 0;
    }

    isActive() {
        return !this.dismissed;
    }

    closeAndKill() {
        this.dismissed = true;
        this.close();
        setTimeout(() => {
            this.DOM.remove();
        }, 200);
    }

    forceClose() {
        this.dismissed = true;
        this.DOM.remove();
    }
}

class CTFOverlayTargetElement extends CTFBaseOverlayElement {
    constructor(data) {
        super(data);
        this.target = data.target;
        this.target.setAttribute('data-overlay-target', '1');
        this.target.__overlay = this;
        $(this.target).on('mouseleave', _ => this.onTargetLeave());
    }

    /**
     * Callback on mouse leaving target element.
     */
    onTargetLeave() {
        this.closeAndKill();
    }
}

/**
 *
 */
class CTFTooltip extends CTFOverlayTargetElement {

    constructor(data) {
        super(data);
        this.DOM.setAttribute("data-tooltip-element", "1");

        // This symbol needs to be defined by page using tooltips.
        if (gTooltipsPersist) {
            this.makePersistent();
        }

        this.viewport = data.viewport;
        this.innerText = data.innerText;
        this.innerHTML = data.innerHTML;
        this.top = data.top;

        this.timeout = data.timeout || 0;

        this.DOM.className = 'tooltip__element';
        if (!!this.innerHTML) this.DOM.innerHTML = this.innerHTML;
        else if (!!this.innerText) this.DOM.innerHTML = `<div class="tooltip__element__textonly">${this.innerText}</div>`;
        setTimeout(() => {
            if (this.dismissed) return;
            this.viewport.append(this.DOM);

            let posX = window.scrollX + this.target.getBoundingClientRect().left + (-this.DOM.offsetWidth / 2) + (this.target.offsetWidth / 2);
            let posY = 0;
            if (this.top === true) {
                posY = window.scrollY + this.target.getBoundingClientRect().top - 5 - this.DOM.offsetHeight;
            } else {
                posY = window.scrollY + this.target.getBoundingClientRect().top + 5 + this.target.offsetHeight;
            }

            if (posX < 0) posX = 0;
            if ((posX + this.DOM.offsetWidth) > window.innerWidth) posX = window.innerWidth - this.DOM.offsetWidth;

            this.DOM.style.left = posX + "px";
            this.DOM.style.top = posY + "px";

            this.open();
        }, this.timeout);
    }

    /**
     * How long before tooltip is asked to close after mouse leaves target.
     *
     * @return number milliseconds (default: 50ms)
     */
    getFadeDelay() {
        return this.target.getAttribute("tooltip-fade-delay") || 50
    }

    /**
     * Attaches event listeners which allow tooltip windows to "persist".
     */
    makePersistent() {
        $(this.DOM).on('mouseenter', _ => persistTooltip(this));
        $(this.DOM).on('mouseleave', _ => clearOverlay(this.target));

        // Redefine as needed
        this.onTargetLeave = function () {
            // Wait a sec before we close
            setTimeout((targetElement) => {
                if (!hasPersistingTooltip(targetElement))
                    clearOverlay(targetElement);
            }, this.getFadeDelay(), this.target)
        }
    }

}

function hasParentWithSelector(target, selector) {
    return [...document.querySelectorAll(selector)].some(el =>
        el !== target && el.contains(target)
    )
}

document.addEventListener("mousedown", (e) => {
    // If mousedown event was run we clean all context menus. (Except if target is context menu itself).
    if (e.target.classList.contains("context-menu") || hasParentWithSelector(e.target, ".context-menu")) return;
    for (let a of document.querySelectorAll(".context-menu")) a.remove();
}, false);

class CTFContextMenu extends CTFBaseOverlayElement {
    constructor(data) {
        super(data);
        this.DOM.className = "context-menu";
        this.DOM.innerHTML = data.innerHTML;
    }
}
