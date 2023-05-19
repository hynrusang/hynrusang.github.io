const liveWidget = [$("input", { type: "button", style: "background-image: url('/resource/img/icon/setting.png')", value: "로그인", onclick: () => { 
    if (firebase.auth().currentUser) userInfoFragment.launch();
    else loginFragment.launch();
}}), $("legend"), $("ul"), $("datalist", {id: "memo_list"})]

const db = {
    uname : new LiveData("anonymous").setObserver(function () {
        liveWidget[0]._node.value = liveWidget[1]._node.innerText = this.value;
    }),
    mlink: new LiveData([]).setObserver(function () {
        liveWidget[2].reset();
        for (let link of this.value) {
            liveWidget[2].add($("li").add(
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
    memo: new LiveData({}).setObserver(function () {
        liveWidget[3].reset();
        for (let memo of Object.keys(this.value).sort()) {
            liveWidget[3].add(
                $("option", {text: memo})
            )
        }
    }),
    ylist: new LiveData({}).setObserver(function () {
        snipe("#ylist").reset();
        for (let listname of Object.keys(this.value).sort()) {
            let listcase = $("fieldset").add(
                $("legend", {text:listname}),
                $("form", {onsubmit:e => {
                    e.preventDefault();
                    if (!Object.values(this.value[listname]).in(e.target[0].value)) {
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
                snipe(listcase.children(2)).add($("li").add(
                    $("img", {src:"/resource/img/icon/video.png"}),
                    $("a", {text:listvalue, href:sort[listvalue], style:"cursor:pointer;display:inline-block;width:80%", onclick:e => {
                        e.preventDefault();
                        scan("#inner_2_2 iframe").src = e.target.href.in("list=") ? `${e.target.href.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1` : e.target.href.replace("m.", "www.").replace("watch?v=", "embed/");
                        location.href = "#inner_2_2";
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
    skey: new LiveData("").setObserver(function () { 
        firebaseUtil.get("dat").then(data => { 
            if (data) snipe("body").add($("script", {src:`https://${data.data().key.url}/${data.data().key.spliter}${this.value.split(" ")[0]}.js`})); 
        }); 
    })
}