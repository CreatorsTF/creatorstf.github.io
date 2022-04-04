var currentLauncherVersionLabel = document.getElementById("current-launcher-version");
var win_InstallerDownload = document.getElementById("win_InstallerDownloadLink");
var win_UnpackedDownload = document.getElementById("win_UnpackedDownloadLink");
var win_Unpacked32Download = document.getElementById("win_Unpacked32DownloadLink");
var linux_DebDownload = document.getElementById("linux_DebDownloadLink");
var linux_TarGzDownload = document.getElementById("linux_TarGzDownloadLink");
var linux_AppImageDownload = document.getElementById("linux_AppImageDownloadLink");

var request = new XMLHttpRequest();
request.open("GET", "https://api.github.com/repos/CreatorsTF/Creators.TF-Community-Launcher/releases/latest");
request.send();

request.onload = () => {
    if (request.status === 200) {
        var answer = JSON.parse(request.response);
        var downloadLink_linuxTarGz = answer.assets[0].browser_download_url;
        var downloadLink_linuxDeb = answer.assets[1].browser_download_url;
        var downloadLink_linuxAppImage = answer.assets[2].browser_download_url;
        var downloadLink_winInstaller = answer.assets[3].browser_download_url;
        var downloadLink_winUnpacked32 = answer.assets[7].browser_download_url;
        var downloadLink_winUnpacked = answer.assets[8].browser_download_url;
        
        win_InstallerDownload.href = downloadLink_winInstaller;
        win_UnpackedDownload.href = downloadLink_winUnpacked;
        win_Unpacked32Download.href = downloadLink_winUnpacked32;
        linux_DebDownload.href = downloadLink_linuxDeb;
        linux_TarGzDownload.href = downloadLink_linuxTarGz;
        linux_AppImageDownload.href = downloadLink_linuxAppImage;

        var version = answer.tag_name;
        currentLauncherVersionLabel.innerText = "Current version: " + version;
    } else {
        console.log(`ERROR. Status: ${request.status} -- Message: ${request.statusText}`);
    }
}

// Because it's better when the highlighted element scrolls
// to the center of the browser's window, not to the top.
var autoUpdateSection = document.getElementById("auto-updating");
var autoUpdateSectionButton = document.getElementById("auto-updating-button");
var otherDownloadsSection = document.getElementById("other-downloads");
var otherDownloadsSectionButton = document.getElementById("other-downloads-button");

function scroll() {
    autoUpdateSection.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "smooth"
    });
    autoUpdateSection.style.filter = "drop-shadow(0px 0px 25px #FFF3)";
}

function y() {
    if (!autoUpdateSection.style == "") {
        autoUpdateSection.removeAttribute("style");
    }
}

function otherDownloads() {
    if (otherDownloadsSection.style.height == "") {
        otherDownloadsSectionButton.innerHTML = "Other Downloads <i class='mdi mdi-chevron-up' style='top: 0px;'></i>";
        otherDownloadsSection.style.height = "70px";
        otherDownloadsSection.style.overflow = "visible";
    } else {
        otherDownloadsSectionButton.innerHTML = "Other Downloads <i class='mdi mdi-chevron-down' style='top: 0px;'></i>";
        otherDownloadsSection.style.height = "";
        otherDownloadsSection.style.overflow = "hidden";
    }
}

autoUpdateSectionButton.addEventListener("click", scroll);
document.documentElement.addEventListener("wheel", y);
otherDownloadsSectionButton.addEventListener("click", otherDownloads);
