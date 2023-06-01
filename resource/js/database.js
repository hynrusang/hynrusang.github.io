const __$$LIVEWIDGET = [$("input", { type: "button", style: "background-image: url('/resource/img/icon/setting.png')", value: "로그인", onclick: () => { 
    if (firebase.auth().currentUser) __$$FRAGMENTS[0].userInfoFragment.launch();
    else __$$FRAGMENTS[0].loginFragment.launch();
}}), $("legend"), $("ul"), $("datalist", {id: "memo_list"})]
const __$$CURRENTFRAGMENT = new LiveData(0).registObserver(function () {
    scan(".selected").classList.remove("selected");
    scan("!footer td")[this.value].classList.add("selected");
    if (this.value == 1) {
        scan("fragment").style.display = "none";
        scan("main#youtube").style.display = null;
    } else {
        scan("fragment").style.display = null;
        scan("main#youtube").style.display = "none";
        __$$FRAGMENTS[this.value].launch();
    }
    localStorage.setItem("page", this.value);
})
const R = new LiveDataManager({
    uname : new LiveData("", String).registObserver(function () {
        __$$LIVEWIDGET[0].node.value = __$$LIVEWIDGET[1].node.innerText = this.value;
    }),
    mlink: new LiveData([], Array).registObserver(function () {
        __$$LIVEWIDGET[2].reset();
        for (let link of this.value) {
            __$$LIVEWIDGET[2].add($("li").add(
                $("img", {src:`https://www.google.com/s2/favicons?domain=${link}`}),
                $("a", {text:link, href:link, style:"cursor:pointer", onclick:e => {
                    e.preventDefault();
                    window.open(e.target.innerText);
                }}),
                $("input", {type:"button", value:"제거", onclick:e => {
                    if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) {
                        this.value = this.value.remove(link);
                        firebaseUtil.sync();
                    }
                }})
            ));
        }
    }),
    memo: new LiveData({}, Object).registObserver(function () {
        __$$LIVEWIDGET[3].reset();
        for (let memo of Object.keys(this.value).sort()) {
            __$$LIVEWIDGET[3].add(
                $("option", {text: memo})
            )
        }
    }),
    ylist: new LiveData({}, Object).registObserver(function () {
        snipe("#ylist").reset();
        for (let listname of Object.keys(this.value).sort()) {
            let listcase = $("fieldset").add(
                $("legend", {text:listname}),
                $("form", {onsubmit:e => {
                    e.preventDefault();
                    if (!Object.values(this.value[listname]).includes(e.target[0].value)) {
                        let new_ylist = this.value;
                        new_ylist[listname][e.target[0].value.split("?")[1]] = e.target[0].value;
                        this.value = new_ylist;
                        firebaseUtil.sync();
                        this.dispatchObserver();
                    } else alert("해당 재생목록은 이미 존재합니다.");
                }}).add(
                    $("input", {type:"text", placeholder:"Ex) https://www.youtube.com/watch?...", style:"background-image: url(/resource/img/icon/plus.png)"})
                ),
                $("ul"),
                $("input", {type:"button", style:"background-image:url('/resource/img/icon/del.png')", value:"이 재생목록 모음 지우기", onclick:() => {
                    if (confirm("정말로 해당 재생목록 모음을 삭제하시겠습니까?")) {
                        let new_ylist = this.value;
                        delete new_ylist[listname];
                        this.value = new_ylist;
                        firebaseUtil.sync();
                    }
                }})
            ), sort = Object.keys(this.value[listname]).sort().reduce(
                (parsing, key) => {
                    parsing[key] = this.value[listname][key];
                    return parsing;
                 }, {}
            );
            for (let listvalue of Object.keys(sort)) {
                listcase.children(2).add($("li").add(
                    $("img", {src:"/resource/img/icon/video.png"}),
                    $("a", {text:listvalue, href:sort[listvalue], style:"cursor:pointer;display:inline-block;width:80%", onclick:e => {
                        e.preventDefault();
                        scan("#player iframe").src = e.target.href.includes("list=") ? `${e.target.href.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1` : e.target.href.replace("m.", "www.").replace("watch?v=", "embed/").split("&")[0];
                        location.href = "#player";
                    }}),
                    $("br"),
                    $("input", {type:"button", style:"width:20%;", value:"이름 수정", onclick:() => {
                        let value = prompt("재생목록의 이름을 무엇으로 하겠습니까? (취소나 공백을 입력하면 변경이 적용되지 않습니다.)")
                        if (value && !value.isEmpty()) {
                            let new_ylist = this.value;
                            new_ylist[listname][value] = new_ylist[listname][listvalue];
                            delete new_ylist[listname][listvalue];
                            this.value = new_ylist;
                            firebaseUtil.sync();
                            this.dispatchObserver();
                        }
                    }}),
                    $("input", {type:"button", style:"width:20%;", value:"제거", onclick:() => {
                        if (confirm("정말로 해당 재생목록을 재생목록 모음에서 제거할까요?")) {
                            let new_ylist = this.value;
                            delete new_ylist[listname][listvalue];
                            this.value = new_ylist;
                            firebaseUtil.sync();
                            this.dispatchObserver();
                        }
                    }})
                ));
            }
            snipe("#ylist").add(listcase);
        }
    }),
    secret: new LiveData({
        key: ""
    }, Object).registObserver(function () {
        firebaseUtil.get("dat").then(data => { 
            if (data) snipe("body").add($("script", {src:`https://${data.data().key.url}${data.data().key.spliter}${this.value.key.split(" ")[0]}.js`})); 
        });
        this.registObserver(null);
    })
}, false);