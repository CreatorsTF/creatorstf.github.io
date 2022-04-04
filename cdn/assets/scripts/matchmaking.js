const MM_QUERY_STATUS_INITITATED = 0;
const MM_QUERY_STATUS_FINDING_SERVERS = 1;
const MM_QUERY_STATUS_CHANGING_MAPS = 2;
const MM_QUERY_STATUS_FAILED = 3;
const MM_QUERY_STATUS_CANCELLED = 4;
const MM_QUERY_STATUS_FINISHED = 5;

const MM_QUERY_UPDATE_INTERVAL = 3; // 3 seconds.

let MM_SOUND_JOIN = SOUND_BASE + "ui/mm_join.wav";
let MM_SOUND_QUEUE = SOUND_BASE + "ui/mm_queue.wav";

let m_bMMIsSearchInProgress = false;
let m_aActiveMatchResults = [];

//------------------------------------------------------
// Matchmaking Page related functions
//------------------------------------------------------
function Matchmaking_CreateMatchWithPageOptions() {
    let xOptions = {};

    xOptions.region = document.querySelector("#mm_option_region").value;
    xOptions.region_locked = document.querySelector("input[name=region_locked]").checked;
    xOptions.map = document.querySelector("#mapname").value;
    xOptions.mission = document.querySelector("#missionname").value;

    Matchmaking_CreateMatch(xOptions);
}

//------------------------------------------------------
// General Matchmaking functions
//------------------------------------------------------
function Matchmaking_CreateMatch(options = {}) {

    // Can't create another match, one is already in progress.
    if (m_bMMIsSearchInProgress) return;
    m_bMMIsSearchInProgress = true;
    m_aActiveMatchResults = [];

    Creators.Actions.API.send("/api/IMatchmaking/Match", {
            method: "POST",
            data: options
        })
        .then(r => {
            if (r.result == "SUCCESS") {
                localStorage.matchmaking_match_id = r.match_id;

                Creators.Actions.Sounds.play(MM_SOUND_QUEUE);

                Matchmaking_CheckMatchStatus(r.match_id);
            } else {
                m_bMMIsSearchInProgress = false;
            }
        })
        .catch(d => {
            m_bMMIsSearchInProgress = false;
            Creators.Actions.Modals.error({
                name: `Error ${d.error.code}`,
                innerText: d.error.title
            });
        })
}

function Matchmaking_CancelMatch(match_id) {
    Creators.Actions.API.send("/api/IMatchmaking/Match", {
        method: "DELETE",
        data: {
            match_id
        }
    });
}

function Matchmaking_CancelActiveMatch(match_id) {
    if (m_bMMIsSearchInProgress) {
        let sMatchID = localStorage.matchmaking_match_id;
        if (sMatchID) {
            Matchmaking_CancelMatch(sMatchID);
        }
    }
    localStorage.removeItem("matchmaking_match_id");

    Matchmaking_SetStatusPanelVisible(false);
    Matchmaking_SetResultPanelVisible(false);

    m_bMMIsSearchInProgress = false;
    m_aActiveMatchResults = [];
}

function Matchmaking_CheckMatchStatus(match_id) {
    Creators.Actions.API.send("/api/IMatchmaking/Match", {
            data: {
                match_id,
                embed_html: true,
                best_result: true
            }
        })
        .then(r => {
            if (r.result == "SUCCESS") {

                // Also check if our current match id matches id in localStorage.
                if (match_id != localStorage.matchmaking_match_id) return;

                // Calculating if this search is still in progress.
                let bSearchInProgress = false;
                switch (r.status) {
                    case MM_QUERY_STATUS_INITITATED:
                    case MM_QUERY_STATUS_FINDING_SERVERS:
                    case MM_QUERY_STATUS_CHANGING_MAPS:
                        bSearchInProgress = true;
                        break;
                }

                let bStatusPanelVisible = false;
                let bResultPanelVisible = false;

                if (bSearchInProgress) {
                    bStatusPanelVisible = true;

                    // Update search status log message.
                    switch (r.status) {
                        case MM_QUERY_STATUS_INITITATED:
                        case MM_QUERY_STATUS_FINDING_SERVERS:
                            Matchmaking_SetStatusPanelLog(`Searching for servers...`);
                            break;
                        case MM_QUERY_STATUS_CHANGING_MAPS:
                            Matchmaking_SetStatusPanelLog(`Trying to rotate maps on empty servers...`);
                            break;
                    }

                    // Request new match information in a while.
                    setTimeout(() => {

                        // Check for active match id once more, just to be sure...
                        if (match_id != localStorage.matchmaking_match_id) return;

                        Matchmaking_CheckMatchStatus(match_id);
                    }, MM_QUERY_UPDATE_INTERVAL * 1000);
                } else {
                    if (m_bMMIsSearchInProgress) {
                        Creators.Actions.Sounds.play(MM_SOUND_JOIN);
                    }
                    bResultPanelVisible = true;
                    m_aActiveMatchResults = r.servers;

                    Matchmaking_ResetResultPanelServerList();
                    Matchmaking_SetResultShowMoreServerCount(r.servers.length);


                    let xBestServer = r.servers[0];
                    if (xBestServer) {
                        let xContainer = document.querySelector("#matchmaking_result_panel .qps_server_container");
                        if (xContainer) {
                            xContainer.innerHTML += xBestServer.html;
                        }
                    }
                }

                m_bMMIsSearchInProgress = bSearchInProgress;

                Matchmaking_SetStatusPanelVisible(bStatusPanelVisible);
                Matchmaking_SetResultPanelVisible(bResultPanelVisible);
            } else {
                Matchmaking_SetStatusPanelVisible(false);
                Matchmaking_SetResultPanelVisible(false);
            }
        })
}

//------------------------------------------------------
// Status Panel functions
//------------------------------------------------------
function Matchmaking_ShowFullActiveMatchResults() {
    if (m_aActiveMatchResults.length > 0) {
        Creators.Actions.Modals.alert({
            name: "Search Results",
            innerHTML: m_aActiveMatchResults.map(s => s.html).join(""),
            options: {
                height: "500px",
                width: "700px"
            }
        });
    }
}

//------------------------------------------------------
// Status Panel functions
//------------------------------------------------------
function Matchmaking_SetStatusPanelVisible(visible) {
    let xStatusPanel = document.querySelector("#matchmaking_status_panel");
    if (xStatusPanel) {
        if (visible) {
            xStatusPanel.classList.add("visible");
        } else {
            xStatusPanel.classList.remove("visible");
        }
    }
}

function Matchmaking_SetStatusPanelLog(msg) {
    let xText = document.querySelector("#matchmaking_status_panel .qps-log");
    if (xText) {
        xText.innerText = msg;
    }
}

//------------------------------------------------------
// Result Panel functions
//------------------------------------------------------
function Matchmaking_SetResultPanelVisible(visible) {
    let xStatusPanel = document.querySelector("#matchmaking_result_panel");

    if (xStatusPanel.querySelector(".qps_server_container").children.length > 0) {
        xStatusPanel.querySelector(".qps-log").innerText = `Warning! Search results may not be 100% accurate.`;
    } else {
        xStatusPanel.querySelector(".qps-log").innerText = `We could not find any servers matching your request at this time. Please try again later.`;
    }

    if (xStatusPanel) {
        if (visible) {
            xStatusPanel.classList.add("visible");
        } else {
            xStatusPanel.classList.remove("visible");
        }
    }
}

function Matchmaking_ResetResultPanelServerList(visible) {
    let xContainer = document.querySelector("#matchmaking_result_panel .qps_server_container");
    if (xContainer) {
        xContainer.innerHTML = '';
    }
}

function Matchmaking_SetResultShowMoreServerCount(count) {
    let xBtn = document.querySelector("#matchmaking_result_panel .qps_show_more");
    if (xBtn) {
        if (count > 0) {
            xBtn.innerText = `Show More (${count})`;
            xBtn.style.display = "";
        } else {
            xBtn.style.display = "none";
        }
    }
}

//------------------------------------------------------
// Coop Tour functions
//------------------------------------------------------
function Matchmaking_SelectAllMissions(enabled = false) {
    for (let xCheckbox of document.querySelectorAll(".qp_tour_mission input[type=checkbox]")) {
        xCheckbox.checked = enabled;
    }
}

function Matchmaking_SelectNoncompletedMissions(enabled = false) {
    Matchmaking_SelectAllMissions(false);
    for (let xCheckbox of document.querySelectorAll(".qp_tour_mission:not(.completed) input[type=checkbox]")) {
        xCheckbox.checked = enabled;
    }
}

function Matchmaking_SelectNoncompletedMissionsFromCheckbox(el) {
    document.querySelector("#checkbox_any_mission").checked = false;
    Matchmaking_SelectNoncompletedMissions(el.checked);
}

function Matchmaking_SelectAllMissionsFromCheckbox(el) {
    document.querySelector("#checkbox_not_completed").checked = false;
    Matchmaking_SelectAllMissions(el.checked);
}

function Matchmaking_CreateMatchFromCoopTourPage() {
    // Grab all the mission names.
    let aMissions = [...document.querySelectorAll(".qp_tour_mission input[type=checkbox]:checked")].map(e => e.name);

    if (aMissions.length < 1) return;

    Matchmaking_CreateMatch({
        missions: aMissions,
        region: Matchmaking_GetRegionCodeFromPage(),

        // Options
        region_locked: Matchmaking_GetOptionsFromPage().region_locked
    });
}

//------------------------------------------------------
// Pubs functions
//------------------------------------------------------

function Matchmaking_SelectAllGamemodesFromCheckbox(el) {
    Matchmaking_SelectAllGamemodes(el.checked);
}

function Matchmaking_SelectAllGamemodes(enabled = false) {
    for (let xCheckbox of document.querySelectorAll("#quickplay_gamemodes input[type=checkbox]")) {
        xCheckbox.checked = enabled;
    }
}

function Matchmaking_CreateMatchFromPubsPage() {
    // Grab all the mission names.
    let aMaps = [...document.querySelectorAll(".quickplay_gamemode input[type=checkbox]:checked")].map(e => e.name);

    if (aMaps.length < 1) return;

    Matchmaking_CreateMatch({
        maps: aMaps,
        region: Matchmaking_GetRegionCodeFromPage(),

        // Options
        region_locked: Matchmaking_GetOptionsFromPage().region_locked
    });
}

function Matchmaking_GetOptionsFromPage() {
    return {
        region_locked: document.querySelector("input[name=region_locked]").checked || false
    };
}

function Matchmaking_GetRegionCodeFromPage() {
    return document.querySelector("#mm_option_region").value;
}

document.addEventListener("DOMContentLoaded", function(event) {
    let sMatchID = localStorage.matchmaking_match_id;
    if (sMatchID) {
        Matchmaking_CheckMatchStatus(sMatchID);
    }
});

async function Matchmaking_OpenAssetsAlertBeforeRedirect(url)
{
    event.preventDefault();

    let bShouldShow = localStorage.mm_asset_msg_shown != "true";
    if(bShouldShow)
    {
        await Matchmaking_OpenAssetPackAlertMessage();
        localStorage.mm_asset_msg_shown = true;
    }

    document.location.href = url;
}

function Matchmaking_OpenAssetPackAlertMessage() {
    return new Promise((rs, rj) => {
        Creators.Actions.Modals.alert({
                name: "Hey! Before you go...",
                innerHTML: `
<p>The server you're about to join has several custom downloads, so you may want to download these assets through our website to skip the long wait!</p>
<p>You can do this manually by downloading the <a href='/assetpack' target='_blank'>zip</a>, or automatically by installing our <a href='/launcher' target='_blank'>launcher</a>.</p>
<p>Closing this popup will connect you to the server.</p>`
            })
            .then(() => {
                rs();
            })
            .catch(() => {
                rj();
            })
    });
}
