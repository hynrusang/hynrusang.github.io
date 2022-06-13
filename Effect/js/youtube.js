let youtubelinkList = [];
function youtubeListLoad() {
    $reload("#videolist", []);
    let start = 1;
    for (i = 0; i < youtubelinkList.length; i++) {
        let li;
        if (youtubelinkList[i].indexOf("https://") == -1) {
            li = $("li", [`span$${youtubelinkList[i]}`, "input$button&&value<< / 제거"]).$()
            li.children[1].onclick = (e => {
                youtubelinkList = youtubelinkList.filter(inner => {
                    return getIndex(youtubelinkList, inner) !== getIndex(e.target.parentElement.parentElement, e.target.parentElement)
                })
                e.target.parentElement.remove()
                localStorage.setItem("youtube", JSON.stringify(youtubelinkList))
                youtubeListLoad()
            })
        } else {
            li = $(`li$style<<cursor: pointer;`, ["img$Effect/img/icon-save.png&&style<<width: 20px; height: 20px;", `span$${String(start++).padStart(3, "0")}번 채널&&title<<${youtubelinkList[i]}`, "input$button&&value<< / 제거"]).$()
            li.children[1].onclick = (e => {
                $scan("#video").children[0].src = `${e.target.title.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1`;
                $scan(".top-2-nowselect").classList.replace("top-2-nowselect", "hide")
                $scan("#top-2").children[1].classList.replace("hide", "top-2-nowselect")
            })
            li.children[2].onclick = (e => {
                youtubelinkList = youtubelinkList.filter(inner => {
                    return getIndex(youtubelinkList, inner) !== getIndex(e.target.parentElement.parentElement, e.target.parentElement)
                })
                e.target.parentElement.remove()
                localStorage.setItem("youtube", JSON.stringify(youtubelinkList))
                youtubeListLoad()
            })
        }
        $scan("#videolist").appendChild(li);
    }
}
try {
    if (localStorage.getItem("youtube") != null) {
        youtubelinkList = JSON.parse(localStorage.getItem("youtube"));
        youtubeListLoad();
    }
} catch (e) {
    alert(e)
}

$scan("#videosubmit").onsubmit = (e => {
    e.preventDefault();
    (youtubelinkList.indexOf(e.target[1].value) == -1) ? youtubelinkList.push(e.target[1].value) : null
    localStorage.setItem("youtube", JSON.stringify(youtubelinkList));
    e.target[1].value = "";
    youtubeListLoad();
})
