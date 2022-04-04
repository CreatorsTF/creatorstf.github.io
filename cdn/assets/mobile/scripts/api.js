Creators.Mobile = {
    Init: function (worker) {
        console.log("Registering service worker...")
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register(worker).then(function (registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    if (Notification.permission == 'default') {
                        Notification.requestPermission(result => {
                            console.log("Notifications Enabled");
                            Creators.Mobile.Notify({ title: "Notifications Enabled!" })
                        });
                    }
                }, function (err) {
                    // registration failed :(
                    console.log('ServiceWorker registration failed: ', err);
                });
            });

        }
    },
    Share: function (url) {
        if (navigator.share) {
            navigator.share({
                //title: 'web.dev',
                //text: 'Check out web.dev.',
                url,
            })
                .then(() => console.log('Successful share'))
                .catch((error) => console.log('Error sharing', error));
        } else {
            alert("Sharing is not supported");
        }
    },
    /**
     * 
     * @param {object} data 
     * @param {string} data.title
     * @param {string} data.body  A string representing an extra content to display within the notification.
     * @param {string} data.icon Icon of the notification
     */
    Notify: function (data) {
        if (Notification.permission == 'granted') {
            navigator.serviceWorker.getRegistration().then(reg => {
                reg.showNotification(data.title, Object.assign(data, {
                    timestamp: Date.now(),
                    body: data.content,
                    badge: "/cdn/assets/mobile/images/creators_logo_gear_notify_badge.png?=v1",
                    data: {
                        dateOfArrival: Date.now(),
                        primaryKey: 1
                    }
                }));
            })
        }
    },
    openFullscreen: function () {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.webkitRequestFullscreen) { /* Safari */
            document.documentElement.webkitRequestFullscreen();
        } else if (document.msRequestFullscreen) { /* IE11 */
            document.documentElement.msRequestFullscreen();
        }
    },

    /* Close fullscreen */
    closeFullscreen: function () {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    },
}

