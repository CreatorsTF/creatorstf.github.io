let SOUND_BASE = "/cdn/assets/sounds/";
const m_PrecachedSounds = [];

function ToggleFullscreen(bForce) {
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

let Creators = {
    User: typeof g_CreatorsUser != "undefined" ? g_CreatorsUser : null,
    Actions: {
        Text: {
            isUpperCase: (str) => {
                return str === str.toUpperCase();
            },
            encodeCaesar: (str, key) => {
                let cipher = '';
                for (let i = 0; i < str.length; i++) {
                    if (Creators.Actions.Text.isUpperCase(str[i])) {
                        cipher += String.fromCharCode((str.charCodeAt(i) + key - 65) % 26 + 65);
                    } else {
                        cipher += String.fromCharCode((str.charCodeAt(i) + key - 97) % 26 + 97);
                    }
                }
                return cipher;
            },
            decodeCaesar: (str, key) => {
                return Creators.Actions.Text.encodeCaesar(str, -key)
            }
        },
        DOM: {
            makeSVG: (tag, attrs) => {
                let el = document.createElementNS('http://www.w3.org/2000/svg', tag);
                for (var k in attrs)
                    el.setAttribute(k, attrs[k]);
                return el;
            }
        },
        Modals: {
            close: () => {
                for (let a of g_aModals) a.closeAndKill()
            },
            confirm: (options = {}) => {
                return new Promise((resolve, reject) => {
                    new Modal({
                        name: options.name,
                        innerText: options.innerText,
                        innerHTML: options.innerHTML,
                        onclose: () => {
                            resolve(false);
                        },
                        options: Object.assign({}, {
                            closeFromButton: true,
                            closeFromContainer: true,
                            width: options.width,
                            height: options.height
                        }, options.options || {}),
                        buttons: options.buttons || [{
                                value: "Accept",
                                icon: 'check',
                                onclick: () => {
                                    resolve(true);
                                }
                            },
                            {
                                value: "Cancel",
                                icon: 'close',
                                onclick: () => {
                                    resolve(false);
                                }
                            }
                        ]
                    });
                });
            },
            danger_confirm: (options = {}) => {
                return new Promise((resolve, reject) => {
                    new Modal({
                        name: options.name,
                        innerText: options.innerText,
                        innerHTML: options.innerHTML,
                        onclose: () => {
                            resolve(false);
                        },
                        options: Object.assign({}, {
                            closeFromButton: true,
                            closeFromContainer: true,
                            width: options.width,
                            error: true,
                            height: options.height
                        }, options.options || {}),
                        buttons: options.buttons || [{
                                value: "Accept",
                                icon: 'check',
                                timeout: 3000,
                                onclick: () => {
                                    resolve(true);
                                }
                            },
                            {
                                value: "Cancel",
                                icon: 'close',
                                onclick: () => {
                                    resolve(false);
                                }
                            }
                        ]
                    });
                });
            },
            progress: (options = {}) => {
                return new Promise((resolve, reject) => {
                    new Modal({
                        name: options.name,
                        innerText: options.innerText,
                        innerHTML: options.innerHTML,
                        options: Object.assign({}, {
                            loading: true,
                            width: options.width,
                            height: options.height
                        }, options.options || {}),
                    })
                });
            },
            alert: (options = {}) => {
                return new Promise((resolve, reject) => {
                    new Modal({
                        name: options.name,
                        innerText: options.innerText,
                        innerHTML: options.innerHTML,
                        onclose: () => {
                            resolve()
                        },
                        onready: options.onready,
                        options: Object.assign({}, {
                            closeFromButton: true,
                            closeFromContainer: true,
                            width: options.width,
                            height: options.height,
                            content_only: options.content_only,
                            style: options.style
                        }, options.options || {}),
                        buttons: options.buttons || [{
                            value: "Ok",
                        }]
                    });
                });
            },
            error: (options = {}) => {
                return new Promise((resolve, reject) => {
                    new Modal({
                        name: options.name || "Oh no!",
                        innerText: options.innerText || "Something bad happened! Please try again later.",
                        innerHTML: options.innerHTML,
                        onclose: () => {
                            resolve()
                        },
                        options: Object.assign({}, {
                            closeFromButton: true,
                            closeFromContainer: true,
                            error: true,
                            width: options.width,
                            height: options.height
                        }, options.options || {}),
                        buttons: options.buttons || [{
                            value: "Close",
                            icon: 'check'
                        }]
                    });
                });
            }
        },
        Sounds: {
            m_bMuted: false,
            isPrecached: (sound) => {
                m_PrecachedSounds.includes(sound)
            },
            precache: (sound) => {
                if (Creators.Actions.Sounds.isPrecached(sound)) return;
                const a =  new Audio(sound);
                a.preload = 'auto';
                m_PrecachedSounds.push(sound);
            },
            play: (sound, volume = null) => {
                if (Creators.Actions.Sounds.m_bMuted) return;

                let flVolume = volume ? volume : (localStorage.volume || 5);

                // TODO(Johnny): recycle old audio element instead of making a new one.
                let hAudio = new Audio(sound);
                hAudio.volume = flVolume / 10 / 2;
                hAudio.play().catch(() => {});

                return hAudio;
            },
            mute: () => {
                Creators.Actions.Sounds.m_bMuted = true;
            },
            unmute: () => {
                Creators.Actions.Sounds.m_bMuted = false;
            }
        },
        API: {
            send: (url, config = {}) => {
                return new Promise((resolve, reject) => {
                    if (typeof url != "string") reject(new TypeError("API send error: URL is not a string."));
                    if (typeof config != "object") reject(new TypeError("API send error: Config is not an object."));

                    config.method = (config.method || "GET");
                    config.data = (config.data || {});
                    config.headers = (config.headers || {});

                    let fetchObject = {
                        method: config.method
                    }

                    if (config.method == "GET") {
                        if (url.split("?").length > 1) {
                            url = url.concat(Object.keys(config.data).map(k => {
                                return "&" + encodeURIComponent(k) + "=" + encodeURIComponent(config.data[k]);
                            }).join(""));
                        } else {
                            url = url.concat("?", Object.keys(config.data).map(k => {
                                return encodeURIComponent(k) + "=" + encodeURIComponent(config.data[k]);
                            }).join("&"));
                        }
                    } else if (config.method == "POST") {
                        let body = new FormData();
                        for (let i in config.data)
                        {
                            body.append(i, config.data[i]);
                        }
                        fetchObject.body = body;
                    } else {
                        fetchObject.body = JSON.stringify(config.data);
                    }

                    fetchObject.headers = Object.assign({}, {
                        // "x-csrf-validation": window.csrfvalidation
                    }, config.headers);;
                    fetchObject.credentials = "include";

                    let text;
                    fetch(url, fetchObject)
                        .then(r => {
                            return new Promise((re, rj) => {
                                r.text().then(t => {
                                    text = t;
                                    try {
                                        if (config.raw === true) {
                                            re(text);
                                        } else {
                                            re(JSON.parse(text));
                                        }
                                    } catch (e) {
                                        rj({
                                            e,
                                            t
                                        });
                                    }
                                });
                            })
                        })
                        .then(resolve)
                        .catch(o => {
                            /*
                            let report = Creators.Actions.API.FormAReport({
                                referrer: document.location.href,
                                url: url,
                                request: JSON.stringify(config).replace(/\"/, "%22").replace(/\'/, "%27"),
                                response: o.t,
                                error: o.e.toString(),
                                time: new Date().toString()
                            });
                            Creators.Actions.Modals.error({
                                name: "Request error!",
                                innerText: "We've got some request errors, please help us identify this bug by sending an error report (no personal data will be taken):</br><a href='/report/error?raw=" + report + "'>Send an error report.</a>"
                            });*/
                            reject("Error during fetch on API send");
                        });
                });
            },
            FormAReport: (data) => {
                console.log(data);
                return encodeURIComponent(btoa(JSON.stringify(data)));
            }
        }
    }
};

function Settings_ShowSettings() {
    Creators.Actions.Modals.alert({
        name: "Settings",
        innerHTML: `<p>
            <div class="text-center tf2-secondary">Sounds Volume</div>
            <div class="flex settings_progress_wrapper">
                <div onclick="Settings_VolumeLower()" class="tf-button noshrink"><i class="mdi mdi-volume-minus"></i></div>
                <div class="settings_progress fullwidth">
                    <div class="settings_progress_inner volume"></div>
                    <div class="settings_progress_text volume">50%</div>
                </div>
                <div onclick="Settings_VolumeHigher()" class="tf-button noshrink"><i class="mdi mdi-volume-plus"></i></div>
            </div>
        </p>`
    });
    Settings_UpdateVolumeScroll();
}

function Settings_VolumeHigher() {
    if (!localStorage.volume) localStorage.volume = 0;
    if (localStorage.volume >= 10) return;
    localStorage.volume++;
    Settings_UpdateVolumeScroll();
}

function Settings_UpdateVolumeScroll() {
    let volume = localStorage.volume || 5;

    let hEl = document.querySelector(".settings_progress_inner.volume");
    if (hEl) {
        hEl.style.width = `${volume * 10}%`;
    }

    hEl = document.querySelector(".settings_progress_text.volume");
    if (hEl) {
        hEl.innerText = `${volume * 10}%`;
    }
}


function Settings_VolumeLower() {
    if (!localStorage.volume) localStorage.volume = 0;
    if (localStorage.volume <= 0) return;
    localStorage.volume--;
    Settings_UpdateVolumeScroll();
}

function Accessibility_HideSidebar() {
    // We set this to an empty string because !'' == true
    localStorage.setItem('pref-show-sidebar', '');
    $('#sidebar-hide').css('display', 'none');
    $('#sidebar-show').css('display', 'block');
    $('.right-panels').css('margin-right', '-296px');
}

function Accessibility_ShowSidebar() {
    localStorage.setItem('pref-show-sidebar', '1');
    $('#sidebar-show').css('display', 'none');
    $('#sidebar-hide').css('display', 'block');
    $('.right-panels').removeAttr('style');
}

function Accessibilty_SidebarAnimations(enable = true) {
    if (enable)
        $('.right-panels').addClass('animated');
    else
        $('.right-panels').removeClass('animated');
}

document.addEventListener("DOMContentLoaded", function(event) {

    // Working with Sliders
    let sliders = document.querySelectorAll("[image-carousel]");
    for (let slider of sliders) {
        slider.setAttribute("class", "glide");
        slider.innerHTML = `
        <div class="glide">
          <div class="glide__track" data-glide-el="track">
            <div class="glide__slides">
              ${slider.innerHTML}
            </div>
          </div>

          <div class="glide__arrows" data-glide-el="controls">
            <button class="glide__arrow glide__arrow--left" data-glide-dir="<">&lt;</button>
            <button class="glide__arrow glide__arrow--right" data-glide-dir=">">&gt;</button>
          </div>
        </div>`;
        new Glide(slider, {
            type: "carousel",
            gap: 0
        }).mount();
    }

    // CSS cursor tracking trickery
    //   idea from https://www.30secondsofcode.org/css/s/mouse-cursor-gradient-tracking
    for (const btn of document.getElementsByClassName('tf-button')) {
        btn.addEventListener('mousemove', ({clientX: x, clientY: y}) => {
            let rect = btn.getBoundingClientRect();
            let X = ((x - rect.left) - (rect.width / 2)) / rect.width * 10;
            let Y = ((y - rect.top) - (rect.height / 2)) / rect.height * 10;
            btn.style.setProperty('--x', `calc(${X}% + 50%)`);
            btn.style.setProperty('--y', `calc(${Y}% + 50%)`);
        });
    }


    $('#sidebar-hide').click(event => Accessibility_HideSidebar());
    $('#sidebar-show').click(event => Accessibility_ShowSidebar());

    // Okay, it's safe to attach animations now.
    // ONHOLD(Johnny): A lot of staff think this needs more testing. Disable for now.
    const VIEWPORT_WIDTH_SAFE = 1200;
    if (screen.width <= VIEWPORT_WIDTH_SAFE)
    {
        if (!(localStorage.getItem('pref-show-sidebar') ?? true)) {
            Accessibility_HideSidebar();
        }

        window.setTimeout(() => Accessibilty_SidebarAnimations(true), 1);
    }
});
