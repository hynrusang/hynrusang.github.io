let youtubeHyperlink = ["", "", "", "", "", ""]
function youtubeSetting() {
    localStorage.setItem("youtube", JSON.stringify(youtubeHyperlink))
    for (i = 0; i < youtubeHyperlink.length; i++) (youtubeHyperlink[i] != "") ? $set($scan(["#top-2 iframe", i]), `${youtubeHyperlink[i]}&amp;loop=1`) : null
}

for (i = 0; i < $scan([".youtube"]).length; i++) {
    $scan([".youtube", i]).onsubmit = (e => {
        e.preventDefault();
        youtubeHyperlink[getIndex($scan([".youtube"]), e.target)] = e.target[0].children[1].value.replace("m.", "www.").replace("playlist", "embed/videoseries").replace("watch", "embed/videoseries")
        youtubeSetting()
        e.target[0].children[1].value = "";
    })
}
try {
    if (localStorage.getItem("youtube") != null) {
        youtubeHyperlink = JSON.parse(localStorage.getItem("youtube"))
        youtubeSetting();
    }
} catch (e) {
    alert(e)
}