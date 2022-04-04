class CTFSubmissionsImporter {
    constructor(data) {
        this.DOM = {};
        this.DOM.Preview = document.querySelector(data.selector);

        this.DOM.Name = this.DOM.Preview.querySelector("#workshop_preview_name");
        this.DOM.ImageContainer = this.DOM.Preview.querySelector("#workshop_preview_container");
        this.DOM.ImageURL = this.DOM.Preview.querySelector("#workshop_preview_url");
        this.DOM.Image = this.DOM.Preview.querySelector("#workshop_preview_image");
        this.DOM.Description = this.DOM.Preview.querySelector("#workshop_preview_description");
        this.DOM.ImportText = this.DOM.Preview.querySelector("#workshop_preview_import_message");
        this.DOM.ImportButton = this.DOM.Preview.querySelector("#workshop_preview_import_button");
        this.DOM.Import = this.DOM.Preview.querySelector("#workshop_preview_import");
    }

    import(id) {
        Creators.Actions.Modals.progress({
            name: "Please wait...",
            innerText: "We are importing your submission from Steam Workshop."
        });
        Creators.Actions.API.send("/api/ISubmissions/GWorkshopImport", {
                method: "POST",
                data: {
                    id: id
                }
            })
            .then(e => {
                if (e.result == "SUCCESS") {
                    Creators.Actions.Modals.alert({
                        name: "Success!",
                        innerText: "Your submission has been succesfully imported. Redirecting..."
                    })
                    setTimeout(() => {
                        document.location.href = "/submissions/view/" + e.submission_id + "?show_hint";
                    }, 500);
                } else {
                    Creators.Actions.Modals.error({
                        name: "An error has occured...",
                        innerText: e.error.title
                    });
                }
            })
    }

    search(string) {
        let g_Id = string.split("?").slice(-1)[0];
        if (!/^\d+$/.test(g_Id)) {
            g_Id = g_Id.split("&").find(r => {
                return r.split("=")[0] == "id";
            });
            if (!!g_Id) g_Id = g_Id.split("=")[1];
            else return;
        }

        this.DOM.Preview.classList.add("loading");
        this.DOM.Preview.style.maxHeight = "500px";
        this.DOM.Preview.style.marginTop = "1em";
        this.DOM.Preview.style.borderTop = "1px solid #252525";
        this.DOM.Preview.style.paddingTop = "1em";
        this.DOM.Image.removeAttribute("src");
        this.DOM.ImportButton.onclick = null;

        Creators.Actions.API.send("/api/ISteamInterface/GWorkshop", {
                data: {
                    id: g_Id,
                    request: "id,name,description,thumb,images",
                    game_id: 440,
                    filter_noname: true,
                    filter_nocollections: true
                }
            })
            .then(e => {
                this.DOM.Preview.classList.remove("loading");

                if (e.result == "SUCCESS") {
                    this.DOM.Import.style.display = null;
                    if ((e.submissions.thumb || e.submissions.images[0]) == null) {
                        this.DOM.ImageContainer.style.display = "none";
                    } else {
                        this.DOM.ImageContainer.style.display = null;
                        this.DOM.Image.setAttribute("src", e.submissions.thumb || e.submissions.images[0]);
                        this.DOM.ImageURL.setAttribute("href", `https://steamcommunity.com/sharedfiles/filedetails/?id=${e.submissions.id}`);
                    }
                    this.DOM.Name.innerText = e.submissions.name;
                    this.DOM.Description.innerHTML = e.submissions.description.slice(0, 400) + "...";

                    if (e.can_import) {
                        this.DOM.ImportButton.onclick = () => {
                            this.import(e.submissions.id);
                        };
                        this.DOM.ImportButton.removeAttribute("disabled");
                        this.DOM.ImportText.innerHTML = '<i class="mdi mdi-check"></i> You can import this submission as a Creators.TF submission.';
                        this.DOM.ImportText.style.color = "#86EE86";
                    } else {
                        this.DOM.ImportButton.onclick = null;
                        this.DOM.ImportText.innerHTML = '<i class="mdi mdi-cancel"></i> You need to be listed as an author for this submission in order to be able to import it as a Creators.TF submission.';
                        this.DOM.ImportText.style.color = "#EE7D7D";
                        this.DOM.ImportButton.setAttribute("disabled", null);
                    }

                } else if (e.result == "ERROR") {
                    this.DOM.Import.style.display = "none";
                    this.DOM.ImportButton.onclick = null;

                    this.DOM.ImageContainer.style.display = "none";
                    this.DOM.Name.innerText = e.error.title;
                    this.DOM.Description.innerHTML = "There was an error while trying to find this submission. Please recheck your input data and search again.";
                    this.DOM.Description.style.color = "#EE7D7D";
                }
            })
    }
}

Creators.SubmissionImporter = new CTFSubmissionsImporter({
    selector: "#workshop_preview"
});
let g_Form = document.querySelector("#form_import_workshop");
let g_Input = g_Form.querySelector("input[name=workshop_link]");
g_Form.onsubmit = (e) => {
    e.preventDefault();
    let sValue = g_Input.value;
    Creators.SubmissionImporter.search(sValue);
}
