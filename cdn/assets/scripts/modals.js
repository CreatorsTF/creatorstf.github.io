let g_aModals = [];

class Modal {
    constructor(data = {}) {
        for (let a of document.querySelectorAll(".context-menu")) a.remove();
        for (let a of g_aModals) a.closeAndKill();
        g_aModals = [];
        g_aModals.push(this);
        this.onready = data.onready;
        this.onclose = data.onclose;
        this.onanswer = data.onanswer;
        this.innerText = data.innerText;
        this.innerHTML = data.innerHTML;
        this.buttons = data.buttons || [];

        this.parent = new ModalContainer();
        this.options = data.options || {};
        this.options.no_overflow = this.options.no_overflow ?? false;
        this.name = data.name;
        if (this.options.closeFromContainer === true) {
            this.parent.DOM.onclick = (e) => {
                if (e.target == e.currentTarget)
                    this.closeAndKill();
            }
        }
        this.DOM = document.createElement("div");
        this.DOM.object = this;
        this.DOM.className = 'modal container visible';
        if (this.options.width != null) this.DOM.style.maxWidth = this.options.width;
        if (this.options.error === true) this.DOM.classList.add("shake");
        this.DOM.prepend((() => {
            let a = document.createElement('div');
            a.className = 'modal-header';
            if (this.options.error === true) a.style.background = "#f002";
            if (this.options.closeFromButton === true) {
                a.prepend((() => {
                    let b = document.createElement('div');
                    b.className = 'modal-x';
                    b.innerText = "X";
                    b.onclick = (e) => {
                        if (e.target == e.currentTarget)
                            this.closeAndKill();
                    }
                    return b;
                })());
            }
            a.prepend((() => {
                let b = document.createElement('h2');
                b.innerText = this.name;
                return b;
            })());
            return a;
        })());
        this.DOM.append((() => {
            let a = document.createElement('div');
            a.className = 'modal-content';
            a.prepend((() => {
                if (!!this.innerHTML) {
                    let b = document.createElement('div');
                    b.innerHTML = this.innerHTML;
                    b.style = this.options.style;

                    if (this.options.height != null) {
                        if(!this.options.content_only && !this.options.no_overflow)
                        {
                            b.style.overflowY = "auto";
                        }
                        b.style.height = this.options.height;
                    }

                    return b;
                } else if (!!this.innerText) {
                    let b = document.createElement('p');
                    b.innerHTML = this.innerText;
                    b.style = this.options.style;
                    return b;
                };
            })());
            a.append((() => {
                if(this.options.content_only) return "";
                let b = document.createElement('div');
                b.className = "modal-footer";
                if (this.options.loading === true) {
                    b.classList.add("loading");
                }
                for (let c of this.buttons) {
                    b.prepend((() => {
                        let d = document.createElement("div");
                        d.className = c.class ?? 'tf-button2';
                        d.innerText = c.value;
                        if (!!c.icon) d.innerHTML = `<i class="mdi mdi-${c.icon}"></i> <label>${d.innerText}</label>`;
                        else d.innerHTML = `<label>${d.innerText}</label>`
                        if (!!c.timeout) {
                            d.setAttribute("disabled", "");
                            setTimeout(() => {
                                d.removeAttribute('disabled');
                            }, c.timeout)
                        }
                        d.onclick = (e) => {
                            if (d.hasAttribute('disabled')) return;
                            if (typeof c.onclick == 'function') {
                                c.onclick.call(this);
                                this.closeAndKill(false);
                            } else {
                                this.closeAndKill(true);
                            }
                        }
                        return d;
                    })());
                }
                return b;
            })());
            return a;
        })());
        this.parent.DOM.prepend(this.DOM);
        this.DOM.addEventListener('webkitAnimationEnd', function() {
            this.style.animationNam = '';
        }, false);

        this.open();
        this.adjustHeight();
    }

    adjustHeight() {
        this.DOM.style.height = `calc(${this.DOM.scrollHeight}px + 1rem)`;
    }

    open() {
        this.parent.DOM.style.background = "#0009";
        this.parent.DOM.style.pointerEvents = 'all';

        this.DOM.classList.remove("modal-popin");
        this.DOM.classList.remove("modal-popout-error");
        this.DOM.classList.remove("modal-popout");
        if (this.options.error == true)
        {
            this.DOM.classList.add("modal-popout-error");
        } else {
            this.DOM.classList.add("modal-popout");
        }

        if(this.options.content_only)
        {
            this.DOM.querySelector(".modal-header").remove();
            this.DOM.querySelector(".modal-content").style.padding = 0;
            this.DOM.querySelector(".modal-content").style.overflowY = "none";
        }

        this.DOM.style.pointerEvents = 'all';

        if (typeof this.onready == 'function') this.onready();
    }

    close(send = true) {
        this.parent.DOM.style.background = "#0000";
        this.parent.DOM.style.pointerEvents = 'none';

        this.DOM.classList.remove("modal-popin");
        this.DOM.classList.remove("modal-popout-error");
        this.DOM.classList.remove("modal-popout");

        this.DOM.style.pointerEvents = 'none';

        if (send == true && typeof this.onclose == 'function') this.onclose();
    }

    closeAndKill(send) {
        this.close(send);
        setTimeout(() => {
            this.remove();
        }, 200);
    }

    remove() {
        this.parent.DOM.remove();
    }
}

class ModalContainer {
    constructor() {
        this.DOM = document.createElement("div");
        this.DOM.className = 'modal-container';
        document.querySelector("#core").prepend(this.DOM);
        this.DOM.style.pointerEvents = 'all';
    }
}
