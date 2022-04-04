class CTFForm {
    constructor(data) {
        this.request = Object.assign({}, {
            method: "POST",
            data: {}
        }, data.request);
        this.url = data.url;
        this.selector = data.selector;

        this.DOM = document.querySelector(this.selector);

        this.beforesend = data.beforesend || this.__beforesend;
        this.beforesuccess = data.beforesuccess || this.__beforesuccess;
        this.beforeerror = data.beforeerror || this.__beforeerror;
        this.beforeresult = data.beforeresult || this.__beforeresult;
        this.success = data.success || this.__success;
        this.error = data.error || this.__error;
        this.recaptcha = data.recaptcha || false;

        this.DOM.onsubmit = (e) => {
            e.preventDefault();

            let data = {};
            for (let i of this.DOM.elements) {
                if (["INPUT", "TEXTAREA"].includes(i.nodeName)) {
                    let name = i.name;
                    if (!!name && name != "") {
                        let value = i.value;
                        if (i.type == "checkbox" && i.checked == false) {
                            continue;
                        }
                        if (name.endsWith("[]")) {
                            name = name.slice(0, -2);
                            if (data[name] == null) {
                                data[name] = [];
                            }
                            data[name].push(value);
                        } else {
                            data[name] = value;
                        }
                    }
                } else if (i.nodeName == "SELECT") {
                    let a = i.options[i.selectedIndex].value;
                    data[i.name] = a;
                }
            }

            let request = Object.assign({}, this.request, {
                data: Object.assign({}, (this.request.data || {}), data)
            });

            if (typeof this.beforesend == "function")
                this.beforesend();

            Creators.Actions.API.send(this.url, request)
                .then(e => {
                    if (typeof this.beforeresult == "function")
                        this.beforeresult(e);
                    if (e.result == "SUCCESS") {
                        if (typeof this.beforesuccess == "function")
                            this.beforesuccess(e);
                        if (typeof this.success == "function")
                            this.success(e);
                    } else {
                        if (typeof this.beforeerror == "function")
                            this.beforeerror(e);
                        if (typeof this.error == "function")
                            this.error(e);
                    }
                })
                .catch(e => {
                    if (typeof this.beforeresult == "function")
                        this.beforeresult(e);
                    if (typeof this.beforeerror == "function")
                        this.beforeerror(e);
                    if (typeof this.error == "function")
                        this.error(e);
                })
        }
    }

    __beforesend() {
        Creators.Actions.Modals.progress({
            name: "Sending form...",
            innerText: "Please wait while we are processing your data."
        });
    }

    __beforesuccess() {}

    __beforeerror(e) {
        Creators.Actions.Modals.error({
            innerText: e
        });
    }

    __beforeresult() {
        Creators.Actions.Modals.close();
    }

    __success() {
        Creators.Actions.Modals.alert({
            name: "Success!",
            innerText: "Data has been successfully processed."
        });
    }

    __error(e) {
        Creators.Actions.Modals.error({
            innerText: e
        });
    }
}
