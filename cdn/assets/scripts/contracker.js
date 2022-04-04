let g_hCurrentPage = document.querySelector(".page.visible");
let g_iActiveQuest = -1;
CEContracker_SetDirectoryPath(g_hCurrentPage.getAttribute("data-dir"));

// 5 Seconds.
const CONTRACKER_REFRESH_INTERVAL = 10 * 1000;

const CONTRACKER_SOUND_CLICK = SOUND_BASE + "ui/buttonclickrelease.wav";
const CONTRACKER_SOUND_NODE_CHANGE = SOUND_BASE + "ui/cyoa/cyoa_map_open.wav";
const CONTRACKER_SOUND_NULL_HOVER = SOUND_BASE + "ui/cyoa/cyoa_node_absent.wav";
const CONTRACKER_SOUND_QUEST_ACTIVATE = SOUND_BASE + "ui/cyoa/cyoa_node_activate.wav";
const CONTRACKER_SOUND_QUEST_HOVER = SOUND_BASE + "ui/cyoa/cyoa_ping_in_progress.wav";
const CONTRACKER_SOUND_QUEST_TURNIN = SOUND_BASE + "ui/cyoa/quest_turn_in_decode.wav";
const CONTRACKER_SOUND_QUEST_ACCEPTED = SOUND_BASE + "ui/cyoa/quest_turn_in_accepted_light.wav";

const PREVIEW_LEFT = -1;
const PREVIEW_NONE = 0;
const PREVIEW_RIGHT = 1;

Creators.Actions.Sounds.precache(CONTRACKER_SOUND_CLICK);
Creators.Actions.Sounds.precache(CONTRACKER_SOUND_NODE_CHANGE);
Creators.Actions.Sounds.precache(CONTRACKER_SOUND_NULL_HOVER);
Creators.Actions.Sounds.precache(CONTRACKER_SOUND_QUEST_ACTIVATE);
Creators.Actions.Sounds.precache(CONTRACKER_SOUND_QUEST_HOVER);
Creators.Actions.Sounds.precache(CONTRACKER_SOUND_QUEST_ACTIVATE);
Creators.Actions.Sounds.precache(CONTRACKER_SOUND_QUEST_TURNIN);

function CEContracker_GotoNamedNode(node) {
    CEContracker_ClearAllPreviews();

    // Origin is current open page.
    let Origin = g_hCurrentPage;
    // Target is page we desire to open.
    let Target = document.querySelector(`.page[data-title='${node}']`);
    // Node is link to desired page.
    let Node = document.querySelector(`.node[data-title='${Target.getAttribute("data-title")}']`);

    // We make Target visible.
    Target.classList.add("visible");
    // And mark origin as Origin.
    Origin.classList.add("activated");

    let relX = Node.offsetLeft + Node.offsetWidth / 2;
    let relY = Node.offsetTop + Node.offsetHeight / 2;

    // Both Origin and Target change transformOrigin.
    Origin.style.transformOrigin = `${relX}px ${relY}px`;
    Target.style.transformOrigin = `${relX}px ${relY}px`;

    // Change directory path to desired target's dir.
    CEContracker_SetDirectoryPath(Target.getAttribute("data-dir"));

    // Target is now current page.
    g_hCurrentPage = Target;

    // Play sound.
    Creators.Actions.Sounds.play(CONTRACKER_SOUND_NODE_CHANGE);
}

function CEContracker_GotoUpperNode() {
    CEContracker_ClearAllPreviews();

    // Origin is current page.
    let Origin = g_hCurrentPage;
    // Target page is parent to origin one.
    let Target = document.querySelector(`.page[data-title='${Origin.getAttribute("data-parent")}']`);
    // Node is link to current page.
    let Node = document.querySelector(`.node[data-title='${Origin.getAttribute("data-title")}']`);

    if (Target == null) {

    } else {
        // Target is no longer activated.
        Target.classList.remove("activated");
        // Origin is no longer activated.
        Origin.classList.remove("visible");

        let relX = Node.offsetLeft + Node.offsetWidth / 2;
        let relY = Node.offsetTop + Node.offsetHeight / 2;

        // Origin change transformOrigin.
        Origin.style.transformOrigin = `${relX}px ${relY}px`;

        // Change directory path to desired target's dir.
        CEContracker_SetDirectoryPath(Target.getAttribute("data-dir"));

        // Target is now current page.
        g_hCurrentPage = Target;

        // Play sound.
        Creators.Actions.Sounds.play(CONTRACKER_SOUND_NODE_CHANGE);
    }
}

function CEContracker_GetPageParent(page) {
    let hNode = document.querySelector(`.node[data-title=${page.getAttribute("data-title")}]`);
    if (hNode) {
        return hNode.parentElement;
    }
}

function CEContracker_GetQuestPage(quest) {
    while ((quest = quest.parentElement) && !quest.classList.contains("page") && quest != document.body);
    return quest;
}

const QUEST_AUTOPILOT_INTERVAL = 0.5;

function CEContracker_GotoQuest(quest, interval = QUEST_AUTOPILOT_INTERVAL, preview = false) {
    let hQuest = document.querySelector(`.quest[data-index="${quest}"]`);
    if (!hQuest) return;

    let hStartPath = [];
    let hStartPage = g_hCurrentPage;
    let hEndPage = CEContracker_GetQuestPage(hQuest);

    if (hStartPage == hEndPage) {
        if (preview) {
            CEContracker_ShowPreview(hQuest);
            CEContracker_CreateAttractInk(hQuest);
            Creators.Actions.Sounds.play(CONTRACKER_SOUND_QUEST_HOVER);
        }
        return;
    }

    while (hStartPage) {
        hStartPath.push(hStartPage);
        hStartPage = CEContracker_GetPageParent(hStartPage);
    }

    let hEndPath = [];
    while (hEndPage) {
        hEndPath.push(hEndPage);
        hEndPage = CEContracker_GetPageParent(hEndPage);
    }

    let bDownCounter = 0;
    for (let path1 of hStartPath) {
        let bFound = false;
        for (let path2 of hEndPath) {
            if (path1 == path2) {
                bFound = true;
                break;
            }
        }
        if (!bFound) bDownCounter++;
        else break;
    }

    if (bDownCounter > 0) {
        CEContracker_GotoUpperNode();
        setTimeout(() => {
            CEContracker_GotoQuest(quest, interval, preview);
        }, interval * 1000);
        return;
    } else {
        for (let path of hEndPath) {
            let sTitle = path.getAttribute("data-title");
            let hTarget = g_hCurrentPage.querySelector(`.node[data-title=${sTitle}]`);
            if (hTarget) {
                CEContracker_GotoNamedNode(sTitle);
                setTimeout(() => {
                    CEContracker_GotoQuest(quest, interval, preview);
                }, interval * 1000);
                break;
            }
        }
    }
}

function CEContracker_SetDirectoryPath(path) {
    document.querySelector("#contracker_directory_field").innerText = path;
}

function CEContracker_CreatePageInk(page, x, y) {

    let flSizeMultiplier = .8;
    for(let Ink of page.querySelectorAll(".ink"))
    {
        let flSize = +Ink.getAttribute("data-size");
        if(flSizeMultiplier < flSize) flSizeMultiplier = flSize;
    }
    flSizeMultiplier += .03;

    let ink = document.createElement("div");
    ink.classList.add("ink");
    ink.style.left = (x - 30) + "px";
    ink.style.top = (y - 30) + "px";
    ink.setAttribute("data-size", flSizeMultiplier)
    page.prepend(ink);

    ink.animate({
        offsets: [0, 0.6],
        transform: [
            `scale(0)`,
            ``,
            `scale(${flSizeMultiplier})`
        ],
        opacity: [
            0,
            .8,
            0
        ]
    }, {
        duration: 500,
        interations: 1
    });

    setTimeout(() => {
        ink.remove()
    }, 500);
}

function CEContracker_CreateAttractInk(el) {
    let relX = el.offsetLeft - 160;
    let relY = el.offsetTop - 160;

    let ink = document.createElement("div");
    ink.classList.add("ink_attract");
    ink.style.left = relX + "px";
    ink.style.top = relY + "px";
    el.parentElement.prepend(ink);

    setTimeout(() => {
        ink.remove();
    }, 1000);

    setTimeout(() => {
        CEContracker_CreateQuestInk(el);
    }, 400);
}

function CEContracker_CreateQuestInk(quest) {
    let relX = quest.offsetLeft - 10;
    let relY = quest.offsetTop - 10;

    let ink = document.createElement("div");
    ink.className = "ink-quest";
    ink.style.left = relX + "px";
    ink.style.top = relY + "px";
    quest.parentElement.prepend(ink);

    setTimeout(() => {
        ink.remove();
    }, 1000);
}

function CEContracker_ToggleFullscreen(bForce) {
    let Element = document.querySelector(".cyoa-content");

    bForce = bForce === null ? false : bForce;

    let fullscreen = (document.fullscreenElement || document.webkitFullscreenElement ||
        document.mozFullScreenElement) != null;
    if ((bForce == null && fullscreen) || bForce === false) {
        document.cancelFullScreen = document.cancelFullScreen ||
            document.webkitCancelFullScreen ||
            document.mozCancelFullScreen ||
            (() => {
                return false
            });
        screen.orientation.unlock();
        document.cancelFullScreen();
    } else {
        Element.requestFullScreen = Element.requestFullScreen ||
            Element.webkitRequestFullScreen ||
            Element.mozRequestFullScreen ||
            (() => {
                return false
            });
        Element.requestFullScreen();
        if (screen.orientation.type != undefined) {
            screen.orientation.lock("landscape-primary").catch((err) => {
                return;
            });
        }
    }
}

function CEContracker_DrawLine(parent, target, x1, y1, x2, y2) {
    let el = Creators.Actions.DOM.makeSVG('line', {
        x1: x1,
        y1: y1,
        x2: x2,
        y2: y2,
        class: target.classList.contains("node") ? "dashed" : null
    });
    if (target.classList.contains("inactive")) {
        el.classList.add("inactive");
    }
    el.target = target;

    if (parent) {
        if (!parent.lines) parent.lines = [];
        parent.lines.push(el);
    }
    parent.parentElement.querySelector(".page-lines").appendChild(el);
}

async function CEContracker_Initialize() {
    for (let Quest of document.querySelectorAll(".quest")) {
        Quest.onmouseover = () => {
            // Ignore Quest if it is inactive.
            if (Quest.classList.contains("inactive")) return;

            if (Quest.classList.contains("quest-circular")) {
                // Animate the quest.
                Quest.animate([{
                    transform: 'scale(.9)'
                }, {
                    transform: 'scale(.8)'
                }], {
                    duration: 150,
                    iterations: 1
                });

                // And the icon.
                Quest.querySelector(".quest-icon")
                    .animate([{
                        transform: 'scale(.9)'
                    }, {
                        transform: 'scale(1)'
                    }], {
                        duration: 150,
                        iterations: 1
                    });

                CEContracker_CreateQuestInk(Quest);
            }


            // Play the sound.
            Creators.Actions.Sounds.play(CONTRACKER_SOUND_QUEST_HOVER);
        }

        CEContracker_DrawLines();
    }

    for (let Page of document.querySelectorAll(".page")) {
        Page.onclick = (e) => {
            if (!e.target.classList.contains("quest"))
                CEContracker_ClearAllPreviews();

            if (e.target !== Page) return;
            Creators.Actions.Sounds.play(CONTRACKER_SOUND_NULL_HOVER);

            CEContracker_CreatePageInk(Page, e.offsetX, e.offsetY);
        }
    }
    await CEContracker_RefreshProgress();
    CEContracker_RemoveLoading();

    Creators.Actions.Sounds.mute();
    CEContracker_GotoQuest(g_iActiveQuest, 0.1);
    Creators.Actions.Sounds.unmute();

    setInterval(() => {
        CEContracker_RefreshProgress();
    }, CONTRACKER_REFRESH_INTERVAL);
}

function CEContracker_RemoveLoading() {
    document.querySelector(".cyoa-preview").classList.remove("loading");
}

function CEContracker_DrawLines() {
    CEContracker_ClearAllLines();

    for (let Quest of document.querySelectorAll(".quest")) {
        let titles = JSON.parse(Quest.getAttribute("data-connect")) || [];
        let x1 = Quest.getAttribute("data-posx");
        let y1 = Quest.getAttribute("data-posy");

        for (let title of titles) {
            let Target = document.querySelector(`[data-title='${title}']`);
            if (Target) {
                let x2 = Target.getAttribute("data-posx");
                let y2 = Target.getAttribute("data-posy");

                CEContracker_DrawLine(Quest, Target, x1, y1, x2, y2);
            }
        }
    }
}

function CEContracker_ClearAllLines() {
    for (let a of document.querySelectorAll(".page-lines line")) {
        a.remove();
    }
}

let bPreviewQuest = -1;

function CEContracker_ShowPreview(quest) {
    if (!quest.parentElement) return;
    if (bPreviewQuest == quest) return;
    CEContracker_ClearAllPreviews();

    let el = document.createElement("div");
    el.classList.add("quest-preview");
    el.quest = quest;
    document.querySelector(".cyoa-preview").appendChild(el);

    const OFFSET_X = 40;
    bPreviewQuest = quest;

    let side = PREVIEW_NONE;
    let leftSpace = quest.offsetLeft - 50;
    let rightSpace = quest.parentElement.offsetWidth - leftSpace - 64;

    if (leftSpace > el.offsetWidth) side = PREVIEW_LEFT;
    else if (rightSpace > el.offsetWidth) side = PREVIEW_RIGHT;

    let posX = 0;
    switch (side) {
        case PREVIEW_LEFT:
            posX = quest.offsetLeft - el.offsetWidth - OFFSET_X;
            break;
        case PREVIEW_RIGHT:
            posX = quest.offsetLeft + quest.offsetWidth + OFFSET_X;
            break;
    }
    el.m_nSide = side;

    el.style.transformOrigin = side == PREVIEW_LEFT ? "left" : "right";
    el.style.left = posX + "px";

    CEContracker_AdjustPreviewOffset(el);
    Creators.Actions.Sounds.play(CONTRACKER_SOUND_CLICK);

    CEContracker_LoadPreview(el);
}

function CEContracker_FilterNestedByString(container, string) {
    string = (string || "").toLowerCase();
    for (let quest of container.children) {
        let bShow = false;
        if (string == "") {
            bShow = true;
        }

        if (quest.getAttribute("data-name").toLowerCase().includes(string)) {
            bShow = true;
        }

        if (bShow) {
            quest.style.display = "";
        } else {
            quest.style.display = "none";
        }
    }
}

function CEContracker_NestedClearSearch(element) {
    let hParent = element.parentElement.parentElement;
    if (hParent) {
        hParent = hParent.querySelector("input");
        if (hParent) {
            hParent.value = "";
            CEContracker_OnPressUpdateSearch(hParent);
        }
    }
}

function CEContracker_OnPressUpdateSearch(input) {
    let hParent = input.parentElement.parentElement.parentElement.parentElement;
    if (hParent) {
        hParent = hParent.querySelector(".page-list-scroll");
        CEContracker_FilterNestedByString(hParent, input.value);
    }
}

function CEContracker_ShowNestedPreview(quest) {
    if (!quest.parentElement) return;
    if (bPreviewQuest == quest) return;
    CEContracker_ClearAllPreviews();

    let hNest = CEContracker_FindNestedPreviewOfQuest(quest);
    if (hNest) {
        bPreviewQuest = quest;

        hNest.classList.add("active");
        hNest.quest = quest;
        hNest.classList.add("loading");

        Creators.Actions.Sounds.play(CONTRACKER_SOUND_CLICK);

        CEContracker_LoadPreview(hNest);
    }

}

function CEContracker_LoadPreview(el) {
    el.classList.add("loading");
    Creators.Actions.API.send("/api/IUsers/GContracker", {
            data: {
                get: "contract",
                contract: +el.quest.getAttribute("data-index"),
                html: "contracker"

            }
        })
        .then(e => {
            if (e.result == "SUCCESS") {
                el.innerHTML = e.contract.html;
                el.classList.remove("loading");
                CEContracker_AdjustPreviewOffset(el);

                if (e.contract.can_turnin) {
                    el.style.borderColor = "var(--cyoa-darkgreen)";
                } else if (e.contract.active) {
                    el.style.borderColor = "var(--cyoa-orange)";
                }
            }
        })
}

function CEContracker_AdjustPreviewOffset(preview) {
    if (preview.classList.contains("page-list-nest")) return;

    const MIN_Y = 10;
    const MAX_Y = document.querySelector(".cyoa-content").offsetHeight - 20;

    let posY = preview.quest.offsetTop + (preview.quest.offsetHeight / 2) - (preview.offsetHeight / 2) + preview.quest.parentElement.parentElement.offsetTop;
    if ((posY + preview.offsetHeight) > MAX_Y) posY = MAX_Y - preview.offsetHeight;
    if (posY < MIN_Y) posY = MIN_Y;

    preview.style.top = posY + "px";

    let hSvg = Creators.Actions.DOM.makeSVG("svg", {
        class: "quest_preview_svg",
        xmlns: "http://www.w3.org/2000/svg"
    });

    let iOffsetY = preview.quest.offsetTop - preview.offsetTop + preview.quest.offsetHeight;

    let sPoints = "";
    switch (preview.m_nSide) {
        case PREVIEW_RIGHT:
            sPoints = `50,${iOffsetY} 0,${iOffsetY + 10} 50,${iOffsetY + 20}`;
            break;
        case PREVIEW_LEFT:
            sPoints = `354,${iOffsetY} 404,${iOffsetY + 10} 354,${iOffsetY + 20}`;
            break;
    }

    hSvg.innerHTML = `<polygon points="${sPoints}" fill="var(--cyoa-orange)"></polygon>`;
    preview.appendChild(hSvg);
}

function CEContracker_ClearAllPreviews() {
    bPreviewQuest = -1;
    for (let a of document.querySelectorAll(".quest-preview")) {
        a.remove();
    }
}


function CEContracker_RestartPreviewIfExists() {
    let el = document.querySelector(".quest-preview");
    if (el) {
        CEContracker_LoadPreview(el);
    }
}

function CEContracker_RestartAllPreviewsIfExist(el) {
    let preview = CEContracker_FindNestedPreviewOfQuest(el);
    if (preview) {
        CEContracker_LoadPreview(preview);
    } else {
        CEContracker_RestartPreviewIfExists();
    }
}

function CEContracker_FindNestedPreviewOfQuest(quest) {
    let hWrapper = quest.parentElement.parentElement.parentElement;
    if (!hWrapper.classList.contains("page-list-wrapper")) return null;

    return hWrapper.querySelector(".page-list-nest");
}

async function CEContracker_SetContract(contract) {
    return new Promise((rs, rj) => {
        Creators.Actions.API.send("/api/IUsers/GContracker", {
                data: {
                    action: "activate",
                    contract: contract
                },
                method: "POST"
            })
            .then(rs)
            .catch(rj);
    });
}

async function CEContracker_TurnInContract(contract) {
    return new Promise((rs, rj) => {
        Creators.Actions.API.send("/api/IUsers/GContracker", {
                data: {
                    action: "turnin",
                    contract: contract
                },
                method: "POST"
            })
            .then(rs)
            .catch(rj);
    });
}

async function CEContracker_ButtonSetContract(el, contract) {
    el.classList.add("loading");
    await CEContracker_SetContract(contract);
    Creators.Actions.Sounds.play(CONTRACKER_SOUND_QUEST_ACTIVATE);

    el.classList.remove("loading");
    CEContracker_RefreshProgress();

    let quest = document.querySelector(`.quest[data-index="${contract}"]`);
    if (quest) {
        CEContracker_RestartAllPreviewsIfExist(quest);
    } else {
        CEContracker_RestartPreviewIfExists();
    }

    Preview_ShowNewItems();
}

function CEContracker_ButtonTurnIn(el, contract) {
    let bRequest = false;
    let bAnimation = false;

    function combine() {
        if (bRequest && bAnimation) {
            // Open new items preview.
            Creators.Actions.Sounds.play(CONTRACKER_SOUND_QUEST_ACCEPTED);
            CEContracker_UnlockEvents();

            let quest = document.querySelector(`.quest[data-index="${contract}"]`);
            if (quest) {
                CEContracker_RestartAllPreviewsIfExist(quest);
            } else {
                CEContracker_RestartPreviewIfExists();
            }

            CEContracker_RefreshProgress();

            Preview_ShowNewItems();
        }
    }
    el.classList.add("loading");
    Creators.Actions.Sounds.play(CONTRACKER_SOUND_QUEST_TURNIN);
    CEContracker_LockEvents();

    CEContracker_TurnInContract(contract)
        .then(e => {
            bRequest = true;
            combine();
        })

    setTimeout(() => {
        bAnimation = true;
        combine();
    }, 5200);
}

async function CEContracker_RefreshProgress() {
    return new Promise((rs, rj) => {

        Creators.Actions.API.send("/api/IUsers/GContracker", {
                data: {
                    get: "schema"
                }
            })
            .then((e) => {
                for (let hQuest of e.quests) {
                    hQuestDOM = document.querySelector(`.quest[data-index="${hQuest.id}"]`);
                    if (hQuestDOM) {

                        // Is Quest unlocked.
                        if (hQuest.is_unlocked) hQuestDOM.classList.remove("inactive");
                        else hQuestDOM.classList.add("inactive");

                        // Should quest be emiting pinging circles.
                        if (hQuest.is_active || hQuest.can_turnin) hQuestDOM.classList.add("pinging");
                        else hQuestDOM.classList.remove("pinging");

                        // Is Quest active?
                        if (hQuest.is_active) {
                            g_iActiveQuest = hQuest.id;
                        }

                        // Can Quest be turned in?
                        if (hQuest.can_turnin) hQuestDOM.classList.add("green");
                        else hQuestDOM.classList.remove("green");

                        for (let i = 0; i < hQuest.objectives.length; i++) {

                            let bCompleted = hQuest.objectives[i].completed;
                            let sClass = "";

                            switch (i) {
                                case 0:
                                    sClass = "first";
                                    break;
                                case 1:
                                    sClass = "second";
                                    break;
                                case 2:
                                    sClass = "third";
                                    break;
                            }

                            if (bCompleted) hQuestDOM.classList.add(sClass);
                            else hQuestDOM.classList.remove(sClass);
                        }
                    }
                }

                for (let hNode of document.querySelectorAll(".node")) {
                    let bDisable = false;
                    for (let hQuest of document.querySelectorAll(".quest")) {
                        if ((JSON.parse(hQuest.getAttribute("data-connect")) || []).includes(hNode.getAttribute("data-title"))) {
                            if (!hQuest.classList.contains("first")) bDisable = true;
                        }
                    }
                    if (bDisable) hNode.classList.add("inactive");
                }
                CEContracker_DrawLines();
                rs();
            })
            .catch(rj);
    });
}

function CEContracker_LockEvents() {
    document.querySelector(".cyoa-content").style.pointerEvents = "none";
}

function CEContracker_UnlockEvents() {
    document.querySelector(".cyoa-content").style.pointerEvents = "all";
}

CEContracker_Initialize();
