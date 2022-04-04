const CREATORS_RADIO_EPOCH = 1606062050000;
let m_bIsEnabled = false;

class Time {
    constructor(time) {
        this.m_Timestamp = time;
        this.m_Date = new Date();
    }

    getTime() {
        return this.m_Timestamp + new Date().getTime() - this.m_Date.getTime();
    }
}

class Radio {

    constructor(config) {
        this.m_Channels = [];
        this.m_bEnabled = false;
        this.m_Time = new Time(config.basetime);
        this.m_flFrequency = 101.3;

        this.m_sStaticPath = config.noise;
        this.m_iProximity = config.proximity;
    }

    getNoise() {
        if (this.m_Noise) return this.m_Noise;

        this.m_Noise = new Audio(this.m_sStaticPath);
        this.m_Noise.loop = true;
        return this.m_Noise;
    }

    RegisterChannel(channel) {
        channel.m_Radio = this;
        this.m_Channels.push(channel);
        if (this.m_bEnabled) {
            channel.CalculateVolume();
        }
    }

    Start() {
        this.m_bEnabled = true;
        for (let hChannel of this.m_Channels) {
            hChannel.CalculateVolume();
        }
        this.StartNoise();
        this.SetFrequency(this.m_flFrequency);
    }

    Stop() {
        this.m_bEnabled = false;
        for (let hChannel of this.m_Channels) {
            hChannel.Stop();
        }
        this.StopNoise();
    }

    Toggle() {
        Creators.Actions.Sounds.play("/cdn/assets/sounds/ui/buttonclickrelease.wav");
        if (this.m_bEnabled) {
            this.Stop();
        } else {
            this.Start();
        }
    }

    SetFrequency(frequency) {
        if (!this.m_bEnabled) return;

        this.m_flFrequency = Math.round(frequency * 10) / 10;

        let flProximity = 9999;
        for (let hChannel of this.m_Channels) {
            flProximity = Math.min(flProximity, Math.abs(hChannel.m_flFrequency - this.m_flFrequency));
            hChannel.CalculateVolume();
        }

        let flNoiseVolume = Math.min(flProximity, this.m_iProximity) / this.m_iProximity;
        this.SetNoiseVolume(flNoiseVolume);

        document.querySelector("#frequency").innerText = this.m_flFrequency + (this.m_flFrequency % 1.0 == 0 ? ".0" : "");
    }

    GetFrequencyProximityFromChannel(hChannel) {
        return Math.abs(hChannel.m_flFrequency - this.m_flFrequency);
    }

    StartNoise() {
        let hNoise = this.getNoise();
        hNoise.volume = 0;
        hNoise.play();
    }

    StopNoise() {
        let hNoise = this.getNoise();
        hNoise.pause();
    }

    SetNoiseVolume(volume) {
        let hNoise = this.getNoise();
        if(hNoise)
        {
            hNoise.volume = volume;
        }
    }

    ShiftFrequencyRight() {
        Creators.Actions.Sounds.play("/cdn/assets/sounds/ui/buttonclickrelease.wav");
        this.SetFrequency(this.m_flFrequency + 0.1);
    }

    ShiftFrequencyLeft() {
        Creators.Actions.Sounds.play("/cdn/assets/sounds/ui/buttonclickrelease.wav");
        this.SetFrequency(this.m_flFrequency - 0.1);
    }
}

class Sample {

    constructor() {
        this.m_StartTime = null;
        this.m_sPath = null;
        this.m_Audio = null;
        this.m_iDuration = null;
    }

    getAudio() {
        if (this.m_Audio) {
            return this.m_Audio;
        } else {
            let hAudio = new Audio(this.m_sPath);
            this.m_Audio = hAudio;
            return hAudio;
        }
    }
}

class Channel {
    constructor() {
        this.m_NextPlay = 0;
        this.m_bWaitingForLoad = false;
        this.m_PlayingSample = null;
        this.m_iSkippedTime = 0;
        this.m_bEnabled = false;
        this.m_flFrequency = 0;
        this.m_flVolume = 0.0;

        this.m_Schedule = [];
        this.m_Background = [];

        setInterval(() => {
            this.Think();
        }, 10);
    }

    GetRadio() {
        return this.m_Radio;
    }

    Play() {
        if (this.m_PlayingSample) {
            let hSample = this.m_PlayingSample;
            let hAudio = hSample.getAudio();

            let nSkip = (this.m_NextPlay - hSample.m_StartTime) / 1000;
            this.m_iSkippedTime = nSkip;

            console.log(`This sample started: ${hSample.m_StartTime} and will end on ${hSample.m_StartTime + hSample.m_iDuration}`);

            this.m_bWaitingForLoad = true;
            switch (hAudio.readyState) {
                case 4:
                    this.ProcessAudio();
                    break;
                default:
                    hAudio.onloadeddata = () => {
                        this.ProcessAudio();
                    };
                    break;
            }
        }
    }

    Stop() {
        this.m_NextPlay = 0;
        this.m_bEnabled = false;
        if (this.m_PlayingSample) {
            let hSample = this.m_PlayingSample;
            let hAudio = hSample.getAudio();

            hAudio.pause();
            this.m_PlayingSample = null;
        }
    }

    Start() {
        this.m_bEnabled = true;
    }

    Schedule(time, sound, duration) {
        let hSample = new Sample();
        hSample.m_StartTime = time;
        hSample.m_sPath = sound;
        hSample.m_iDuration = duration * 1000;
        this.m_Schedule.push(hSample);
    }

    AddBackground(sound, duration) {
        let hSample = new Sample();
        hSample.m_StartTime = -1;
        hSample.m_sPath = sound;
        hSample.m_iDuration = duration * 1000;
        this.m_Background.push(hSample);
    }

    CalculateVolume() {
        let flProximity = this.GetRadio().GetFrequencyProximityFromChannel(this);
        let flVolume = 1.0 - Math.min(flProximity, this.GetRadio().m_iProximity) / this.GetRadio().m_iProximity;

        this.m_flVolume = flVolume;
        if (flVolume > 0) {
            this.Start();
            this.SetVolume();
        } else {
            this.Stop();
        }
    }

    SetVolume() {
        if (this.m_PlayingSample) {
            let hSample = this.m_PlayingSample;
            let hAudio = hSample.getAudio();

            hAudio.volume = this.m_flVolume;
        }
    }

    ProcessAudio() {
        if (this.m_PlayingSample) {
            let hSample = this.m_PlayingSample;
            let hAudio = hSample.getAudio();

            let nDuration = hAudio.duration - this.m_iSkippedTime;
            if (nDuration > 0) {

                this.SetVolume();
                hAudio.currentTime = this.m_iSkippedTime;
                hAudio.play();

                this.m_NextPlay += nDuration * 1000;
            }

            this.m_bWaitingForLoad = false;
        }
    }

    Think() {
        if (!this.m_bEnabled) return;
        if (this.m_bWaitingForLoad) return;
        console.log("::Think()");

        if (this.m_Radio) {
            let iTime = this.m_Radio.m_Time.getTime();
            if (iTime > this.m_NextPlay) {

                let hSample = this.GetNextSample();

                if (hSample) {
                    if (iTime > hSample.m_StartTime) {
                        this.m_PlayingSample = hSample;
                        this.m_NextPlay = iTime;
                        this.Play();
                    }
                }
            }
        }
    }

    GetNextSample() {
        let iTime = this.m_Radio.m_Time.getTime();

        let iBackgroundDuration = this.GetBackgroundLoopDuration();
        let iPlaybackBackground = iTime % iBackgroundDuration;

        let iDurationThisFar = 0;
        let iPivotTime = iTime - iPlaybackBackground;
        let hResult;

        for (let hSample of this.m_Background) {
            let iEndTime = iDurationThisFar + hSample.m_iDuration;
            if (iPlaybackBackground < iEndTime) {
                hSample.m_StartTime = iPivotTime + iDurationThisFar;
                return hSample;
            }
            iDurationThisFar += hSample.m_iDuration;
        }
    }

    GetBackgroundLoopDuration() {
        let iCount = 0;
        for (let hSample of this.m_Background) {
            iCount += hSample.m_iDuration;
        }
        return iCount;
    }

    async GetBackgroundSampleLengths() {
        let text = "";
        for (let hSample of this.m_Background) {
            text += `Channel.AddBackground("${hSample.m_sPath}", ${await GetDuration(hSample.m_sPath)});\n`;
        }
        console.log(text);
    }
}

const RadioInstance = new Radio({
    basetime: g_iCurrentGlobalTime,
    noise: "/cdn/assets/sounds/radio/white_noise.wav",
    proximity: 0.4
});

let MusicChannel = new Channel();
MusicChannel.m_flFrequency = 101.3;

MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_a_little_heart_to_heart.wav", 94.119184);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_archimedes.wav", 245.133061);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_art_of_war.wav", 137.665306);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_calm.wav", 154.618776);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_dreams_of_cruelty.wav", 66.115918);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_drunken_pipe_bomb.wav", 91.245714);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_faster_than_a_speeding_bullet.wav", 85.916735);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_intruder_alert.wav", 113.110204);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_intruder_alert_midi.wav", 112.84898);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_main_theme.wav", 72.907755);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_medic.wav", 154.174694);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_more_gun_1.wav", 185.626122);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_more_gun_2.wav", 193.306122);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_more_gun_3.wav", 193.306122);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_petite_chou_fleur.wav", 103.836735);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_playing_with_danger.wav", 242.964898);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_right_behind_you.wav", 101.694694);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_robots.wav", 215.013878);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_rocket_jump_waltz.wav", 39.915102);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_mercenary_park.wav", 104.333061);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_saxtons_dilemma.wav", 71.941224);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_yeti_park.wav", 180.636735);
MusicChannel.AddBackground("/cdn/assets/sounds/radio/music_tf_saluting_the_fallen.wav", 84.558367);

RadioInstance.RegisterChannel(MusicChannel);

let HLAChannel = new Channel();
HLAChannel.m_flFrequency = 99.1;
HLAChannel.AddBackground("/cdn/assets/sounds/radio/music_hla_anticitizen.wav", 184.163265);
RadioInstance.RegisterChannel(HLAChannel);

let HL2Channel = new Channel();
HL2Channel.m_flFrequency = 105.6;
HL2Channel.AddBackground("/cdn/assets/sounds/radio/music_hl2_noise.wav", 45.400816);
RadioInstance.RegisterChannel(HL2Channel);

function GetDuration(sound) {
    return new Promise((rs, rj) => {
        let hAudio = new Audio(sound);
        hAudio.onloadeddata = () => {
            rs(hAudio.duration);
        }
    })
}
