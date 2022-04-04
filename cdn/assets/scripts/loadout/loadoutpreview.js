//@ts-check
/*
TF2 Realtime Cosmetic Preview system using THREE.JS
By Robert Straub, robertstraub.co.uk, rob5300.
For use on Creators.TF.
Custom modifications to THREE.js are required for this to operate. Do not replace the library without replicating the changes.

All TF2 Assets are owned by Valve Software and as such they maintain the rights to these assets.
If by request they should be removed they will be, please send an email to us and we will handle this request.

Custom code is owned by Robert and the Creators.TF team.
No reuse or redistribution may be done without explicit written permission by Robert and/or Creators.TF team member.
We reserve the write to revoke permission at any time.
*/

import * as THREE from "../external/three.module.js"; //This is modified and cannot be replaced by a fresh three.js copy.
import { GLTFLoader } from "./GLTFLoader.js";
import { OrbitControls } from "./OrbitControls.js";

const ROOT_GLB_PATH = "/cdn/assets/glbs/";
const LOADING_TEXTURE_PATH = "/cdn/assets/images/tf_logo_white_square.png";
const secondaryAnimationPath = "animations/{class}/secondary.glb";
const meleeAnimationPath = "animations/{class}/melee.glb";
const customAnimationPath = "animations/{class}/";

//These cannot change as the text is set in items.json.
//New ones can be added but follow similar scheme.
const hatKey = "HAT";
const headphonesKEY = "HEADPHONES_S";
const pyroBackpack = "BACKPACK_P";
const head = "HEAD";
const shoesSocks = "SHOES_SOCKS_S";
const dogtags = "DOGTAGS_S";
const medalKey = "MEDAL";
const gammaCorrectionAmount = 2.2;

const WeaponType = {
    PRIMARY: "primary",
    SECONDARY: "secondary",
    MELEE: "melee",
};

//Classes
//Populate classes with nulls for now for spaces for each class.
//Classes from 0 to 8.
//Scout, Soldier, Pyro, Demoman, Heavy, Engineer, Medic, Sniper, Spy
class TF2ClassData {
    constructor(path, skeletonName, modelNames, stringName) {
        //Path to where the glb is stored, relative to the root dir.
        this.path = path;

        //Name of the skeleton inside the glb. Be warned that . characters are removed soo scout.qc_skeleton becomes scoutqc_skeleton.
        this.skeleton = skeletonName;

        //Array of KVPair to connect keys to model names that can be hidden.
        this.models = modelNames;

        //Human readable name for the class. MUST match the directory for its cosmetics.
        this.name = stringName;
    }
}

class KVPair {
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
}

//Storage of class glb paths
//Follow TF2ClassData constructor args for each, if there are no models for 'modelNames' then put null.
//Storage path is set to be relative to root ( ./ )
const classesData = [
    new TF2ClassData(
        "classes/scout.glb",
        "scoutqc_skeleton",
        [
            new KVPair(hatKey, "scout_hat_bodygroup"),
            new KVPair(headphonesKEY, "scout_headphones_bodygroup"),
            new KVPair(shoesSocks, "scout_shoes_socks_bodygroup"),
            new KVPair(dogtags, "scout_dogtags_bodygroup"),
        ],
        "Scout"
    ),
    new TF2ClassData(
        "classes/soldier.glb",
        "soldierqc_skeleton",
        [
            new KVPair(hatKey, "soldier_hat_bodygroup"),
            new KVPair(medalKey, "soldier_medal_bodygroup"),
        ],
        "Soldier"
    ),
    new TF2ClassData(
        "classes/pyro.glb",
        "pyroqc_skeleton",
        [
            new KVPair(pyroBackpack, "pyro_backpack_bodygroup"),
            new KVPair(head, "pyro_head_bodygroup"),
        ],
        "Pyro"
    ),
    new TF2ClassData("classes/demoman.glb", "demoqc_skeleton", null, "Demoman"),
    new TF2ClassData("classes/heavy.glb", "heavyqc_skeleton", null, "Heavy"),
    new TF2ClassData(
        "classes/engineer.glb",
        "engineerqc_skeleton",
        [new KVPair(hatKey, "engineer_hat_bodygroup")],
        "Engineer"
    ),
    new TF2ClassData("classes/medic.glb", "medicqc_skeleton", null, "Medic"),
    new TF2ClassData(
        "classes/sniper.glb",
        "sniperqc_skeleton",
        [new KVPair(hatKey, "sniper_hat_bodygroup")],
        "Sniper"
    ),
    new TF2ClassData("classes/spy.glb", "spyqc_skeleton", null, "Spy"),
];

//Rotations are in Radians.
//These are rotations to add to the model when this animation is used to fix differences.
//Index corrisponds to class index.
const classsecondaryAniminationRotations = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(Math.PI, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(Math.PI, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(Math.PI, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
];

const classmeleeAnimationRotations = [
    new THREE.Vector3(Math.PI, 0, 0),
    new THREE.Vector3(Math.PI, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(Math.PI, 0, 0),
    new THREE.Vector3(Math.PI, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(Math.PI, 0, 0),
    new THREE.Vector3(Math.PI, 0, 0),
];

const classdefaultAnimationRotations = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(Math.PI, 0, 0),
];

const defaultClassWeapons = [
    {
        path: "weapons/Scattergun.glb",
        type: "primary",
        skeletonName: "w_scattergunqc_skeleton",
        classIDs: [0],
        rotationFix: [3.141592653589793, 0, 0],
    },
    {
        path: "weapons/rocketlauncher.glb",
        type: "primary",
        skeletonName: "w_rocketlauncherqc_skeleton",
        classIDs: [1],
    },
    {
        path: "weapons/Flamethrower.glb",
        type: "primary",
        skeletonName: "c_flamethrowerqc_skeleton",
        classIDs: [2],
    },
    {
        path: "weapons/Grenade_Launcher.glb",
        type: "secondary",
        skeletonName: "c_grenadelauncherqc_skeleton",
        classIDs: [3],
    },
    {
        path: "weapons/minigun.glb",
        type: "primary",
        skeletonName: "c_minigunqc_skeleton",
        classIDs: [4],
    },
    {
        path: "weapons/shotgun.glb",
        type: "primary",
        skeletonName: "c_shotgunqc_skeleton",
        classIDs: [5],
    },
    {
        path: "weapons/medigun.glb",
        type: "secondary",
        skeletonName: "c_medigunqc_skeleton",
        classIDs: [6],
    },
    {
        path: "weapons/sniperrifle.glb",
        type: "primary",
        skeletonName: "w_sniperrifleqc_skeleton",
        classIDs: [7],
    },
    {
        path: "weapons/revolver.glb",
        type: "primary",
        skeletonName: "c_revolverqc_skeleton",
        classIDs: [8],
    },
];

class BonePair {
    constructor(name) {
        this.name = name;
        this.master = null;
        this.children = [];
        this.update = true;
    }
}

//All the bones that we look for and find on cosmetics to child to the master skeleton.
//If a bone isn't here it WONT get updated/animated on cosmetics.
const allBoneNames = [
    "bip_pelvis",
    "bip_spine_0",
    "bip_spine_1",
    "bip_hip_L",
    "bip_hip_R",
    "prp_pack",
    "bip_knee_L",
    "bip_foot_L",
    "bip_knee_L",
    "bip_toe_L",
    "bip_knee_R",
    "bip_foot_R",
    "bip_knee_R",
    "bip_toe_R",
    "bip_spine_2",
    "bip_spine_3",
    "bip_neck",
    "bip_collar_L",
    "bip_head",
    "bip_upperArm_L",
    "bip_lowerArm_L",
    "bip_hand_L",
    "bip_collar_R",
    "bip_upperArm_R",
    "bip_lowerArm_R",
    "bip_hand_R",
    "prp_legPouch",
    "prp_coat_front_L",
    "prp_coat_front_1_L",
    "prp_coat_back_L",
    "prp_coat_back_1_L",
    "prp_coat_front_R",
    "prp_coat_front_1_R",
    "prp_coat_back_R",
    "prp_coat_back_1_R",
    "prp_pack_L",
    "prp_pack_R",
    "prp_pack_back",
    "prop_bone",
    "prop_bone_1",
    "prop_bone_2",
    "prop_bone_3",
    "prop_bone_4",
    "prop_bone_5",
    "prop_bone_6",
    "weapon_bone_L",
    "weapon_bone_R",
    "bip_thumb_0_L",
    "bip_thumb_1_L",
    "bip_thumb_2_L",
    "bip_index_0_L",
    "bip_index_1_L",
    "bip_index_2_L",
    "bip_middle_0_L",
    "bip_middle_1_L",
    "bip_middle_2_L",
    "bip_ring_0_L",
    "bip_ring_1_L",
    "bip_ring_2_L",
    "bip_pinky_0_L",
    "bip_pinky_1_L",
    "bip_pinky_2_L",
    "bip_thumb_0_R",
    "bip_thumb_1_R",
    "bip_thumb_2_R",
    "bip_index_0_R",
    "bip_index_1_R",
    "bip_index_2_R",
    "bip_middle_0_R",
    "bip_middle_1_R",
    "bip_middle_2_R",
    "bip_ring_0_R",
    "bip_ring_1_R",
    "bip_ring_2_R",
    "bip_pinky_0_R",
    "bip_pinky_1_R",
    "bip_pinky_2_R",
    "weapon_bone",
    "bip_crotchflap_0",
    "joint_hose01",
    "joint_hose02",
    "joint_hose03",
    "joint_hose04",
    "joint_hose05",
    "medal_bone",
    "mvm",
    "prp_helmet",
    "prp_hat"
];

//Setup all default tint values for materials that support tinting.
//Key: vmt material name | Value: RGB Hex value as string.
const defaultTints = {
    "2020_bombinoculus_new": "7b5846",
    "2020_breadcap": "717c1d",
    "amphibeanie": "e8a5ae",
    "amphibeanie_blue": "7cacce",
    "antifreeze_ulster_1": "615841",
    "antifreeze_ulster_1_blue": "615841",
    "aquanaut": "ca892d",
    "badlands_sunblock": "6c251f",
    "badlands_sunblock_blue": "345d79",
    "batters_beak": "70868a",
    "batters_beak_blue": "70868a",
    "beater_cop": "2a2a2a",
    "beater_cop_blue": "2a2a2a",
    "benefactors_bowl": "e13030",
    "benefactors_bowl_blue": "30e1c7",
    "beretstack": "b8383b",
    "beretstack_blue": "5885a2",
    "bigger_mann_on_campus": "c8bbb1",
    "bigger_mann_on_campus_blue": "acbcca",
    "bloodsoaked_brim_paintable_band": "442429",
    "bloodsoaked_brim_paintable_band_blue": "242b44",
    "bombinomicon_hat": "433e3e",
    "bombinomicon_hat_blue": "433e3e",
    "boston_bling_1": "b73f3f",
    "boston_bling_1_blue": "3c708d",
    "brave_boots": "e6e6e6",
    "brave_boots_blue": "e6e6e6",
    "bubonic_bedizen_no_hood": "2a2220",
    "bubonic_bedizen_no_hood_blue": "2a2220",
    "buckshot_bandolier_1": "78231e",
    "buckshot_bandolier_1_blue": "28556e",
    "cadavers_coat": "b8383b",
    "cadavers_coat_blue": "5885a2",
    "charlatans_cordobs": "c53238",
    "charlatans_cordobs_blue": "6a9db3",
    "churchill_hat": "a89276",
    "coleader_cap_style1": "40372b",
    "coleader_cap_style1_blue": "40372b",
    "comrade_communicator": "c36c2d",
    "comrade_communicator_blue": "b88035",
    "coxswain_coat": "7d7864",
    "coxswain_coat_blue": "7d7864",
    "cozy_koala": "655a4f",
    "crackin_crown": "b03b3d",
    "crackin_crown_blue": "4a6c7f",
    "cyber_coverup": "584a45",
    "cyber_coverup_1": "b8383b",
    "cyber_coverup_1_blue": "5885a2",
    "cyber_coverup_blue": "454a58",
    "dancers_dress_1": "c53238",
    "dancers_dress_1_blue": "6a9db3",
    "das_puffencoaten": "4e4741",
    "das_puffencoaten_blue": "3c4a4c",
    "deathadder": "be383b",
    "deathadder_1": "dc4649",
    "deathadder_1_blue": "649cc8",
    "deathadder_blue": "5885a2",
    "dell_pickle": "687d40",
    "dugout_scratchers": "373737",
    "dugout_scratchers_blue": "232323",
    "dustbowler_style_1": "974734",
    "dustbowler_style_1_blue": "3f7590",
    "dutiful_do": "45301e",
    "engie_winter_hat_1": "463c37",
    "engie_winter_hat_1_blue": "3c464d",
    "family_doctor": "3b3937",
    "family_doctor_blue": "37393b",
    "field_pharma": "aa9b8c",
    "field_pharma_blue": "82a0a5",
    "flame_kindler": "a03c28",
    "flame_kindler_blue": "286e8c",
    "flightless_fragger": "1b1919",
    "foxhound_style_1": "3e3936",
    "gallon_o_grog": "2d7819",
    "gi_doelol": "6c675c",
    "googly_aye_1": "",
    "gravel_blooded_mercenaries_style_1": "654740",
    "gravel_blooded_mercenaries_style_1_blue": "28394d",
    "gravel_blooded_mercenaries_style_2": "654740",
    "gravel_blooded_mercenaries_style_2_blue": "28394d",
    "grave_diggers_goatee": "3b2a20",
    "henshin_helmet": "f08149",
    "henshin_helmet_blue": "ef9849",
    "hightech_haircut": "513e31",
    "hippocratic_growth": "c3c3ba",
    "hot_tropic_well_shaded_style": "a5a5a0",
    "hot_tropic_well_shaded_style_blue": "a5a5a0",
    "insulated_builder_style_shaven": "b34545",
    "insulated_builder_style_shaven_blue": "5f7988",
    "insulated_builder_style_sideburns": "b34545",
    "insulated_builder_style_sideburns_blue": "5f7988",
    "invisible_igniter": "625147",
    "iron_helmet": "9e302f",
    "iron_helmet_blue": "385b77",
    "iron_sight": "583820",
    "josuke": "58413b",
    "keelhaul_kapitan_1": "2d2823",
    "keelhaul_kapitan_1_blue": "2d2823",
    "lanai_lounger_mai_tai_style": "553232",
    "lanai_lounger_mai_tai_style_blue": "324655",
    "lil_garbage_gaurdians": "424f3b",
    "lucky_laces": "6c5845",
    "madame_hootsabunch": "e68c53",
    "medic_general_coat": "1e1e1e",
    "medic_general_coat_blue": "1e1e1e",
    "mega_hand__beep_man_style": "b4ab9c",
    "mega_hand__beep_man_style_blue": "b4ab9c",
    "minor_magus_sleeves": "19c864",
    "minor_magus_sleeves_blue": "19c864",
    "molten_monitor_1": "b33d30",
    "molten_monitor_1_blue": "4b708f",
    "nightwalkers_necktie": "4d2927",
    "nightwalkers_necktie_blue": "29274d",
    "peak_precision_parka": "9d312f",
    "peak_precision_parka_blue": "395c78",
    "pestilent_profession": "2a2220",
    "pocket_nopeavi": "c36c2d",
    "pocket_nopeavi_blue": "b88035",
    "pocket_pug": "e89449",
    "pocket_pug_blue": "ec9944",
    "polar_parka_1": "8f2625",
    "polar_parka_1_blue": "314f67",
    "present_from_pyro": "be3228",
    "present_from_pyro_blue": "5091be",
    "pyrovision_visors": "fc77",
    "pyrovision_visors_blue": "a963ff",
    "reindeer_riot_blue": "2c4c6f",
    "robo_batter_helmet": "8d2220",
    "robo_batter_helmet_blue": "33578e",
    "robo_beret": "433933",
    "robo_beret_blue": "3b3833",
    "robo_dealer_visor": "80b4a0",
    "robo_pyro_plunger": "723e3c",
    "robo_pyro_plunger_blue": "7b8080",
    "saviors_suit": "b83c40",
    "saviors_suit_blue": "3d7193",
    "scientist_head_3": "524848",
    "shady_business_downtown_style": "373232",
    "shady_business_uptown_style": "373232",
    "shine_eye_1": "ff2b2b",
    "shine_eye_1_blue": "2ba8ff",
    "smissmas_shade": "9c2d30",
    "smissmas_shade_blue": "4185be",
    "snappy_sweater": "6b2620",
    "snappy_sweater_blue": "303f4f",
    "spectral_specs": "7eba7c",
    "stealthy_spaniard": "c53238",
    "stealthy_spaniard_blue": "6a9db3",
    "suit_couture1": "3b1f23",
    "suit_couture1_blue": "18233d",
    "supervisor_1": "af5a2d",
    "supervisor_1_blue": "a57837",
    "survivors_kit": "922c20",
    "survivors_kit_blue": "345d79",
    "tainted_tome_cover": "3e5a25",
    "tainted_tome_cover_lvl2": "33491f",
    "tainted_tome_cover_lvl3": "30522e",
    "tainted_tome_cover_lvl4": "3f4c19",
    "tainted_tome_spine": "453729",
    "tainted_tome_spine_lvl2": "8e4f19",
    "tainted_tome_spine_lvl3": "848d8d",
    "tainted_tome_spine_lvl4": "e9b63c",
    "tiny_supplier": "fad87a",
    "tiny_supplier_blue": "fad87a",
    "tntpouch": "992f2a",
    "tntpouch_blue": "406b85",
    "uncanny_undertaker": "202020",
    "undercover_usurper": "5a4c40",
    "undercover_usurper_blue": "5a4c40",
    "usual_locked_style": "ffab4a",
    "usual_locked_style_1": "ffab4a",
    "usual_locked_style_1_blue": "ffc94a",
    "usual_locked_style_blue": "ffc94a",
    "vampires_vestments": "d0c2b4",
    "vampires_vestments_blue": "abc7cb",
    "veterans_vail": "a8a496",
    "veterans_vail_blue": "a8a496",
    "voodoonicorn_pin": "7dd4e9",
    "voodoonicorn_pin_blue": "ff9dbc",
    "vroomvroom_juju": "4b4b50",
    "vroomvroom_juju_blue": "4b4b50",
    "winter_western": "582d2d",
    "winter_western_blue": "374355",
    "woolly_wear": "8e2b2d",
    "woolly_wear_blue": "48697c"
};

class LoadoutPreview {
    container;
    controls;
    camera;
    scene;
    renderer;
    mixer;
    clock;

    ENABLE_LOADING_INDICATOR = true;
    loadingIndicator;
    loadingIndicatorMaterial;
    loadingCount = 0;
    idle;
    currentClass;
    currentClassID = -1;
    currentCosmetics = [];
    currentweapondata;
    currentWeaponSkeleton = null;
    classLoadedCallback = null;
    classMasterSkeleton;
    allBones = [];

    constructor(containerId, setupDataObject) {
        this.clock = new THREE.Clock();
        this.clock.start();

        this.container = document.getElementById(containerId);

        if (this.container == null) {
            this.container = document.getElementById("loadout-preview");
        }

        //Lets get the width and height from the containing element for later use.
        let width = this.container.offsetWidth;
        let height = this.container.offsetHeight;

        this.camera = new THREE.PerspectiveCamera(40, width / height, 1, 300);
        this.camera.position.set(0, 60, 160);

        this.scene = new THREE.Scene();
        this.scene.add(this.camera);

        if (this.ENABLE_LOADING_INDICATOR) {
            var spriteMap = new THREE.TextureLoader().load(LOADING_TEXTURE_PATH);
            this.loadingIndicatorMaterial = new THREE.SpriteMaterial({
                map: spriteMap,
            });
            this.loadingIndicator = new THREE.Sprite(this.loadingIndicatorMaterial);
            this.loadingIndicator.position.set(0, 0, -10);
            this.loadingIndicator.scale.set(4, 4, 1);

            let loadingIndicatorBack = new THREE.Sprite(
                new THREE.SpriteMaterial({
                    color: new THREE.Color(0x2b2826).convertGammaToLinear(1.865),
                    opacity: 0.75,
                    transparent: true,
                })
            );
            this.loadingIndicator.add(loadingIndicatorBack);
            loadingIndicatorBack.position.set(0, 0, -1);
            loadingIndicatorBack.scale.set(5, 5, 1);
            this.camera.add(this.loadingIndicator);
        }

        var directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(0, 10, 5);
        this.scene.add(directionalLight);

        var amlight = new THREE.AmbientLight(0xa6a6a6); // soft white light
        this.scene.add(amlight);

        try {
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true,
            });
            this.renderer.setClearColor(0x000000, 0);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(width, height);
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
        } catch {
            Creators.Actions.Modals.alert({
                name: "Loadout Preview WebGL Error",
                innerText:
                    'The Loadout preview failed to initialize the WebGL renderer.<br> Please check if your browser supports WebGL or if it needs to be enabled <a href="https://get.webgl.org/" target="_blank">at this page.</a>',
            });
            return;
        }

        this.container.appendChild(this.renderer.domElement);
        this.renderer.domElement.style.outline = "none";

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        this.controls.minDistance = 80;
        this.controls.maxDistance = 200;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minPolarAngle = Math.PI / 5;

        //controls.maxAzimuthAngle = Math.PI;
        this.controls.target = new THREE.Vector3(0, 35, 0);
        this.controls.update();

        //Setup all the bones using the master name list
        allBoneNames.forEach((name) => {
            this.allBones.push(new BonePair(name));
        });

        try {
            this.Setup(setupDataObject);
        } catch (error) {
            Creators.Actions.Modals.alert({
                name: "Loadout Preview Setup Error",
                innerText: `The Loadout Preview failed to load. Please report this error:<br>${error}`,
            });
            return;
        }

        this.animate();
    }

    //Performs the setup process using the data in the meta element.
    Setup(setupDataObject) {
        if (setupDataObject.cosmeticonly) {
            //COSMETIC ONLY
            //Cheat and set the current class object directly.
            this.currentClass = classesData[setupDataObject.class_id];

            if (setupDataObject.cosmetics.length > 0) {
                this.LoadCosmeticFromGLTF(
                    setupDataObject.cosmetics[0],
                    (skel) => {
                        this.controls.target = this.GetCenter(setupDataObject.cosmetics[0], skel);
                        this.controls.update();
                        if (setupDataObject.cosmetictints[0] != null && setupDataObject.cosmetictints[0] != "" && setupDataObject.cosmetictints[0] != "0") {
                            this.SetChildrenColourTints(skel, setupDataObject.cosmetictints[0]);
                        }
                    },
                    false
                );
            }

            this.controls.minDistance = 60;
            this.controls.maxDistance = 100;
            //Reset these to defaults.
            this.controls.maxPolarAngle = Math.PI;
            this.controls.minPolarAngle = 0;
            this.controls.update();
        } else if (setupDataObject.weapononly) {
            //WEAPON ONLY DISPLAY
            let weapondata = setupDataObject.weapon;
            let finishedFunc = (weaponOb) => {
                //Called when weapon loading is complete
                this.controls.target = this.GetCenter(weapondata, weaponOb);
                this.controls.minDistance = 70;
                this.controls.maxDistance = 90;
                //Reset these to defaults.
                this.controls.maxPolarAngle = Math.PI;
                this.controls.minPolarAngle = 0;
                this.controls.update();
                weaponOb.rotation.setFromVector3(this.ArrayToVector(weapondata.rotationFix));
            };
            this.LoadWeaponFromGLTF(weapondata, false, finishedFunc, false);
        } else {
            //NORMAL DISPLAY MODE
            //Assign a function to this var for us to get a callback when the class model is loaded.
            //This is executed later after SetClass().
            this.classLoadedCallback = () => {
                for (let i = 0; i < setupDataObject.cosmetics.length; i++) {
                    this.AddCosmetic(setupDataObject.cosmetics[i], setupDataObject.cosmetictints[i]);
                }

                //If the weapon field is missing or if its some other empty garbage then we dont have a weapon. Use the default weapon.
                if (setupDataObject.weapon != null && setupDataObject.weapon != {} && !Array.isArray(setupDataObject.weapon)) {
                    this.LoadWeaponFromGLTF(setupDataObject.weapon);
                } else {
                    //Get the default weapon for this class and use that.
                    this.LoadWeaponFromGLTF(defaultClassWeapons[setupDataObject.class_id]);
                }

                //Unassign ourselves when this is done.
                this.classLoadedCallback = null;
            };

            this.SetClass(setupDataObject.class_id);
        }
    }

    GetCenter(cosmeticData, skeleton) {
        let center = new THREE.Vector3(0, 0, 0);

        //Some of the objects are actually rotated but the skeleton hides this making the calculated center be wrong.
        //We make a matrix to apply to the position to rotate it back to where it should be, fixing it.
        //Not all need this soo its set per cosmetic.
        let fixMatrix = new THREE.Matrix4();
        let quat = new THREE.Quaternion();
        //A positive rotation on x of 90 degrees.
        quat.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0, "XYZ"));
        fixMatrix.compose(new THREE.Vector3(0, 0, 0), quat, new THREE.Vector3(1, 1, 1));

        if (cosmeticData.centerPos != null) {
            return cosmeticData.centerPos;
        } else {
            for (let i = 0; i < skeleton.children.length; i++) {
                if (skeleton.children[i].type == "SkinnedMesh") {
                    skeleton.children[i].geometry.computeBoundingBox();
                    skeleton.children[i].geometry.boundingBox.getCenter(center);
                    if (cosmeticData.rotFix) center.applyMatrix4(fixMatrix);
                    break;
                }
                for (let j = 0; j < skeleton.children[i].children.length; j++) {
                    if (skeleton.children[i].children[j].type == "SkinnedMesh") {
                        skeleton.children[i].children[j].geometry.computeBoundingBox();
                        skeleton.children[i].children[j].geometry.boundingBox.getCenter(center);
                        if (cosmeticData.rotFix) center.applyMatrix4(fixMatrix);
                        break;
                    }
                }
            }
        }

        center = skeleton.localToWorld(center);

        return center;
    }

    //Goes through the bones and childs all children objects to the master of that bone group.
    ChildAllBones() {
        this.allBones.forEach((element) => {
            if (element.master != null && element.children.length > 0 && element.update) this.ChildBonesToMaster(element.master, element.children);
        });
    }

    //Updates the renderer and animations at a consistent rate.
    //Arrow function to preserve this context.
    animate = () => {
        requestAnimationFrame(this.animate);
        var delta = this.clock.getDelta();
        if (this.mixer != null) this.mixer.update(delta);

        if (this.ENABLE_LOADING_INDICATOR && this.loadingIndicator.visible) this.loadingIndicatorMaterial.rotation += Math.PI * 0.65 * delta;

        this.renderer.render(this.scene, this.camera);
    };

    //Check this skeleton and get all bones that match and make them the master bones.
    FindMasterBones(skeleton) {
        this.allBones.forEach((element) => {
            var bone = skeleton.getObjectByName(element.name);
            if (bone != null) element.master = bone;
        });
    }

    //Child these bones to the master given.
    ChildBonesToMaster(master, children) {
        for (var i = 0; i < children.length; i++) {
            children[i].position.set(0, 0, 0);
            children[i].rotation.set(0, 0, 0);
            master.add(children[i]);
        }
    }

    SetClass(index) {
        var classObj = classesData[index];
        if (classObj.path == "") return;

        //We need to remove the old skeleton.
        //We also need to see if we should remove any other cosmetics as they wont be right for this class.
        if (this.classMasterSkeleton != null) {
            this.classMasterSkeleton.parent.remove(this.classMasterSkeleton);
        }

        //Clear out all bone children as they will be from old invalid objects
        this.allBones.forEach((element) => {
            element.children = [];
        });

        this.currentClass = classObj;
        this.LoadClassFromGLTF(classObj.path, classObj.skeleton, index);
    }

    AddCosmetic(cosmeticDataObject, tint, callback) {
        if (cosmeticDataObject != null) {
            let cosmeticCallback = (skel) => {
                this.currentCosmetics.push(skel);
                if (callback != null) callback();
                if (tint != null && tint != "" && tint != "0") {
                    this.SetChildrenColourTints(skel, tint, cosmeticDataObject);
                }
            };

            this.LoadCosmeticFromGLTF(cosmeticDataObject, cosmeticCallback);
            this.HideObjectsForCosmetic(cosmeticDataObject);
        }
    }

    HideObjectsForCosmetic(cosmetic) {
        //If there are models to disable on the class, do that now.
        if (cosmetic.disables != null) {
            cosmetic.disables.forEach((element) => {
                this.HideObjectOnClassSkelViaName(this.GetModelNameFromKey_CurrentClass(element));
            });
        }
    }

    SetAllVisble_CurrentClass() {
        this.classMasterSkeleton.children.forEach((child) => {
            child.visible = true;
        });
    }

    GetModelNameFromKey_CurrentClass(key) {
        var toReturn = "";
        if (this.currentClass.models == null) return "";

        this.currentClass.models.forEach((element) => {
            if (element.key == key) toReturn = element.value;
        });
        return toReturn;
    }

    HideObjectOnClassSkelViaName(name) {
        var objToHide = this.classMasterSkeleton.getObjectByName(name);
        if (objToHide != null) objToHide.visible = false;
    }

    LoadWeaponFromGLTF(weapondata, childBones = true, finishedCallback = null, shouldPlayAnimation = true) {
        this.UpdateLoadingCount(1);

        let loader = new GLTFLoader().setPath(ROOT_GLB_PATH);
        try {
            loader.load(
                weapondata.path,
                (gltf) => {
                    this.scene.add(gltf.scene);
                    gltf.scene.position.set(0, 0, 0);
                    gltf.scene.scale.set(1, 1, 1);

                    if (weapondata.hasOwnProperty("skeletonName") && weapondata.skeletonName != "") {
                        this.currentWeaponSkeleton = gltf.scene.getObjectByName(weapondata.skeletonName);
                    }

                    //Backup code to find skeleton object for cosmetics that do not specify.
                    if (this.currentWeaponSkeleton == null) {
                        for (var i = 0; i < gltf.scene.children.length; i++) {
                            //Object probably has the word skeleton in its name or its types match what we expect.
                            if (
                                gltf.scene.children[i].name.includes("skeleton") ||
                                gltf.scene.children[i].type == "Bone" ||
                                gltf.scene.children[i].type == "SkinnedMesh"
                            ) {
                                this.currentWeaponSkeleton = gltf.scene.children[i];
                                break;
                            }
                            for (var x = 0; x < gltf.scene.children[i].children.length; x++) {
                                //Probably will have bones or a skinned mesh as its children soo this works too.
                                if (gltf.scene.children[i].children[x].type == "Bone" || gltf.scene.children[i].children[x].type == "SkinnedMesh") {
                                    this.currentWeaponSkeleton = gltf.scene.children[i];
                                    break;
                                }
                            }
                            if (this.currentWeaponSkeleton != null) break;
                        }
                    }

                    if (weapondata.rotationFix != null) {
                        this.currentWeaponSkeleton.rotation.setFromVector3(this.ArrayToVector(weapondata.rotationFix));
                    }

                    //Fix parts randomly being culled yet being visible.
                    //Probably bad bounding boxes.
                    this.currentWeaponSkeleton.children.forEach((element) => {
                        element.frustumCulled = false;
                        //Try on direct children too.
                        element.children.forEach((element) => {
                            element.frustumCulled = false;
                        });
                    });
                    this.currentWeaponSkeleton.frustumCulled = false;

                    if (childBones) {
                        this.GetAllCosmeticBones(this.currentWeaponSkeleton);
                        this.ChildAllBones();
                    }

                    if (weapondata.type != WeaponType.PRIMARY && shouldPlayAnimation) {
                        let animPath;
                        let isCustom = false;

                        //If no animation override data is here in the object, use the type to find the anim path.
                        if (weapondata.animationOverride == null || weapondata.animationOverride[this.currentClassID] == "") {
                            animPath = weapondata.type == WeaponType.SECONDARY ? secondaryAnimationPath : meleeAnimationPath;
                        } else {
                            //The animation path is from the override array as we have an entry.
                            animPath = `${customAnimationPath}${weapondata.animationOverride[this.currentClassID]}`;
                            isCustom = true;
                        }
                        //Define callback function for us to handle the result of the animation load.
                        let resultFunction = (result) => {
                            if (!result) {
                                //If false, we should remove this new weapon as the animation didnt load correctly.
                                if (this.currentWeaponSkeleton != null) {
                                    this.currentWeaponSkeleton = null;
                                }
                            }
                        };
                        if (isCustom) this.LoadAndPlayAnimationFromGLTF(animPath, "custom", resultFunction);
                        else this.LoadAndPlayAnimationFromGLTF(animPath, weapondata.type, resultFunction);
                    }

                    if(weapondata.material != null){
                        this.ApplyMaterialSettingsToObject(gltf.scene, weapondata.material);
                    }

                    if (finishedCallback != null) finishedCallback(this.currentWeaponSkeleton);

                    this.UpdateLoadingCount(-1);
                },
                this.ProgressTextSet,
                (e) => {
                    this.UpdateLoadingCount(-1);
                    console.log("Error: Failed to load Weapon: " + weapondata.path + ". Error: " + e);
                }
            );
        } catch (e) {
            console.error("[LoadoutPreview] Error: Failed to load weapon at path: " + weapondata.path);
            this.UpdateLoadingCount(-1);
        }
    }

    //Load a class model from a file and setup its skeleton to be used for cosmetics.
    LoadClassFromGLTF(path, skeletonname, classIndex) {
        this.UpdateLoadingCount(1);
        var loader = new GLTFLoader().setPath(ROOT_GLB_PATH);
        try {
            loader.load(
                path,
                (gltf) => {
                    try {
                        this.scene.add(gltf.scene);
                        gltf.scene.position.set(0, 0, 0);
                        gltf.scene.scale.set(1, 1, 1);

                        //Get the skeleton from the class and store its bones as the master bones.
                        this.classMasterSkeleton = gltf.scene.getObjectByName(skeletonname);

                        this.classMasterSkeleton.rotation.setFromVector3(classdefaultAnimationRotations[classIndex]);

                        //Fix parts randomly being culled yet being visible.
                        //Probably bad bounding boxes.
                        this.classMasterSkeleton.children.forEach((element) => {
                            element.frustumCulled = false;
                            //Try on direct children too.
                            element.children.forEach((element) => {
                                element.frustumCulled = false;
                            });
                        });

                        this.classMasterSkeleton.frustumCulled = false;
                        this.FindMasterBones(this.classMasterSkeleton);

                        //Enable shadows and get the idle anim.
                        //Shadows are off anyways but left here for future.
                        this.mixer = new THREE.AnimationMixer(this.classMasterSkeleton);
                        /*
                        gltf.scene.children.forEach(element => {
                            element.castShadow = true;
                            element.receiveShadow = true;
                        }); */
                        var clips = gltf.animations;

                        //Find the animations and begin playing idle.
                        //Idle animations should have the same name for all classes.
                        this.idle = THREE.AnimationClip.findByName(clips, "a_reference");
                        var idleAction = this.mixer.clipAction(this.idle);
                        idleAction.play();

                        this.ChildAllBones();

                        this.currentClassID = Number.parseInt(classIndex);
                    } catch (e) {
                        console.error(`Exception during class load gltf handling: ${e}`);
                    }

                    this.SetAllVisble_CurrentClass();

                    this.UpdateLoadingCount(-1);
                    if (this.classLoadedCallback != null) this.classLoadedCallback();
                },
                this.ProgressTextSet,
                () => {
                    this.UpdateLoadingCount(-1);
                }
            );
        } catch (e) {
            this.UpdateLoadingCount(-1);
            console.error(`Exception during attepting to load in class gltf: ${e}`);
        }
    }

    //Load a cosmetic from a file and attach it.
    LoadCosmeticFromGLTF(cosmeticData, finishedLoadingFunction, childBones = true) {
        var fullpath = cosmeticData.path.replace("{class}", this.currentClass.name);
        this.UpdateLoadingCount(1);
        var loader = new GLTFLoader().setPath(ROOT_GLB_PATH);
        var doneFunc = (gltfScene) => {
            var skel = null;
            if (cosmeticData.hasOwnProperty("skeleton") && cosmeticData.skeleton != "") {
                skel = gltfScene.getObjectByName(cosmeticData.skeleton);
            }

            //Backup code to find skeleton object for cosmetics that do not specify.
            if (skel == null) {
                for (var i = 0; i < gltfScene.children.length; i++) {
                    //Object probably has the word skeleton in its name or its types match what we expect.
                    if (
                        gltfScene.children[i].name.includes("skeleton") ||
                        gltfScene.children[i].type == "Bone" ||
                        gltfScene.children[i].type == "SkinnedMesh"
                    ) {
                        skel = gltfScene.children[i];
                        break;
                    }
                    for (var x = 0; x < gltfScene.children[i].children.length; x++) {
                        //Probably will have bones or a skinned mesh as its children soo this works too.
                        if (gltfScene.children[i].children[x].type == "Bone" || gltfScene.children[i].children[x].type == "SkinnedMesh") {
                            skel = gltfScene.children[i];
                            break;
                        }
                    }
                    if (skel != null) break;
                }
            }

            if(gltfScene.children.length == 0) {
                throw new Error(`Cosmetic file ${cosmeticData.path} had no children? File is somehow empty!`);
            }
            if(skel == null) {
                throw new Error(`No skeleton found for cosmetic: ${cosmeticData.path}`);
            }
            if (childBones) {
                this.GetAllCosmeticBones(skel);
                this.ChildAllBones();
            }

            skel.frustumCulled = false;
            //Do some strange searching of children and childrens children to stop the bad bad frustum culling.
            skel.children.forEach((ch) => {
                ch.frustumCulled = false;

                ch.children.forEach((ch1) => {
                    ch1.frustumCulled = false;
                });
            });

            var allFoundMaterials = [];
            var obNames = [];

            //Find all the materials and store then to make searching more efficient.
            skel.children.forEach((el) => {
                if (el.material != null) {
                    allFoundMaterials.push(el.material);
                    obNames.push(el.material.name);
                }

                //Do the children of this child too.
                el.children.forEach((el_) => {
                    if (el_.material != null) {
                        allFoundMaterials.push(el_.material);
                        obNames.push(el_.material.name);
                    }
                });
            });

            //Check all materials and apply default tint colours using the data from the json object.
            for (let i = 0; i < obNames.length; i++) {
                if (defaultTints[obNames[i]] != null) {
                    let defaultColour = new THREE.Color(parseInt(defaultTints[obNames[i]], 16));
                    defaultColour.convertGammaToLinear(gammaCorrectionAmount);
                    allFoundMaterials[i].color = defaultColour;
                }
            }

            for (let i = 0; i < allFoundMaterials.length; i++) {
                allFoundMaterials[i].side = THREE.FrontSide;
            }

            this.UpdateLoadingCount(-1);

            //Setup alpha mask texture if that property exists.
            if (cosmeticData.alphaMask != null && cosmeticData.alphaMask != "") {
                var l = new THREE.TextureLoader();

                if (!Array.isArray(cosmeticData.alphaMask)) {
                    //Only ONE alpha mask to use.
                    var path = cosmeticData.alphaMask.replace("{class}", this.currentClass.name);
                    this.UpdateLoadingCount(1);
                    l.load(ROOT_GLB_PATH + path, (img) => {
                        img.flipY = false;
                        img.needsUpdate = true;

                        skel.children.forEach((el) => {
                            if (el.material != null) {
                                el.material.alphaMap = img;
                                el.material.transparent = true;
                                //Custom for Spectral specs
                                el.material.blending = THREE.CustomBlending;
                                el.material.blending = THREE.AdditiveBlending;

                                el.material.needsUpdate = true;
                            }

                            //Do the children of this child too.
                            el.children.forEach((el_) => {
                                if (el_.material != null) {
                                    el_.material.alphaMap = img;
                                    el_.material.transparent = true;
                                    el_.material.needsUpdate = true;
                                }
                            });
                        });
                        this.UpdateLoadingCount(-1);
                    });
                } else {
                    cosmeticData.alphaMask.forEach((element) => {
                        if (element.value != "") {
                            this.UpdateLoadingCount(1);
                            l.load(ROOT_GLB_PATH + element.value, (img2) => {
                                img2.flipY = false;
                                img2.needsUpdate = true;

                                for (var i = 0; i < obNames.length; i++) {
                                    if (obNames[i] == element.key) {
                                        allFoundMaterials[i].alphaMap = img2;
                                        allFoundMaterials[i].transparent = true;
                                        allFoundMaterials[i].needsUpdate = true;
                                    }
                                }
                                this.UpdateLoadingCount(-1);
                            });
                        }
                    });
                }
            }

            //Lets try to load a map for the colour mask.
            //If there is no mask then this wont be used on the shader and tints will be for the whole cosmetic.
            if (cosmeticData.colourMask != null && cosmeticData.colourMask != "") {
                //Load the image and apply it to all materials that we can find.
                var l = new THREE.TextureLoader();

                if (!Array.isArray(cosmeticData.colourMask)) {
                    //Only ONE mask to use.
                    var path = cosmeticData.colourMask.replace("{class}", this.currentClass.name);
                    this.UpdateLoadingCount(1);
                    l.load(ROOT_GLB_PATH + path, (img) => {
                        //THREE JS DOES THIS BY DEFAULT???
                        img.flipY = false;
                        img.needsUpdate = true;

                        skel.children.forEach((el) => {
                            if (el.material != null) {
                                el.material.colourmaskMap = img;
                                el.material.additiveColourBlend = cosmeticData.additive;
                                el.material.needsUpdate = true;
                            }

                            //Do the children of this child too.
                            el.children.forEach((el_) => {
                                if (el_.material != null) {
                                    el_.material.colourmaskMap = img;
                                    el_.material.additiveColourBlend = cosmeticData.additive;
                                    el_.material.needsUpdate = true;
                                }
                            });
                        });
                        this.UpdateLoadingCount(-1);
                    });
                } else {
                    //We have more than one mask to use or objects to ignore.
                    //Go through each mask and find its matching material
                    cosmeticData.colourMask.forEach((element) => {
                        if (element.value != "IGNORE_COLOR_TINT") {
                            this.UpdateLoadingCount(1);
                            l.load(ROOT_GLB_PATH + element.value, (img2) => {
                                img2.flipY = false;
                                img2.needsUpdate = true;

                                for (var i = 0; i < obNames.length; i++) {
                                    if (obNames[i] == element.key) {
                                        allFoundMaterials[i].colourmaskMap = img2;
                                        allFoundMaterials[i].additiveColourBlend = cosmeticData.additive;
                                        allFoundMaterials[i].needsUpdate = true;
                                    }
                                }
                                this.UpdateLoadingCount(-1);
                            });
                        }
                    });

                    this.FixIgnoreColourMaterials(cosmeticData, allFoundMaterials, obNames);
                }
            } else if (cosmeticData.additive) {
                skel.children.forEach((el) => {
                    if (el.material != null) {
                        el.material.additiveColourBlend = true;
                        el.material.needsUpdate = true;
                    }

                    el.children.forEach((el_) => {
                        if (el_.material != null) {
                            el_.material.additiveColourBlend = true;
                            el_.material.needsUpdate = true;
                        }
                    });
                });
            }

            finishedLoadingFunction(skel);
            console.log("Finished loading : " + fullpath);
        };
        try {
            loader.load(
                fullpath,
                (gltf) => {
                    this.CosmeticSceneLoad(gltf, doneFunc);
                },
                this.ProgressTextSet,
                (e) => {
                    this.UpdateLoadingCount(-1);
                    console.log("Error: Failed to load Cosmetic: " + fullpath + ". Error: " + e);
                }
            );
        }
        catch (e) {
            this.UpdateLoadingCount(-1);
            console.error("Error: Failed to load Cosmetic: " + fullpath);
        }
    }

    LoadAndPlayAnimationFromGLTF(path, animationName, resultFunc) {
        let loader = new GLTFLoader().setPath(ROOT_GLB_PATH);
        path = path.replace("{class}", this.currentClass.name);

        this.UpdateLoadingCount(1);
        loader.load(
            path,
            (gltf) => {
                var anims = gltf.animations;

                var clip = THREE.AnimationClip.findByName(anims, animationName);
                if(clip == null){
                    console.error(`Animation with name ${animationName} was not found in the glb. Wrong name?`);
                }
                //We MUST stop all actions before changing as it may try to play both?
                this.mixer.stopAllAction();
                var action = this.mixer.clipAction(clip);
                action.play();

                if (animationName == WeaponType.MELEE) {
                    this.classMasterSkeleton.rotation.setFromVector3(classmeleeAnimationRotations[this.currentClassID]);
                }
                else if (animationName == WeaponType.SECONDARY) {
                    this.classMasterSkeleton.rotation.setFromVector3(classsecondaryAniminationRotations[this.currentClassID]);
                }

                setTimeout(() => {
                    this.UpdateLoadingCount(-1);
                }, 150);

                resultFunc(true);
            }
        );
    }

    //Callback for scene load.
    CosmeticSceneLoad(gltf, LoadedCallback) {
        this.scene.add(gltf.scene);
        gltf.scene.position.set(0, 0, 0);
        gltf.scene.scale.set(1, 1, 1);

        LoadedCallback(gltf.scene);
    }

    LoadEnvMap(path, texLoader, onCreated){
        let generator = new THREE.PMREMGenerator(this.renderer);
        texLoader.load(ROOT_GLB_PATH + path, (texture) => {
            onCreated(generator.fromEquirectangular(texture).texture);
        });
    }

    /**
     * Apply special material settings to this object and its children.
     * @param {*} object 
     * @param {*} materialSettings 
     */
    ApplyMaterialSettingsToObject(object, materialSettings){
        let texLoader = new THREE.TextureLoader();
        for(let setting of materialSettings){
            console.log("Processing setting: " + setting.key);
            //Texture to load
            if(setting.value.toString().includes("/")){
                texLoader.load(ROOT_GLB_PATH + setting.value, (texture) => {
                    if(setting.key == "envMap"){
                        texture.mapping = THREE.EquirectangularReflectionMapping;
                        texture.encoding = THREE.sRGBEncoding;
                    }
                    this.ObjectTraverse(object, (ob) => {
                        if(ob.material != null) {
                            ob.material[setting.key] = texture;
                            ob.material.needsUpdate = true;
                        }
                    });
                });
            }
            else{
                //Normal value to apply
                this.ObjectTraverse(object, (ob) => {
                    if(ob.material != null){
                        ob.material[setting.key] = setting.value;
                        ob.material.needsUpdate = true;
                    }
                });
            }
        }
    }

    ObjectTraverse(object, callback){
        callback(object);

        object.traverse((child) => {
            callback(child);
        });
    }

    GetAllCosmeticBones(skeleton) {
        this.allBones.forEach((element) => {
            var bone = skeleton.getObjectByName(element.name);
            if (bone != null) element.children.push(bone);
        });
    }

    SetChildrenColourTints(skel, colour, cosmeticData) {
        colour = parseInt(colour, 16);

        var gammaColour = new THREE.Color(colour);
        gammaColour.convertGammaToLinear(gammaCorrectionAmount);

        var allFoundMaterials = [];
        var obNames = [];

        //Find all the materials and store them
        //Also perform colour application on materials now.
        skel.children.forEach((el) => {
            if (el.material != null) {
                allFoundMaterials.push(el.material);
                obNames.push(el.material.name);
                el.material.color = gammaColour;
            }

            el.children.forEach((el_) => {
                if (el_.material != null) {
                    allFoundMaterials.push(el_.material);
                    obNames.push(el_.material.name);
                    el_.material.color = gammaColour;
                }
            });
        });

        if (Array.isArray(cosmeticData.colourMask)) {
            this.FixIgnoreColourMaterials(cosmeticData, allFoundMaterials, obNames);
        }
    }

    FixIgnoreColourMaterials(cosmeticData, materials, materialNames) {
        cosmeticData.colourMask.forEach((element) => {
            if (element.value == "IGNORE_COLOR_TINT") {
                //This material has the IGNORE_COLOR_TINT value meaning it actually wants to not have any tinting.
                //Lets go and reverse the colour tint for this material.
                for (var i = 0; i < materialNames.length; i++) {
                    if (materialNames[i] == element.key) {
                        //Set the materials colour to white.
                        materials[i].color = new THREE.Color(0xffffff);
                    }
                }
            }
        });
    }

    UpdateLoadingCount(change) {
        if (!this.ENABLE_LOADING_INDICATOR) return;
        this.loadingCount += change;
        this.loadingIndicator.visible = this.loadingCount > 0;
    }

    //Callback to set the current loading progress.
    ProgressTextSet(progress) {
        // loadingpercent.innerHTML = Math.ceil(progress.loaded / progress.total * 100);
    }

    ArrayToVector(array) {
        return new THREE.Vector3(array[0], array[1], array[2]);
    }
}

export { LoadoutPreview };
