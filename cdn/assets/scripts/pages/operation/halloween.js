let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let m_bBlockLevelAnimation = false;
let m_bIsPageFocused = true;
setInterval(() => {
    if(document.hasFocus())
    {
        if(!m_bIsPageFocused)
        {
            onPageFocused();
            m_bIsPageFocused = true;
        }
    } else {
        if(m_bIsPageFocused)
        {
            onPageUnfocused();
            m_bIsPageFocused = false;
        }
    }
}, 200);

function onPageFocused()
{
    m_bBlockLevelAnimation = false;
    CCHalloween_RefreshProgress();
}

function onPageUnfocused()
{
    m_bBlockLevelAnimation = true;
}

const HALLOWEEN_SOUND_QUEST_OPEN = SOUND_BASE + "/ui/cyoa/quest_folder_open_halloween.wav";
const HALLOWEEN_SOUND_QUEST_CLOSE = SOUND_BASE + "/ui/cyoa/quest_folder_close_halloween.wav";
const HALLOWEEN_SOUND_TURNIN = SOUND_BASE + "/ui/cyoa/quest_turn_in_decode_halloween.wav";
const HALLOWEEN_SOUND_TURNIN_ACCEPTED = SOUND_BASE + "/ui/cyoa/quest_turn_in_accepted_halloween.wav";
const HALLOWEEN_SOUND_ACTIVATED = SOUND_BASE + "/ui/cyoa/quest_decode_halloween.wav";
const HALLOWEEN_SOUND_CLICK = SOUND_BASE + "/ui/buttonclickrelease.wav";
const QUEST_OBJECTIVE_PRIMARY = 0;

const CAMPAIGN_LOOT_1 = SOUND_BASE + "/ui/campaign/pass_loot_1_halloween.wav"
const CAMPAIGN_LOOT_2 = SOUND_BASE + "/ui/campaign/pass_loot_2_halloween.wav"
const CAMPAIGN_LOOT_3 = SOUND_BASE + "/ui/campaign/pass_loot_3_halloween.wav"
const CAMPAIGN_LOOT_4 = SOUND_BASE + "/ui/campaign/pass_loot_4_halloween.wav"
const CAMPAIGN_LEVEL_TICK = SOUND_BASE + "/ui/campaign/pass_progress_tick_up.wav"
const CAMPAIGN_LEVEL_UP = SOUND_BASE + "/ui/campaign/pass_level_up_halloween.wav"
const CAMPAIGN_ITEM_FOUND = SOUND_BASE + "/ui/campaign/pass_item_found.wav"

const CAMPAIGN_LOOT_SOUNDS = [
    CAMPAIGN_LOOT_1,
    CAMPAIGN_LOOT_2,
    CAMPAIGN_LOOT_3,
    CAMPAIGN_LOOT_4
];

const QUESTS_GROUP_VALVE = 1;
const QUESTS_GROUP_BOSSES = 0;
const QUESTS_GROUP_COMMUNITY = 3;

let m_hQuestGroups = {
    "official": [
        "cp_gorge_event",
        "cp_manor_event",
        "koth_harvest_event",
        "koth_lakeside_event",
        "koth_viaduct_event",
        "plr_hightower_event",
        "sd_doomsday_event"
    ],
    "bosses": [
        "horseman",
        "monoculus",
        "merasmus"
    ],
    "community": [
        "koth_hauntson_event",
        "koth_spillway_event",
        "koth_synthetic_event",
        "pd_scarab",
        "pl_breadspace",
        "pl_terror_event"
    ]
};

// All possible papers.
const HALLOWEEN_PAPERS_BACKGROUND = [
    "/cdn/assets/images/tf_campaign/halloween/quests/contracts_papers_ghost.png",
    "/cdn/assets/images/tf_campaign/halloween/quests/contracts_papers_merasmus.png",
    "/cdn/assets/images/tf_campaign/halloween/quests/contracts_papers_monoculus.png",
    "/cdn/assets/images/tf_campaign/halloween/quests/contracts_papers_horseman.png",
    "/cdn/assets/images/tf_campaign/halloween/quests/contracts_papers_breadmonster.png"
];

let m_hQuestOrder = [];
let m_iPreviewQuest = -1;
let m_iActiveQuest = -1;

let g_sLastRequest = "";
let g_bRefreshLocked = false;
let m_iCampaignItemIndex = +(document.querySelector(".campaign_item").getAttribute("data-index"));
let m_bAfterNewLevel = false;

async function CCHalloween_Initialize() {
    // Precaching all images to prevent invisible papers.
    for (let img of HALLOWEEN_PAPERS_BACKGROUND) {
        let Img = new Image();
        Img.src = img;
    }

    for(let snd of CAMPAIGN_LOOT_SOUNDS)
    {
        Creators.Actions.Sounds.precache(snd);
    }

    m_hQuestOrder = document.querySelectorAll(".merasmission_folded");
    m_hQuestOrder = Array.prototype.slice.call(m_hQuestOrder);

    for(let quest of m_hQuestOrder)
    {
        for(let group in m_hQuestGroups)
        {
            if(m_hQuestGroups[group].includes(quest.getAttribute("data-title")))
            {
                quest.setAttribute("data-group", group);
                break;
            }
        }
    }

    // Precaching sounds.
    Creators.Actions.Sounds.precache(HALLOWEEN_SOUND_QUEST_OPEN);
    Creators.Actions.Sounds.precache(HALLOWEEN_SOUND_QUEST_CLOSE);
    Creators.Actions.Sounds.precache(HALLOWEEN_SOUND_CLICK);
    Creators.Actions.Sounds.precache(HALLOWEEN_SOUND_TURNIN);
    Creators.Actions.Sounds.precache(HALLOWEEN_SOUND_ACTIVATED);
    Creators.Actions.Sounds.precache(HALLOWEEN_SOUND_TURNIN_ACCEPTED);
    Creators.Actions.Sounds.precache(CAMPAIGN_LEVEL_UP);

    await CCHalloween_RefreshProgress();
    CCHalloween_RemoveLoading();

    setInterval(() => {
        CCHalloween_RefreshProgress();
    }, 5000);

    if(m_iActiveQuest > -1)
    {
        CCHalloween_ShowQuestPreview(m_iActiveQuest);
    }

    if(m_bShouldShowNewItems)
    {
        // Sound will not play unless interacts with the page.
        // so we show this modal to the user so that they interact.
        await Creators.Actions.Modals.alert({
            name: "Huzzah!",
            innerText: "You have new items!"
        });

        Creators.Actions.Sounds.play(CAMPAIGN_ITEM_FOUND);
        Preview_ShowNewItems();
    }
}

// Purpose: Fade currently active preview and remove it.
function CCHalloween_FadeActivePreview() {
    Creators.Actions.Sounds.play(HALLOWEEN_SOUND_QUEST_CLOSE);
    let Merasmission = document.querySelector(".preview .merasmission");
    if (!Merasmission) return;

    Merasmission.classList.add("folding");
    setTimeout(() => {
        Merasmission.remove();
    }, 1000);
}

async function CCHalloween_SetContract(contract) {
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

async function CCHalloween_ButtonSetContract(el, contract) {
    el.classList.add("loading");
    await CCHalloween_SetContract(contract);
    Creators.Actions.Sounds.play(HALLOWEEN_SOUND_ACTIVATED);

    el.classList.remove("loading");
    el.style.display = "none";
    CCHalloween_RefreshProgress();
}

function CCHalloween_UpdateQuestPreviewSleeve()
{

}

function CCHalloween_RemoveLoading() {
    document.querySelector(".quest_loading_overlay").classList.remove("loading");
}

// Purpose: Handle from Folded Merasmission onclick.
function CCHalloween_OnClickQuestFolded(el) {

    CCHalloween_ShowQuestPreview(el.getAttribute("data-index"));
}

// Purpose: Show Quest Preview.
function CCHalloween_ShowQuestPreview(quest) {
    let hEl = document.querySelector(`.merasmission_folded[data-index="${quest}"]`);
    CCHalloween_MarkQuestActive(hEl);

    let name = hEl.getAttribute("data-name");

    if (m_iPreviewQuest == quest) return;
    m_iPreviewQuest = quest;

    CCHalloween_FadeActivePreview();

    let hMerasmission = document.createElement("div");
    hMerasmission.classList.add("merasmission");
    hMerasmission.innerHTML += `<div class="merasmission_title">${name}</div>`;
    hMerasmission.innerHTML += `<div class="merasmission_wrapper"></div>`;

    let hWrapper = document.querySelector(".preview");
    hWrapper.prepend(hMerasmission);
    Creators.Actions.Sounds.play(HALLOWEEN_SOUND_QUEST_OPEN);

    Creators.Actions.API.send("/api/IUsers/GContracker", {
        data: {
            get: "contract",
            contract: quest,
            html: "halloween"
        }
    }).then(e => {
        let hContent = hMerasmission.querySelector(".merasmission_wrapper");
        hContent.innerHTML = e.contract.html;
        hMerasmission.classList.add("loaded");

        if (e.contract.image) {
            hMerasmission.style.backgroundImage = `url(${e.contract.image})`;
        }
    });
}

let m_hSoundToStop;

function CCHalloween_OnClickQuestTurnIn(el, id) {
    let bRequest = false;
    let bAnimation = false;

    let hMerasmission = document.querySelector(".merasmission");
    if (!hMerasmission) return;

    hMerasmission.classList.add("turnin");
    Creators.Actions.Sounds.play(HALLOWEEN_SOUND_CLICK);
    m_hSoundToStop = Creators.Actions.Sounds.play(HALLOWEEN_SOUND_TURNIN);

    CCHalloween_LockEvents();
    g_bRefreshLocked = true;

    CCHalloween_TurnIn(id)
        .then(d => {
            bRequest = true;
            combine();
        })

    setTimeout(() => {
        hMerasmission.classList.remove("turnin");
        hMerasmission.classList.add("stamped");
        Creators.Actions.Sounds.play(HALLOWEEN_SOUND_TURNIN_ACCEPTED);
        hMerasmission.classList.remove("turnin");
        hMerasmission.querySelector(".quest-preview-progress-line").style.background = "#551b12";

        let hButton = document.querySelector(".merasmission_turnin");
        hButton.remove();



        setTimeout(() => {
            bAnimation = true;
            combine();
        }, 2500);
    }, 4500);

    function combine() {
        if (bRequest && bAnimation) {
            CCHalloween_UnlockEvents();
            g_bRefreshLocked = false;
            m_bAfterNewLevel = true;

            CCHalloween_RefreshProgress();

        }
    }
}

function CCHalloween_TurnIn(quest) {
    return new Promise((rs, rj) => {
        Creators.Actions.API.send("/api/IUsers/GContracker", {
                data: {
                    action: "turnin",
                    contract: quest
                },
                method: "POST"
            })
            .then(rs)
            .catch(rj);
    });
}

function CCHalloween_MarkQuestActive(el) {
    for (let a of document.querySelectorAll(".merasmission_folded")) {
        a.classList.remove("active");
    }
    el.classList.add("active");
}

let g_bIsRefreshInProgress = false;
let g_iActiveLevel = -1;

function CCHalloween_RefreshProgress() {
    return new Promise((rs, rj) => {
        if (g_bIsRefreshInProgress) return rs();
        if (g_bRefreshLocked) return rs();
        g_bIsRefreshInProgress = true;

        Creators.Actions.API.send("/api/IUsers/GContracker", {
                data: {
                    get: "schema",
                    campaign: "halloween"
                }
            })
            .then(async (e) => {
                if (e.result == "SUCCESS") {
                    let iCompletedQuests = 0;

                    for (let hQuest of e.quests) {
                        let hQuestDOM = document.querySelector(`.merasmission_folded[data-index="${hQuest.id}"]`);

                        if (hQuestDOM) {
                            if (hQuest.is_completed) iCompletedQuests++;

                            // Is Quest unlocked.
                            if (hQuest.is_turned) hQuestDOM.classList.add("inactive");
                            else hQuestDOM.classList.remove("inactive");

                            // Can Quest be turned.
                            if (hQuest.can_turnin) hQuestDOM.classList.add("turnin");
                            else hQuestDOM.classList.remove("turnin");

                            // Can Quest be turned.
                            if (hQuest.is_active) {
                                m_iActiveQuest = hQuest.id;
                                hQuestDOM.classList.add("started");
                            }
                            else hQuestDOM.classList.remove("started");

                            if(hQuest.id == m_iPreviewQuest)
                            {
                                let hPreview = document.querySelector(".merasmission");

                                let hElement = hPreview.querySelector(".merasmission_activate");
                                if(hElement)
                                {
                                    if (hQuest.is_active) hElement.style.display = "none";
                                    else hElement.style.display = "block";
                                }

                                let hBarLabel = hPreview.querySelector(".quest-preview-progress-text");
                                if(hBarLabel)
                                {
                                    hBarLabel.innerHTML = `${hQuest.objectives[0].progress}/${hQuest.objectives[0].limit} MP`;
                                }

                                let hBarSaved = hPreview.querySelector(".quest-preview-progress-line");
                                if(hBarSaved)
                                {
                                    hBarSaved.style.width = `${hQuest.objectives[0].progress / hQuest.objectives[0].limit * 100}%`;
                                }

                                let hBarTurnin = hPreview.querySelector(".merasmission_turnin");
                                if(hBarTurnin)
                                {
                                    if(hQuest.can_turnin)
                                    {
                                        hBarTurnin.style.display = "block";
                                    } else {
                                        hBarTurnin.style.display = "";
                                    }
                                }

                                let hBarWait = hPreview.querySelector(".merasmission_wait_for_round");
                                if(hBarWait)
                                {

                                    if(hQuest.is_waiting_for_trusted)
                                    {
                                        hBarWait.style.display = "block";
                                    } else {
                                        hBarWait.style.display = "";
                                    }
                                }
                            }
                        }
                    }

                    CCHalloween_ReorderQuests();

                    document.querySelector("#campaign_quests_completed").innerHTML = iCompletedQuests;
                    document.querySelector("#campaign_quests_bar").style.width = `${Math.min(iCompletedQuests / e.quests.length * 100, 100)}%`;

                    document.querySelector("#campaign_total_completed").innerHTML = e.campaign.points;
                    document.querySelector("#campaign_total_bar").style.width = `${Math.min(e.campaign.points / e.campaign.limit * 100, 100)}%`;

                    let iNewLevels = 0;

                    function step(i) {
                        let hLevel = e.campaign.levels[i];
                        if (!hLevel) {
                            g_bIsRefreshInProgress = false;

                            if(iNewLevels > 0)
                            {
                                Preview_ShowNewItems();

                                var snd = CAMPAIGN_LOOT_SOUNDS[Math.floor(Math.random() * CAMPAIGN_LOOT_SOUNDS.length)];
                                Creators.Actions.Sounds.play(snd);
                            }
                            return;
                        }

                        let hLevelDOM = document.querySelector(`.progress_element[data-index="${hLevel.index + 1}"]`);
                        if (hLevelDOM) {
                            if (hLevel.is_active || g_iActiveLevel == hLevel.index) {

                                // If this level is the active one, we're updating global counters to represent the stats.
                                document.querySelector("#campaign_next_level").innerHTML = hLevel.index + 1;
                                document.querySelector("#campaign_level_completed").innerHTML = hLevel.progress;
                                document.querySelector("#campaign_level_limit").innerHTML = hLevel.limit;

                                // Slowly fulfull the progress bar with new stuff.
                                document.querySelector("#campaign_level_bar").style.transitionDuration = "2.5s";
                                document.querySelector("#campaign_level_bar").style.width = `${hLevel.progress / hLevel.limit * 100}%`;
                            }
                            // Don't do anything at the bottom if page is blocked.
                            if(m_bBlockLevelAnimation) return step(i + 1);

                            if(hLevel.is_active) g_iActiveLevel = hLevel.index;

                            // Make sure we aren't doing anything more if progress of this level hasn't changed.
                            if (hLevelDOM.getAttribute("data-progress") == hLevel.progress) return step(i + 1);
                            hLevelDOM.setAttribute("data-progress", hLevel.progress);

                            // If, for any reason, this level has become uncomplete
                            // we remove the completed classname.
                            if (!hLevel.is_completed) {
                                hLevelDOM.classList.remove("completed");
                            }

                            // Updating DOM of the level to have new data.
                            hLevelDOM.querySelector(".progress_bar_progress").style.width = `${hLevel.progress / hLevel.limit * 100}%`;
                            hLevelDOM.querySelector(".tooltip__html .campaign_level_progress").style.width = `${hLevel.progress / hLevel.limit * 100}%`;
                            hLevelDOM.querySelector(".tooltip__html .campaign_level_label_completed").innerHTML = hLevel.progress;

                            // If we just changed the level recently, play the sound.
                            if (m_bAfterNewLevel) {
                                let hAudio = new Audio(CAMPAIGN_LEVEL_TICK);
                                hAudio.volume = 0.1;
                                hAudio.play();
                            }
                            m_bAfterNewLevel = false;

                            // Let's give a user 2.5s time to understand what has happened.
                            setTimeout(() => {
                                // If this level has been completed, play the animation.
                                if (hLevel.is_completed) {
                                    // Mark this level as completed.
                                    hLevelDOM.classList.add("completed");

                                    if(m_hSoundToStop) m_hSoundToStop.pause();

                                    Creators.Actions.Sounds.play(CAMPAIGN_LEVEL_UP);

                                    // Make sure next iterated level plays the sound.
                                    m_bAfterNewLevel = true;
                                    iNewLevels++;

                                    document.querySelector("#campaign_level_bar").style.transitionDuration = "0.1s";
                                    document.querySelector("#campaign_level_bar").style.width = 0;

                                    setTimeout(() => {
                                        return step(i + 1);
                                    }, 1000);

                                } else {
                                    return step(i + 1);
                                }
                            }, 2500);
                        }
                    }
                    step(0);
                    rs();
                }
            });
    });
}

function CCHalloween_LockEvents() {
    document.querySelector(".drawer").style.pointerEvents = "none";
}

function CCHalloween_UnlockEvents() {
    document.querySelector(".drawer").style.pointerEvents = "all";
}

function CCHalloween_ReorderQuests() {
    let hQuestContainer = document.querySelector(".quests_container");

    let hQuests = hQuestContainer.querySelectorAll(".merasmission_folded");
    hQuests = Array.prototype.slice.call(hQuests);

    hQuests = hQuests.filter((a) => {
        if(a.style.display == "none") a.style.top = "-100px";
        return a.style.display != "none";
    })

    hQuests.sort((a, b) => {

        let iStateA = 0,
            iStateB = 0;

        if (a.classList.contains("inactive")) iStateA = -1;
        if (b.classList.contains("inactive")) iStateB = -1;

        if (a.classList.contains("started")) iStateA = 2;
        if (b.classList.contains("started")) iStateB = 2;

        if (a.classList.contains("turnin")) iStateA = 3;
        if (b.classList.contains("turnin")) iStateB = 3;

        if (iStateA == iStateB)
        {
            return m_hQuestOrder.indexOf(a) > m_hQuestOrder.indexOf(b) ? 1 : -1;
        } else return iStateA < iStateB ? 1 : -1;
    });

    for (let i in hQuests)
    {
        let quest = hQuests[i];
        quest.style.top = (i * (quest.clientHeight - 7)) + "px";
    }
}

function CCHalloween_KeyUpSearch(el)
{
    CCHalloween_FilterQuests(el.value);
}

function CCHalloween_FilterQuests(name)
{
    if(!name) name = document.querySelector("#quests_search").value;
    for(let quest of m_hQuestOrder)
    {
        let bShouldFilter = true;
        if(name && name != "")
        {
            if(quest.getAttribute("data-title").toLowerCase().includes(name.toLowerCase())) bShouldFilter = false;
            if(quest.getAttribute("data-name").toLowerCase().includes(name.toLowerCase())) bShouldFilter = false;
        } else bShouldFilter = false;

        if(!CCHalloween_IsGroupEnabled(quest.getAttribute("data-group"))) bShouldFilter = true;

        if(bShouldFilter)
        {
            quest.style.display = "none";
        } else {
            quest.style.display = "";
        }
    }

    CCHalloween_ReorderQuests();
}

function CCHalloween_IsGroupEnabled(group)
{
    let el = document.querySelector(`input[type=checkbox][value='${group}']`);
    if(el) {
        return el.checked;
    }
    return true;
}

function CCHalloween_ClearSearch()
{
    document.querySelector("#quests_search").value = "";
    CCHalloween_FilterQuests(null);
}

CCHalloween_Initialize();
