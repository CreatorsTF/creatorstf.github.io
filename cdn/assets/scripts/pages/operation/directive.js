let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let m_bBlockLevelAnimation = false;
let m_bIsPageFocused = true;
setInterval(() => {
    if (document.hasFocus()) {
        if (!m_bIsPageFocused) {
            onPageFocused();
            m_bIsPageFocused = true;
        }
    } else {
        if (m_bIsPageFocused) {
            onPageUnfocused();
            m_bIsPageFocused = false;
        }
    }
}, 200);

function onPageFocused() {
    m_bBlockLevelAnimation = false;
    CCampaignPage_RefreshProgress();
}

function onPageUnfocused() {
    m_bBlockLevelAnimation = true;
}

const CAMPAIGN_NAME = "mvm_directive";

const CAMPAIGN_LEVEL_TICK = SOUND_BASE + "/ui/campaign/pass_progress_tick_up.wav"
const SOUND_CLICK = SOUND_BASE + "/ui/buttonclickrelease.wav";
const QUEST_OBJECTIVE_PRIMARY = 0;

const SOUND_DRAWER_OPEN = SOUND_BASE + "/ui/slide_up.wav";
const SOUND_DRAWER_CLOSE = SOUND_BASE + "/ui/slide_down.wav";
const SOUND_LEVEL_UP = SOUND_BASE + "/ui/campaign/mvm_warning.wav";
const SOUND_LOOT = SOUND_BASE + "/ui/campaign/mm_rank_three_achieved.wav";

const CAMPAIGN_REFRESH_INTERVAL = 10; // seconds.

// MM_SOUND_JOIN = SOUND_BASE + "ui/mm_mvm_join.wav";
// MM_SOUND_QUEUE = SOUND_BASE + "ui/mm_mvm_queue.wav";

let m_hQuestOrder = [];
let m_iPreviewQuest = -1;
let m_iActiveQuest = -1;

let g_sLastRequest = "";
let g_bRefreshLocked = false;
let m_bAfterNewLevel = false;

function CCampaignPage_ToggleFullscreen(bForce) {
    let Element = document.body;

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

async function CCampaignPage_Initialize() {
    // Precaching all images to prevent invisible papers.

    m_hQuestOrder = document.querySelectorAll(".quest");
    m_hQuestOrder = Array.prototype.slice.call(m_hQuestOrder);

    setInterval(() => {
        CCampaignPage_RefreshProgress();
    }, CAMPAIGN_REFRESH_INTERVAL * 1000);

    if (m_iActiveQuest > -1) {
        CCampaignPage_ShowQuestPreview(m_iActiveQuest);
    }

    CCampaignPage_ReapplyPinStatus();
    CCampaignPage_ApplyCompactMode();
    CCampaignPage_ReorderQuests();

    let bRewardsOpened = localStorage.mvm_directive_rewards_closed != "true";
    CCampaignPage_ToggleRewardsDrawer(!bRewardsOpened, true);

    // Open the tour
    let sLastTour = localStorage.mvm_directive_tour;
    if (sLastTour) {
        CCampaignPage_OpenTourPreview(sLastTour);
    } else {
        // Find first tour
        let Tour = document.querySelector(".tour_container");
        if (Tour) {
            let sTour = Tour.getAttribute("data-tour");
            CCampaignPage_OpenTourPreview(sTour);
        }
    }

    CCampaignPage_RemoveLoading();
    CCampaignPage_RefreshProgress();

    document.body.classList.add("init");
}

function CCampaignPage_RemoveLoading() {
    for (let xOverlay of document.querySelectorAll(".quest_loading_overlay")) xOverlay.classList.remove("loading");
}

let m_hSoundToStop;

let g_bIsRefreshInProgress = false;
let g_iActiveLevel = -1;

function CCampaignPage_RefreshProgress() {
    return new Promise((rs, rj) => {
        if (g_bIsRefreshInProgress) return rs();
        if (g_bRefreshLocked) return rs();
        g_bIsRefreshInProgress = true;

        Creators.Actions.API.send("/api/IUsers/Campaign", {
                data: {
                    name: CAMPAIGN_NAME
                }
            })
            .then(async (e) => {
                if (e.result == "SUCCESS") {
                    let iCompletedQuests = 0;

                    for (let Quest of e.quests) {
                        if (Quest.is_completed) iCompletedQuests++;

                        let bStarted = Quest.objectives.filter(o => o.progress > 0).length > 0;

                        let QuestDOM = document.querySelector(`.quest[data-index="${Quest.id}"]`);
                        if (QuestDOM) {

                            if (Quest.is_completed) {
                                QuestDOM.classList.add("inactive");
                            } else {
                                QuestDOM.classList.remove("inactive");
                            }

                            if (bStarted) {
                                QuestDOM.classList.add("started");
                            } else {
                                QuestDOM.classList.remove("started");
                            }

                            for (let Objective of Quest.objectives) {
                                if (Objective.index == QUEST_OBJECTIVE_PRIMARY) {
                                    let ProgressBarLabel = QuestDOM.querySelector(".quest-preview-progress-text");
                                    if (ProgressBarLabel) {
                                        ProgressBarLabel.innerText = `${Objective.progress}/${Objective.limit} CP`
                                    }

                                    let ProgressBarLine = QuestDOM.querySelector(".quest-preview-progress-line");
                                    if (ProgressBarLine) {
                                        ProgressBarLine.style.width = `${Objective.progress / Objective.limit * 100}%`;
                                    }
                                }

                                let ObjectiveDOM = QuestDOM.querySelector(`.mechachievement_objective[data-index="${Objective.index}"]`);
                                if (ObjectiveDOM) {
                                    let Icon = ObjectiveDOM.querySelector("i.mdi");

                                    if (Objective.is_completed) {
                                        ObjectiveDOM.classList.add("completed");
                                        if (Icon) {
                                            Icon.className = "mdi mdi-checkbox-marked-circle";
                                        }
                                    } else {
                                        ObjectiveDOM.classList.remove("completed");
                                        if (Icon) {
                                            Icon.className = "mdi mdi-checkbox-blank-circle-outline";
                                        }
                                    }

                                    let ProgressText = ObjectiveDOM.querySelector("span.progress");
                                    if (ProgressText) {
                                        ProgressText.innerText = Objective.progress;
                                    }
                                }
                            }
                        }
                    }
                    CCampaignPage_ReorderQuests();

                    let iCompletedMissions = 0;
                    let iTotalMissions = 0;

                    for (let Tour of e.tours) {
                        let TourDOM = document.querySelector(`.tour_container[data-tour="${Tour.title}"]`);
                        if (TourDOM) {
                            let ProgressBarText = TourDOM.querySelector(".content_wrapper_header .campaign_level_label");
                            if (ProgressBarText) {
                                ProgressBarText.innerText = `${Tour.progress}/${Tour.limit}`;
                            }

                            let ProgressBarLine = TourDOM.querySelector(".content_wrapper_header .campaign_level_progress");
                            if (ProgressBarLine) {
                                ProgressBarLine.style.width = `${Tour.progress / Tour.limit * 100}%`;
                            }

                            for (let Mission of Tour.missions) {
                                iTotalMissions++;
                                if (Mission.is_completed) iCompletedMissions++;

                                let MissionDOM = TourDOM.querySelector(`.mission[data-mission="${Mission.title}"]`);
                                if (MissionDOM) {
                                    for (let Wave of Mission.waves) {
                                        let WaveDOM = MissionDOM.querySelector(`.wave_indicator[data-index="${Wave.index}"]`);
                                        if (WaveDOM) {
                                            if (Wave.is_completed) {
                                                WaveDOM.classList.add("completed");
                                            } else {
                                                WaveDOM.classList.remove("completed");
                                            }
                                        }
                                    }
                                }
                            }
                            CCampaignPage_ReorderTourMissions(Tour.title);
                        }
                    }

                    document.querySelector("#campaign_quests_completed").innerHTML = iCompletedQuests;
                    document.querySelector("#campaign_quests_bar").style.width = `${Math.min(iCompletedQuests / e.quests.length * 100, 100)}%`;

                    document.querySelector("#campaign_total_completed").innerHTML = e.campaign.progress;
                    document.querySelector("#campaign_total_bar").style.width = `${Math.min(e.campaign.progress / e.campaign.limit * 100, 100)}%`;

                    document.querySelector("#campaign_missions_completed").innerHTML = iCompletedMissions;
                    document.querySelector("#campaign_missions_bar").style.width = `${Math.min(iCompletedMissions / iTotalMissions * 100, 100)}%`;

                    let iNewLevels = 0;

                    function step(i) {
                        let Level = e.levels[i];
                        if (!Level) {
                            g_bIsRefreshInProgress = false;

                            if (iNewLevels > 0) {
                                Preview_ShowNewItems();
                                Creators.Actions.Sounds.play(SOUND_LOOT);
                            }
                            return;
                        }

                        let LevelDOM = document.querySelector(`.progress_element[data-index="${Level.index + 1}"]`);
                        if (LevelDOM) {
                            // if (Level.is_active || g_iActiveLevel == Level.index) {
                            //
                            //     // Slowly fulfull the progress bar with new stuff.
                            //     document.querySelector("#campaign_level_bar").style.transitionDuration = "2.5s";
                            //     document.querySelector("#campaign_level_bar").style.width = `${hLevel.progress / hLevel.limit * 100}%`;
                            // }

                            // Don't do anything at the bottom if page is blocked.
                            if (m_bBlockLevelAnimation) {
                                g_bIsRefreshInProgress = false;
                                return;
                            }

                            if (Level.is_active) g_iActiveLevel = Level.index;

                            // Make sure we aren't doing anything more if progress of this level hasn't changed.
                            if (LevelDOM.getAttribute("data-progress") == Level.progress) return step(i + 1);
                            LevelDOM.setAttribute("data-progress", Level.progress);

                            // If, for any reason, this level has become uncomplete
                            // we remove the completed classname.
                            if (!Level.is_completed) {
                                LevelDOM.classList.remove("completed");
                            }

                            // Updating DOM of the level to have new data.
                            LevelDOM.querySelector(".campaign_level_progress").style.width = `${Level.progress / Level.limit * 100}%`;
                            LevelDOM.querySelector(".campaign_total_completed").innerText = Level.progress;

                            // If we just changed the level recently, play the sound.
                            if (m_bAfterNewLevel) {
                                let hAudio = new Audio(CAMPAIGN_LEVEL_TICK);
                                hAudio.volume = 0.5;
                                hAudio.play();
                            }
                            m_bAfterNewLevel = false;

                            // Let's give a user 2.5s time to understand what has happened.
                            setTimeout(() => {
                                // If this level has been completed, play the animation.
                                if (Level.is_completed) {
                                    // Mark this level as completed.
                                    LevelDOM.classList.add("completed");

                                    if (m_hSoundToStop) m_hSoundToStop.pause();

                                    Creators.Actions.Sounds.play(SOUND_LEVEL_UP);

                                    // Make sure next iterated level plays the sound.
                                    m_bAfterNewLevel = true;
                                    iNewLevels++;

                                    // document.querySelector("#campaign_level_bar").style.transitionDuration = "0.1s";
                                    // document.querySelector("#campaign_level_bar").style.width = 0;

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

function CCampaignPage_LockEvents() {
    document.querySelector(".drawer").style.pointerEvents = "none";
}

function CCampaignPage_UnlockEvents() {
    document.querySelector(".drawer").style.pointerEvents = "all";
}

function CCampaignPage_ReorderQuests() {
    let hQuestContainer = document.querySelector(".quests_wrapper");

    let aQuests = hQuestContainer.querySelectorAll(".quest");
    aQuests = Array.prototype.slice.call(aQuests);

    aQuests = aQuests.filter((a) => {
        if (a.style.display == "none") {
            a.style.opacity = 0;
            a.style.top = "-100px";
        }
        return a.style.display != "none";
    })

    aQuests.sort((a, b) => {

        let iStateA = 0,
            iStateB = 0;

        iStateA = 4 - a.getAttribute("data-difficulty");
        iStateB = 4 - b.getAttribute("data-difficulty");

        if (a.classList.contains("started")) iStateA = 4;
        if (b.classList.contains("started")) iStateB = 4;

        if (a.classList.contains("inactive")) iStateA = -1;
        if (b.classList.contains("inactive")) iStateB = -1;

        if (a.classList.contains("pinned")) iStateA = 5;
        if (b.classList.contains("pinned")) iStateB = 5;

        if (iStateA == iStateB) {
            return GetHTMLElementIndexInParent(a) > GetHTMLElementIndexInParent(b) ? 1 : -1;
        } else return iStateA < iStateB ? 1 : -1;
    });

    let iOffset = 0;
    for (let i in aQuests) {
        let quest = aQuests[i];
        quest.style.top = iOffset + "px";
        quest.style.opacity = 1;
        iOffset += quest.clientHeight + 10;
    }
}

function CCampaignPage_KeyUpSearch(el) {
    CCampaignPage_FilterQuests(el.value);
}

function CCampaignPage_FilterQuests(name) {
    if (!name) name = document.querySelector("#quests_search").value;
    for (let quest of m_hQuestOrder) {
        let bShouldFilter = true;

        if (name && !("" + name).isEmpty()) {
            let sNeedle = name.toLowerCase().trim();

            if (quest.getAttribute("data-title").toLowerCase().includes(sNeedle)) bShouldFilter = false;
            if (quest.getAttribute("data-name").toLowerCase().includes(sNeedle)) bShouldFilter = false;

            for (let Objective of quest.querySelectorAll(".mechachievement_objective")) {
                if (Objective.textContent.toLowerCase().includes(sNeedle)) bShouldFilter = false;
            }

        } else bShouldFilter = false;

        if (!CCampaignPage_IsDifficultyEnabled(quest.getAttribute("data-difficulty"))) bShouldFilter = true;

        if (bShouldFilter) {
            quest.style.display = "none";
        } else {
            quest.style.display = "";
        }
    }

    CCampaignPage_ReorderQuests();
}

function CCampaignPage_IsDifficultyEnabled(group) {
    let el = document.querySelector(`input[type=checkbox][value='${group}']`);
    if (el) {
        return el.checked;
    }
    return true;
}

function CCampaignPage_ClearSearch() {
    document.querySelector("#quests_search").value = "";

    CCampaignPage_FilterQuests(null);
}

function CCampaignPage_ButtonQuestTogglePin(el) {
    let Quest = el.parentElement;
    CCampaignPage_QuestTogglePin(Quest);
}

function CCampaignPage_ReapplyPinStatus() {
    let aPinned = localStorage.mvm_directive_pinned || [];
    for (let Quest of document.querySelectorAll(".quest")) {
        let sTitle = Quest.getAttribute("data-title");
        if (aPinned.includes(sTitle)) {
            Quest.classList.add("pinned");
        } else {
            Quest.classList.remove("pinned");
        }
    }

    CCampaignPage_ReorderQuests();
}

function CCampaignPage_QuestTogglePin(quest) {
    Creators.Actions.Sounds.play(SOUND_CLICK);

    let aPinned = JSON.parse(localStorage.mvm_directive_pinned || "[]");
    let sTitle = quest.getAttribute("data-title");

    if (aPinned.includes(sTitle)) {
        aPinned.splice(aPinned.indexOf(sTitle), 1);
    } else {
        aPinned.push(sTitle);
    }

    localStorage.mvm_directive_pinned = JSON.stringify(aPinned);

    CCampaignPage_ReapplyPinStatus();
}

function CCampaignPage_ButtonTourPreview(title) {
    Creators.Actions.Sounds.play(SOUND_CLICK);
    CCampaignPage_OpenTourPreview(title);
}

function CCampaignPage_OpenTourPreview(title) {
    localStorage.mvm_directive_tour = title;
    for (let Tour of document.querySelectorAll(".tour_container")) {
        if (Tour.getAttribute("data-tour") == title) {
            Tour.classList.add("visible");
            CCampaignPage_ReorderTourMissions(title);
        } else {
            Tour.classList.remove("visible");
        }
    }

    for (let TourBtn of document.querySelectorAll(".toolbar_tour")) {
        if (TourBtn.getAttribute("data-tour") == title) {
            TourBtn.classList.add("select");
        } else {
            TourBtn.classList.remove("select");
        }
    }
}

function CCampaignPage_ReorderTourMissions(tour) {
    let Tour = document.querySelector(`.tour_container[data-tour='${tour}']`);
    if (Tour) {
        let aMissions = Tour.querySelectorAll(".mission");
        aMissions = Array.prototype.slice.call(aMissions);

        aMissions = aMissions.filter((a) => {
            if (a.style.display == "none") a.style.top = "-100px";
            return a.style.display != "none";
        })

        aMissions.sort((a, b) => {

            let iStateA = 0,
                iStateB = 0;

            let aWavesA = [...a.querySelectorAll(".wave_indicator")];
            let aWavesB = [...b.querySelectorAll(".wave_indicator")];

            let iMaxWavesA = aWavesA.length;
            let iMaxWavesB = aWavesB.length;

            let iCompletedWavesA = aWavesA.filter(m => m.classList.contains("completed")).length;
            let iCompletedWavesB = aWavesB.filter(m => m.classList.contains("completed")).length;

            if (iCompletedWavesA == iMaxWavesA) iStateA = -1;
            else if (iCompletedWavesA > 0) iStateA = 1;

            if (iCompletedWavesB == iMaxWavesB) iStateB = -1;
            else if (iCompletedWavesB > 0) iStateB = 1;

            if (iStateA == iStateB) {
                return GetHTMLElementIndexInParent(a) > GetHTMLElementIndexInParent(b) ? 1 : -1;
            } else return iStateA < iStateB ? 1 : -1;
        });

        let iOffset = 0;
        for (let i in aMissions) {
            let mission = aMissions[i];
            mission.style.top = iOffset + "px";
            iOffset += mission.clientHeight + 10;
        }
    }
}

CCampaignPage_Initialize();

function GetHTMLElementIndexInParent(element) {
    return [...element.parentElement.children].indexOf(element);
}

String.prototype.isEmpty = function() {
    return (this.length === 0 || !this.trim());
};

function CCampaignPage_ToggleQuestsDrawer(force = null) {
    let Drawer = document.querySelector(".quests_wrapper");
    if (Drawer) {
        if (force === null) {
            Drawer.classList.toggle("opened");
        } else {
            if (force) {
                Drawer.classList.add("opened");
            } else {
                Drawer.classList.remove("opened");
            }
        }

        let bOpened = Drawer.classList.contains("opened");
        if (bOpened) {
            Creators.Actions.Sounds.play(SOUND_DRAWER_OPEN);
        } else {
            Creators.Actions.Sounds.play(SOUND_DRAWER_CLOSE);
        }

        for (let Fade of document.querySelectorAll(".fade_on_quests_drawer")) {
            if (bOpened) {
                Fade.classList.add('fade');
            } else {
                Fade.classList.remove('fade');
            }
        }

        for (let Arrow of document.querySelectorAll(".quests_drawer_button_arrow")) {
            if (bOpened) {
                Arrow.innerHTML = "&gt;";
            } else {
                Arrow.innerHTML = "&lt;";
            }
        }
    }
}

function CCampaignPage_ToggleRewardsDrawer(force = null, silent = false) {
    let Drawer = document.querySelector(".reward");
    if (Drawer) {
        if (force === null) {
            Drawer.classList.toggle("closed");
        } else {
            if (force) {
                Drawer.classList.remove("closed");
            } else {
                Drawer.classList.add("closed");
            }
        }

        let bOpened = !Drawer.classList.contains("closed");
        if(!silent)
        {
            if (bOpened) {
                Creators.Actions.Sounds.play(SOUND_DRAWER_OPEN);
            } else {
                Creators.Actions.Sounds.play(SOUND_DRAWER_CLOSE);
            }
        }

        for (let Arrow of document.querySelectorAll(".rewards_drawer_button_arrow")) {
            if (bOpened) {
                Arrow.innerHTML = "&gt;";
            } else {
                Arrow.innerHTML = "&lt;";
            }
        }

        localStorage.mvm_directive_rewards_closed = bOpened;
    }
}

function CCampaignPage_ToggleCompactMode(force = null) {
    let bEnabled = localStorage.mvm_directive_compact == "true";
    if (force === null) {
        bEnabled = !bEnabled;
    } else {
        bEnabled = force === true;
    }
    console.log(bEnabled);

    localStorage.mvm_directive_compact = bEnabled;

    CCampaignPage_ApplyCompactMode();

    Creators.Actions.Sounds.play(SOUND_CLICK);
}

function CCampaignPage_ApplyCompactMode() {
    let bEnabled = localStorage.mvm_directive_compact == "true";

    let Btn = document.querySelector("#btn_compact_switch");
    if (Btn) {
        if (bEnabled) {
            Btn.innerHTML = `<i class="mdi mdi-view-compact"></i> COMPACT LAYOUT`;
            document.body.classList.add("compact_mode");
        } else {
            Btn.innerHTML = `<i class="mdi mdi-view-compact-outline"></i> WIDE LAYOUT`;
            document.body.classList.remove("compact_mode");
        }
    }
    CCampaignPage_ReorderQuests();
}
