let m_sCurrentSteamID;

let m_flLoadtime = new Date().getTime();
let m_flNextUncoverTime = 0.0;
let m_flNextAutoSwitch = 0;
let m_flUncoverTime = 0.0;

let m_bShouldAutoSwitch = false;

let m_xCurrentUncoveredItem;

let m_bShouldAnimateTourProgress = false;
let m_flNextTourProgressAnimation = 0.0;

let m_bShouldAnimateCampaignProgress = false;
let m_flNextCampaignProgressAnimation = 0.0;

const TOURLOOT_RARITY_NORMAL = 0;
const TOURLOOT_RARITY_RARE = 1;
const TOURLOOT_RARITY_SUPERRARE = 2;

// Amount of time to wait until we switch to the next SteamID.
const TOURLOOT_SECONDS_UNTIL_AUTOSWITCH = 4;

const TOURLOOT_SECONDS_UNTIL_TOUR_ANIMATION = 1;
const TOURLOOT_SECONDS_UNTIL_CAMPAIGN_ANIMATION = 1.8;

const TOURLOOT_SOUND_ITEM_NORMAL = SOUND_BASE + "ui/itemcrate_smash_common.wav";
const TOURLOOT_SOUND_ITEM_RARE = SOUND_BASE + "ui/itemcrate_smash_mid.wav";
const TOURLOOT_SOUND_ITEM_SUPERRARE = SOUND_BASE + "ui/itemcrate_smash_ultrarare_fireworks.wav";
const TOURLOOT_SOUND_TICK_IN = SOUND_BASE + "ui/campaign/pass_progress_tick_up.wav";

function GetPageTime() {
    return (new Date().getTime() - m_flLoadtime) / 1000;
}

function CTourLoot_OpenSteamIDPage(steamid) {
    m_bShouldAutoSwitch = false;
    m_sCurrentSteamID = steamid;
    m_flNextUncoverTime = GetPageTime() + 0.5;
    m_flNextAutoSwitch = GetPageTime() + TOURLOOT_SECONDS_UNTIL_AUTOSWITCH;

    let hSections = document.querySelectorAll(".tourloot_player_section");
    for (let section of hSections) {
        let bVisible = section.getAttribute("data-steamid") == steamid;

        if (bVisible) {
            section.classList.add("visible");

            m_bShouldAnimateTourProgress = true;
            m_flNextTourProgressAnimation = GetPageTime()
                                                + TOURLOOT_SECONDS_UNTIL_TOUR_ANIMATION;

            m_bShouldAnimateCampaignProgress = true;
            m_flNextCampaignProgressAnimation = GetPageTime()
                                                + TOURLOOT_SECONDS_UNTIL_TOUR_ANIMATION
                                                + TOURLOOT_SECONDS_UNTIL_CAMPAIGN_ANIMATION;
        } else {
            section.classList.remove("visible");
        }
    }

    for (let icon of document.querySelectorAll(".tourloot_avatar")) {
        let bVisible = icon.getAttribute("data-steamid") == steamid;

        if (bVisible) {
            icon.classList.add("active");
        } else {
            icon.classList.remove("active");
        }
    }
}

function CTourLoot_GetNextCoveredItem(panel) {
    let xItems = panel.querySelectorAll(".tourloot_grid_slot");
    for (let xItem of xItems) {
        if (xItem.querySelector(".tourloot_rarity_cover") == null) continue;
        if (xItem.querySelector(".item") == null) continue;
        return xItem;
    }
}

function CTourLoot_GetPlayerPanelBySteamID(steamid) {
    for (let section of document.querySelectorAll(".tourloot_player_section")) {
        if (section.getAttribute("data-steamid") != steamid) continue;

        return section;
    }
}

function CTourLoot_ShouldUncoverNextItem() {}

function CTourLoot_OnThink() {
    let xPanel = CTourLoot_GetPlayerPanelBySteamID(m_sCurrentSteamID);
    if (xPanel) {
        let xItem = CTourLoot_GetNextCoveredItem(xPanel);
        if (xItem) {
            if (m_xCurrentUncoveredItem != xItem && GetPageTime() <= m_flNextUncoverTime) return;

            let iRarity = CTourLoot_GetItemRarity(xItem);

            let flOpenTime, flUncoverTime,
                sUncoverSound,
                EmitUncoverParticle;

            switch (iRarity) {
                case TOURLOOT_RARITY_NORMAL:
                    flUncoverTime = 0;
                    flOpenTime = 0.5;
                    sUncoverSound = TOURLOOT_SOUND_ITEM_NORMAL;
                    EmitUncoverParticle = CParticleSystem_TourLootCommon;
                    break;

                case TOURLOOT_RARITY_RARE:
                    flUncoverTime = 2;
                    flOpenTime = 4;
                    sUncoverSound = TOURLOOT_SOUND_ITEM_RARE;
                    EmitUncoverParticle = CParticleSystem_TourLootRare;
                    break;

                case TOURLOOT_RARITY_SUPERRARE:
                    flUncoverTime = 3;
                    flOpenTime = 14;
                    sUncoverSound = TOURLOOT_SOUND_ITEM_SUPERRARE;
                    EmitUncoverParticle = CParticleSystem_TourLootSuperRare;
                    break;
            }

            if (m_xCurrentUncoveredItem != xItem) {
                m_flNextUncoverTime = GetPageTime() + flOpenTime;
                m_flNextAutoSwitch = GetPageTime() + flOpenTime + TOURLOOT_SECONDS_UNTIL_AUTOSWITCH;
                m_flUncoverTime = GetPageTime() + flUncoverTime;
                m_xCurrentUncoveredItem = xItem;

                Creators.Actions.Sounds.play(sUncoverSound, .6);

                EmitUncoverParticle(xItem);
            }

            if (GetPageTime() < m_flUncoverTime) return;

            CTourLoot_UncoverItem(xItem);
        }

        if(m_bShouldAnimateTourProgress)
        {
            if(GetPageTime() > m_flNextTourProgressAnimation)
            {
                let bShouldPlaySound = false;
                m_bShouldAnimateTourProgress = false;

                for(let xProgress of xPanel.querySelectorAll(".tourloot_tour_bar[data-progress]"))
                {
                    let flNewProgressWidth = xProgress.getAttribute("data-progress");
                    if(xProgress.style.width != flNewProgressWidth)
                    {
                        bShouldPlaySound = true;
                        xProgress.style.width = flNewProgressWidth;
                    }
                    xProgress.removeAttribute("data-progress");
                }

                if(bShouldPlaySound)
                {
                    Creators.Actions.Sounds.play(TOURLOOT_SOUND_TICK_IN);
                }
            }
        }

        if(m_bShouldAnimateCampaignProgress)
        {
            if(GetPageTime() > m_flNextCampaignProgressAnimation)
            {
                let bShouldPlaySound = false;
                m_bShouldAnimateCampaignProgress = false;

                for(let xProgress of xPanel.querySelectorAll(".tourloot_level_bar_progress[data-progress]"))
                {
                    let flNewProgressWidth = xProgress.getAttribute("data-progress");
                    if(xProgress.style.width != flNewProgressWidth)
                    {
                        bShouldPlaySound = true;
                        xProgress.style.width = flNewProgressWidth;
                    }
                    xProgress.removeAttribute("data-progress");
                }

                if(bShouldPlaySound)
                {
                    Creators.Actions.Sounds.play(TOURLOOT_SOUND_TICK_IN);
                }
            }
        }
    }

    if (CTourLoot_ShouldAutoSwitchNow()) {
        let sNextSteamID = CTourLoot_GetNextSteamID();
        if (sNextSteamID) {
            CTourLoot_OpenSteamIDPage(sNextSteamID);
            m_bShouldAutoSwitch = true;
        }
    }
}

function CTourLoot_GetNextSteamID() {
    let bReturnThis = false;

    for (let icon of document.querySelectorAll(".tourloot_avatar")) {
        let sSteamID = icon.getAttribute("data-steamid");
        if (bReturnThis) {
            return sSteamID;
        }

        bReturnThis = sSteamID == m_sCurrentSteamID;
    }
}

function CTourLoot_ShouldAutoSwitchNow() {
    return m_bShouldAutoSwitch && (m_flNextAutoSwitch < GetPageTime());
}

function CTourLoot_UncoverItem(xItem) {
    let xCover = xItem.querySelector(".tourloot_rarity_cover");
    if (xCover) {
        xCover.remove();
    }
}

function CTourLoot_GetItemRarity(xItem) {
    switch (+xItem.getAttribute("data-rarity")) {
        case 3:
            return TOURLOOT_RARITY_SUPERRARE;
            break;
        case 2:
            return TOURLOOT_RARITY_RARE;
            break;
        default:
            return TOURLOOT_RARITY_NORMAL;
            break;
    }
}

// ============================= //
// Particles
// ============================= //

function CParticleSystem_TourLootRare(xParent) {
    let iFrame = 0;
    let iMaxFrames = 1616;

    let hLoop = setInterval(() => {

        if (iFrame >= iMaxFrames) {
            clearInterval(hLoop);
            return;
        }

        switch (iFrame) {

            // Start with spawning fuse particle.
            case 0:
                CParticle_Fuse(xParent);
                break;

            // Then we make an explosion when crate unlocks.
            case 200:
                CParticle_SmallExplosion(xParent);
                CParticle_DustCloud(xParent);
                CParticle_DustCloud(xParent);
                break;
        }

        iFrame++;
    }, 10);
}

function CParticleSystem_TourLootSuperRare(xParent) {
    let iFrame = 0;
    let iMaxFrames = 1616;

    let hLoop = setInterval(() => {

        if (iFrame >= iMaxFrames) {
            clearInterval(hLoop);
            return;
        }

        switch (iFrame) {

            // MvM pop bubbles first.
            case 0:
            case 82:
            case 112:
                CParticle_MvMPow(xParent);
                break;

                // Then we make an explosion when crate unlocks.
            case 295:
                CParticle_SmallExplosion(xParent);
                CParticle_DustCloud(xParent);
                CParticle_DustCloud(xParent);

                for (let i = 0; i < 18; i++) {
                    CParticle_Firework(xParent);
                }
                break;

            case 320:
                CParticle_Sunbeams(xParent, 5);
                break;

            case 406:
            case 451:
            case 509:
            case 542:
            case 743:
            case 791:
            case 811:
            case 893:
            case 972:
            case 1026:
            case 1094:
            case 1158:
            case 1283:
            case 1345:
            case 1434:
                CParticle_Firework(xParent);
                break;
        }

        iFrame++;
    }, 10);
}

function CParticleSystem_TourLootCommon(xParent) {
    // ==================== //
    // Explosion
    let xExplosion = CParticle_SmallExplosion(xParent);

    // ==================== //
    // Dust Clouds
    let nDustCount = Math.round(Math.random() * 2 + 1);
    for (let i = 0; i < nDustCount; i++) {
        CParticle_DustCloud(xParent);
    }
}

function CParticle_Sunbeams(xParent, lifetime = 5) {
    let flPosX = xParent.getBoundingClientRect().x + (xParent.clientWidth / 2);
    let flPosY = xParent.getBoundingClientRect().y + (xParent.clientHeight / 2);

    let sNames = ["single", "wide"];

    let m_flEndTime = GetPageTime() + lifetime;
    let hInterval = setInterval(() => {

        if (m_flEndTime < GetPageTime()) {
            clearInterval(hInterval);
            return;
        }

        let sName = `/cdn/assets/images/inventory/particles/spotlight_${sNames[Math.floor(Math.random() * sNames.length)]}.png`;
        let flRot = Math.random() * 360;

        let xParticle = CBaseParticle_Create(sName, flPosX, flPosY, 4);

        xParticle.animate({
            offsets: [0, 0.05, 0.95],
            transform: [
                `scale(2) rotate(${flRot}deg)`,
                ``,
                ``,
                `scale(1) rotate(${flRot - 40}deg)`
            ],
            opacity: [0, .4, .4, 0],
            easing: ["ease"]
        }, {
            duration: 4000,
            interations: 1
        });
    }, 300);
}

function CParticle_FireworkTrail(xParent) {
    const MAX_DEVIATION = 3;

    let flPosX = xParent.getBoundingClientRect().x + (xParent.getBoundingClientRect().width / 2) + (Math.random() * 2 - 1) * MAX_DEVIATION;
    let flPosY = xParent.getBoundingClientRect().y + (xParent.getBoundingClientRect().height / 2) + (Math.random() * 2 - 1) * MAX_DEVIATION;

    let lifetime = .5;

    let sName = `/cdn/assets/images/inventory/particles/fireworks_trail.png`;
    let xParticle = CBaseParticle_Create(sName, flPosX, flPosY, lifetime, 5, 5);

    xParticle.animate({
        opacity: [.5, 0]
    }, {
        duration: lifetime * 1000,
        interations: 1
    });

    return xParticle;
}

function CParticle_Firework(xParent) {
    let flPosX = xParent.getBoundingClientRect().x + (xParent.clientWidth / 2);
    let flPosY = xParent.getBoundingClientRect().y + (xParent.clientHeight / 2);

    const MAGNITUDE_MIN = 120;
    const MAGNITUDE_MAX = 300;

    let flAng = Math.floor(Math.random() * 360);
    let flMagnitute = Math.random() * (MAGNITUDE_MAX - MAGNITUDE_MIN) + MAGNITUDE_MIN;

    let sName = `/cdn/assets/images/inventory/particles/fireworks_sparkler_spritesheet.png`;

    let xParticle = CBaseParticle_Create(sName, flPosX, flPosY, 1.4, 50, 50);
    xParticle.classList.add("tf_particle_firework");

    xParticle.animate({
        offsets: [0, 0.90],
        transform: [
            `rotateZ(${flAng}deg)  translate(0, -20px)`,
            ``,
            `rotateZ(${flAng}deg)  translate(0, -${flMagnitute}px)`
        ],
        opacity: [0, .8, 0],
        easing: ["ease-out"]
    }, {
        duration: 1500,
        interations: 1
    });

    let m_flEndTime = GetPageTime() + 1.4;
    let hInterval = setInterval(() => {

        if (m_flEndTime < GetPageTime() ||
            !xParticle
        ) {
            clearInterval(hInterval);
            return;
        }

        CParticle_FireworkTrail(xParticle);
    }, 20);

    return xParticle;
}

function CParticle_Fuse(xParent) {
    let flPosX = xParent.getBoundingClientRect().x + (xParent.getBoundingClientRect().width / 2);
    let flPosY = xParent.getBoundingClientRect().y + (xParent.getBoundingClientRect().height / 2);

    let sName = `/cdn/assets/images/inventory/particles/fuse_spritesheet.png`;

    let xParticle = CBaseParticle_Create(sName, flPosX, flPosY, 2.5, 100, 100);
    xParticle.classList.add("tf_particle_fuse");

    xParticle.animate({
        offsets: [0, 0.90],
        opacity: [1, 1, 0]
    }, {
        duration: 2500,
        interations: 1
    });

    return xParticle;
}

function CParticle_DustCloud(xParent) {
    let flPosX = xParent.getBoundingClientRect().x + (xParent.clientWidth / 2);
    let flPosY = xParent.getBoundingClientRect().y + (xParent.clientHeight / 2);

    let flDustOffset = 20;
    let flCloudRot = Math.random() * 360;
    let flDirectionX = Math.cos(flCloudRot / (180 / Math.PI)) * flDustOffset;
    let flDirectionY = Math.sin(flCloudRot / (180 / Math.PI)) * flDustOffset;

    let sName = `/cdn/assets/images/inventory/particles/dust_cloud_${Math.round(Math.random() * 2) + 1}.png`;

    let xParticle = CBaseParticle_Create(sName, flPosX, flPosY, .8);

    xParticle.animate([{
            transform: `scale(0.9)`,
            opacity: 0.5
        },
        {
            opacity: 1
        },
        {
            transform: `scale(1.2) translate(${flDirectionX}px, ${flDirectionY}px)`,
            opacity: 0
        },
    ], {
        duration: 800,
        interations: 1
    });

    return xParticle;
}

function CParticle_MvMPow(xParent) {
    let flPosX = xParent.getBoundingClientRect().x + (xParent.clientWidth / 2);
    let flPosY = xParent.getBoundingClientRect().y + (xParent.clientHeight / 2);

    let OFFSET_MIN = 100;
    let OFFSET_MAX = 150;

    let sNames = ["bam", "boing", "boot", "caber", "crack", "crash", "crit", "loot", "pow", "punch", "smash"];

    let flOffset = Math.round(Math.random() * (OFFSET_MAX - OFFSET_MIN) + OFFSET_MIN);
    let flVelocityRot = Math.random() * 360;

    let flVelocityX = Math.cos(flVelocityRot / (180 / Math.PI)) * flOffset;
    let flVelocityY = Math.sin(flVelocityRot / (180 / Math.PI)) * flOffset;

    let sName = `/cdn/assets/images/inventory/particles/mvm_pow_${sNames[Math.floor(Math.random() * sNames.length)]}.png`;

    let xParticle = CBaseParticle_Create(sName, flPosX, flPosY, 1);

    xParticle.animate({
        offsets: [0, 0.95],
        transform: [
            `scale(0.5)`,
            ``,
            `translate(${flVelocityX}px, ${flVelocityY}px) scale(1)`
        ],
        opacity: [.5, 1, 0],
        easing: ["ease"]
    }, {
        duration: 1000,
        interations: 1
    });

    return xParticle;
}

function CParticle_SmallExplosion(xParent) {
    let flPosX = xParent.getBoundingClientRect().x + (xParent.clientWidth / 2);
    let flPosY = xParent.getBoundingClientRect().y + (xParent.clientHeight / 2);

    let flRotation = Math.random() * 360;
    let flRotationDelta = Math.random() * 60 - 30;

    let sName = `/cdn/assets/images/inventory/particles/explosion_small.png`;

    let xParticle = CBaseParticle_Create(sName, flPosX, flPosY, .2);

    xParticle.animate([{
            transform: `scale(0.7) rotate(${flRotation}deg)`,
            opacity: 0.5
        },
        {
            opacity: .8
        },
        {
            transform: `scale(1) rotate(${flRotation + flRotationDelta}deg)`,
            opacity: 0
        },
    ], {
        duration: 200,
        interations: 1
    });

    return xParticle;
}

function CBaseParticle_Create(image, x, y, lifetime = 5, width = 100, height = 100) {

    lifetime -= .05;

    let xElement = document.createElement("div");
    xElement.classList.add("tf_particle");

    xElement.style.width = width + "px";
    xElement.style.height = height + "px";
    xElement.style.margin = `${-height / 2}px 0 0 ${-width / 2}px`;
    xElement.style.height = height + "px";

    xElement.style.left = x + "px";
    xElement.style.top = y + "px";

    xElement.style.backgroundImage = `url(${image})`;
    document.body.append(xElement);

    setTimeout(() => {
        xElement.remove();
    }, lifetime * 1000);

    return xElement;
}

setInterval(CTourLoot_OnThink, 0.1);
