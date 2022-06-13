let youtubelinkList = {"default": []};
if (Array.isArray(JSON.parse(localStorage.getItem("youtube")))) {
    youtubelinkList["default"] = JSON.parse(localStorage.getItem("youtube"));
    localStorage.setItem("youtube", JSON.stringify(youtubelinkList));
}
function youtubeListLoad() {
    $reload("#videolist", []);
    let keys = Object.keys(youtubelinkList);
    let values = Object.values(youtubelinkList);
    for (var i = 0; i < keys.length; i++) {
        let obj = $(`fieldset#youtubelinkList_${keys[i]}`, [
            `legend$${keys[i]}`,
            $("form", ["input$text&&placeholder<<Ex) https://www.youtube.com/watch?... &&style<<background-image: url(Effect/img/icon-plus.png)"]).$(),
            "ul",
            "input$button&&value<<이 재생목록 모음 지우기&&onclick<<deleteStatistics(this)"
        ]).$()
        obj.children[1].onsubmit = (e => {
            e.preventDefault();
            let parent = e.target.parentElement;
            let array = youtubelinkList[parent.id.split("_")[1]]
            if (array.indexOf(e.target[0].value) == -1) {
                youtubelinkList[parent.id.split("_")[1]].push(e.target[0].value);
                localStorage.setItem("youtube", JSON.stringify(youtubelinkList));
                youtubeListLoad();
            } else {
                alert("해당 재생목록은 이미 존재합니다.'")
                e.target[0].value = "";
            }
        })
        obj.children[3].onclick = (e => {
            if (`${e.target.parentElement.id.split("_")[1]}` == "default") {
                alert("default 재생목록 모음은 지울 수 없습니다.")
                return;
            }
            delete youtubelinkList[`${e.target.parentElement.id.split("_")[1]}`]
            localStorage.setItem("youtube", JSON.stringify(youtubelinkList));
            youtubeListLoad();
        })
        $scan("#videolist").appendChild(obj)
    };
    for (var i = 0; i < values.length; i++) {
        let target = $scan(`#youtubelinkList_${keys[i]}`);
        for (var j = 0; j < values[i].length; j++) {
            let obj = $("li", [`span$${keys[i]} 중 ${[j + 1]}번 재생목록&&link<<${values[i][j]}&&style<<cursor:pointer`, "input$button&&value<< / 제거"]).$()
            obj.children[0].onclick = (e => {
                $scan("#video").children[0].src = `${e.target.attributes[0].nodeValue.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1`;
                $scan(".top-2-nowselect").classList.replace("top-2-nowselect", "hide")
                $scan("#top-2").children[1].classList.replace("hide", "top-2-nowselect")
            })
            obj.children[1].onclick = (e => {
                let keys = e.target.parentElement.parentElement.parentElement.id.split("_")[1]
                youtubelinkList[keys] = youtubelinkList[keys].filter(inner => {
                    return getIndex(youtubelinkList[keys], inner) !== getIndex(e.target.parentElement.parentElement, e.target.parentElement)
                })
                localStorage.setItem("youtube", JSON.stringify(youtubelinkList));
                e.target.parentElement.remove()
                youtubeListLoad();
            })
            target.children[2].appendChild(obj)
        }
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
    (Object.keys(youtubelinkList).indexOf(e.target[1].value) == -1) ? youtubelinkList[e.target[1].value] = [] : null;
    localStorage.setItem("youtube", JSON.stringify(statisticsList));
    e.target[1].value = "";
    youtubeListLoad();
})
