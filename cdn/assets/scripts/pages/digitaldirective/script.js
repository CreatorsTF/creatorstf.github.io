// Required is defined so it throws an error in production reminding you
// to set a value, as if the default name/desc wasn't obnoxious enough.
Vue.component('indicator', {
    props: {
        indicatorPic: {
            type: String,
            required: true,
            default: "https://creators.tf/cdn/assets/images/no_avatar.jpg"
        },
        // indicatorName: {
        //     type: String,
        //     required: true,
        //     default: "DEFINE AN INDICATOR NAME"
        // },
        indicatorDescription: {
            type: String,
            required: true,
            default: "DEFINE AN INDICATOR DESCRIPTION"
        }
    },
    template: `
        <div class="indicator col-lg">
            <img class="icon" :src="indicatorPic" alt=" ">
            <div class="indicator-details">
                <p class="indicator-description">{{ indicatorDescription }}</p>
            </div>
        </div>
    `
});

Vue.component('people', {
    props: {
        peopleSteamId: {
            type: String,
            required: true,
            default: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // FUNNY VIDEO!!!!!
        },
        peoplePic: {
            type: String,
            required: true,
            default: "https://creators.tf/cdn/assets/images/no_avatar.jpg"
        },
        peopleName: {
            type: String,
            required: true,
            default: "DEFINE THE PERSON'S NAME"
        },
        peopleDesc: {
            type: String,
            required: true,
            default: "DEFINE THE PERSON'S ROLE"
        }
    },
    template: `
        <a class="col-lg people" :href="'https://steamcommunity.com/profiles/' + peopleSteamId" target="_blank">
            <img class="icon" :src="peoplePic" alt=" ">
            <div class="people-details">
                <p class="people-name">{{ peopleName }}</p>
                <p class="people-description">{{ peopleDesc }}</p>
            </div>
        </a>
    `
});

Vue.component('maptours', {
    props: {
        mapWorkshopId: {
            type: String,
            required: true,
            default: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // FUNNY VIDEO!!!!!
        },
        mapPic: {
            type: String,
            required: true,
            default: "https://creators.tf/cdn/assets/images/no_avatar.jpg"
        },
        mapName: {
            type: String,
            required: true,
            default: "DEFINE THE MAP'S NAME"
        },
        mapCredits: {
            type: String,
            required: true,
            default: "DEFINE THE CREDITS"
        },
        // missionIndicators: {
        //     type: String,
        //     required: false,
        //     default: ""
        // },
        // missionIndicators2: {
        //     type: String,
        //     required: false,
        // },
        missionInfo: {
            type: String,
            required: false,
            default: ""
        },
        missionInfo2: {
            type: String,
            required: false
        },
        missionInfoCredits: {
            type: String,
            required: false,
            default: ""
        },
        missionInfo2Credits: {
            type: String,
            required: false
        }
    },
    template: `
        <div class="map-holder">
            <a :href="mapWorkshopId" target="_blank">
                <div class="map-workshop-label"></div>
            </a>
            <div class="map-mission-holder">
                <h2>Missions</h2>
                <div class="map-mission-holder-individual">
                    <div>
                        <span>{{ missionInfo }}</span><span class="mission-info-credits"> {{ missionInfoCredits }}</span>
                    </div>
                    <div>
                        <span>{{ missionInfo2 }}</span><span class="mission-info-credits"> {{ missionInfo2Credits }}</span>
                    </div>
                </div>
            </div>
            <div class="map-info-holder">
                <p class="map-name">{{ mapName }}</p>
                <p class="map-creators">Made by: {{ mapCredits }}</p>
            </div>
            <img :src="mapPic" alt=" ">
        </div>
    `
});

// yeah.
Vue.component('footerctflogo', {
    template: `
        <a href="https://creators.tf" target="_blank">
            <img src="/cdn/assets/images/tf2_square_event_mvm.png" alt="Creators.TF Operation Digital Directive Logo" title="Creators.TF Operation Digital Directive Logo">
        </a>
    `
});

var app = new Vue({
    el: "#app"
});