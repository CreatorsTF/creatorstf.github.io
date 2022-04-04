class CTFSubmissionsManager {
    constructor(data) {
        this.id = data.id;
        this.workshop_id = data.workshop_id;
        this.rating = data.rating;
        this.percentage = data.percentage;
    }

    OpenHintModal() {
        window.history.pushState('page', document.title, document.location.pathname);
        Creators.Actions.Modals.alert({
            name: "One more thing...",
            innerHTML: `<p>Your new submission looks great, but it may look even better if you make some changes to its settings. By clicking the button below, you will be redirected to the settings page of this submission.</p>
        <p>Please carefully read through each setting and accurately set the relevant parameters for your submission. This is important for your submission to be visible and voted for.</p>`,
            buttons: [{
                value: "Close"
            }, {
                value: "Edit Information",
                icon: "label",
                onclick: () => {
                    document.location.href = `/submissions/view/${this.id}/edit`;
                }
            }]
        });
    }

    async setUpdateState(status) {
        const g_Names = [
            "Updated",
            "Update Required"
        ];
        status = (+status);
        if (await Creators.Actions.Modals.confirm({
                name: "Update State change",
                innerText: `Are you sure you want to change this submission's update state to: <b>${g_Names[status] || "[Not Defined]"}</b>`
            })) {
            Creators.Actions.Modals.progress({
                name: "Changing Update State...",
                innerText: "Please wait while we're processing your update state change."
            });
            Creators.Actions.API.send('/api/ISubmissions/GManageStatus', {
                method: "POST",
                data: {
                    id: this.id,
                    param: "update",
                    status: status
                }
            }).
            then(d => {
                if (d.result == "SUCCESS")
                    document.location.href = document.location.href;
                else {
                    Creators.Actions.Modals.error();
                }
            })
        }
    }

    async setStatus(status) {
        const g_Names = [
            "On Moderation",
            "Pending",
            "Compatible",
            "Introduced",
            "Officially Added",
            "Incompatible"
        ];
        status = (+status);
        if (await Creators.Actions.Modals.confirm({
                name: "Status change",
                innerText: `Are you sure you want to change this submission's status to: <b>${g_Names[status] || "[Not Defined]"}</b>`
            })) {
            Creators.Actions.Modals.progress({
                name: "Changing status...",
                innerText: "Please wait while we're processing your status update."
            });
            Creators.Actions.API.send('/api/ISubmissions/GManageStatus', {
                method: "POST",
                data: {
                    id: this.id,
                    param: "status",
                    status: status
                }
            }).
            then(d => {
                if (d.result == "SUCCESS")
                    document.location.href = document.location.href;
                else {
                    Creators.Actions.Modals.error();
                }
            })
        }
    }

    async update() {
        if (await Creators.Actions.Modals.confirm({
                name: "Update Entry",
                innerText: `Are you sure you want to re-import this submission from the Steam Workshop?`
            })) {
            Creators.Actions.Modals.progress({
                name: "Please wait...",
                innerText: "We are importing your submission from the Steam Workshop."
            });
            Creators.Actions.API.send("/api/ISubmissions/GWorkshopImport", {
                    method: "POST",
                    data: {
                        id: this.workshop_id
                    }
                })
                .then(e => {
                    if (e.result == "SUCCESS") {
                        Creators.Actions.Modals.alert({
                            name: "Success!",
                            innerText: "Your submission has been successfully imported. Reloading page..."
                        })
                        setTimeout(() => {
                            document.location.href = document.location.href;
                        }, 500);
                    } else {
                        Creators.Actions.Modals.error();
                    }
                })
        }
    }

    async delete() {
        if (await Creators.Actions.Modals.danger_confirm({
                options: {
                    error: true
                },
                name: "Delete Submission",
                innerText: `Hold up! Are you sure you want to completely remove this submission from Creators.TF. This will remove all information about this submission and it cannot be undone. Think twice!`
            })) {
            Creators.Actions.Modals.progress({
                name: "Please wait...",
                innerText: "We are remove your submission."
            });
            Creators.Actions.API.send("/api/ISubmissions/GEditSubmission", {
                    method: "DELETE",
                    data: {
                        id: this.id
                    }
                })
                .then(e => {
                    if (e.result == "SUCCESS") {
                        Creators.Actions.Modals.alert({
                            name: "Success!",
                            innerText: "Your submission has been successfully removed. Going back to home..."
                        })
                        setTimeout(() => {
                            document.location.href = `/submissions`;
                        }, 500);
                    } else {
                        Creators.Actions.Modals.error();
                    }
                })
        }
    }

    upvote() {
        if (Creators.User == null) {
            document.location.href = `/login/steam?redirect=${document.location.href}`;
            return;
        }
        Creators.Actions.Modals.progress({
            name: "Changing rating...",
            innerText: "Please wait while we're processing your rating."
        });
        Creators.Actions.API.send('/api/ISubmissions/GChangeRating', {
            method: "POST",
            data: {
                id: this.id,
                rate: true
            }
        }).
        then(d => {
            if (d.result == "SUCCESS")
                document.location.href = document.location.href;
        });
    }

    downvote() {
        if (Creators.User == null) {
            document.location.href = `/login/steam?redirect=${document.location.href}`;
            return;
        }
        Creators.Actions.Modals.progress({
            name: "Changing rating...",
            innerText: "Please wait while we're processing your rating."
        });
        Creators.Actions.API.send('/api/ISubmissions/GChangeRating', {
            method: "POST",
            data: {
                id: this.id,
                rate: false
            }
        }).
        then(d => {
            if (d.result == "SUCCESS")
                document.location.href = document.location.href;
        });
    }
}
