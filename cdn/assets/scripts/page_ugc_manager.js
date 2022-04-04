const UPLOAD_MAX_FILES = 100;

function UGC_UploadFiles_Provider_FromInput(input, provider_id)
{
    if(input.files.length == 0) return;

    var hData = new FormData();
    hData.append('provider', provider_id);

    let hBtn = input.parentElement.parentElement;

    let hProgress = hBtn.querySelector("#ugc_upload_progress");
    let hProgressBar = hBtn.querySelector("#ugc_upload_progress_bar");

    let iCount = 0;
    let iSize = 0;
    for(let hFile of input.files)
    {
        iCount++;
        hData.append('upload[]', hFile);
        iSize += hFile.size;
    }

    if(iCount >= UPLOAD_MAX_FILES)
    {
        Creators.Actions.Modals.error({
            name: "Uh oh..",
            innerText: `Maximum amount of files exceeded. Please select up to ${UPLOAD_MAX_FILES} files at once.`
        });
        return;
    }

    var hReq = new XMLHttpRequest();

    hReq.upload.addEventListener('progress', function (e)
    {
        if (e.loaded <= iSize)
        {
            let flPerc = e.loaded / iSize * 100;
            console.log(`Uploading: ${flPerc}%`);

            hProgressBar.style.width = `${flPerc}%`;
        }
    });

    hReq.addEventListener('load', function(e)
    {
        hBtn.classList.remove("disabled");
        hProgress.style.display = "none";

        let hData = JSON.parse(hReq.response);
        if(hData.result == "SUCCESS")
        {
            document.location.href = document.location.href;
        } else {
            alert(hData.error.title);
        }
    });

    hReq.open('POST', '/api/IUGC/GUploadProviderAssets');
    hReq.send(hData);
    hBtn.classList.add("disabled");

    hProgress.style.display = "block";
}
