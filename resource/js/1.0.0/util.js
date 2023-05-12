let db = {
    uname : "anonymous",
    mmap : {
        "memo": {},
        "link": []
    },
    ylist : {
        "default" : {}
    },
    slist : {},
    skey : ""
};
let linkmode = true;
try {
    if (localStorage.getItem("page") == null) localStorage.setItem("page", 0);
} catch { 
    alert("웹 사이트 쿠키를 허용해주세요.\nchrome://settings/cookies")
}

const toggleUtil = class {
    /**
    * @type {(e: MouseEvent?) => void}
    */
    static widget = e => {
        const index = (e) ? (e.target.nodeName != "TD") ? [localStorage.getItem("page"), getIndex(scan("!footer td"), e.target.parentElement)] : [localStorage.getItem("page"), getIndex(scan("!footer td"), e.target)] : [0, localStorage.getItem("page")];
        if (e) localStorage.setItem("page", index[1]);
        scan("!footer td")[index[0]].style.background = null;
        scan("!main")[index[0]].setAttribute("hidden", null);
        scan("!footer td")[index[1]].style.background = "rgba(180, 180, 180, 0.3)";
        scan("!main")[index[1]].removeAttribute("hidden");
    }
}

const reloadUtil = class {
    /**
    * @type {() => void}
    */
    static mLink = () => {
        snipe("#mlink").reset();
        for (let i = 0; i < db.mmap.link.length; i++) {
            let obj = $("li").add(
                $("img", {src:`https://www.google.com/s2/favicons?domain=${db.mmap.link[i]}`}),
                $("a", {text:db.mmap.link[i], href:db.mmap.link[i], style:"cursor:pointer"}),
                $("input", {type:"button", value:"제거"})
            );
            obj.children(1).onclick = (e => {
                e.preventDefault();
                window.open(e.target.innerText);
            })
            obj.children(2).onclick = (e => {
                if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                else if (confirm("정말로 해당 항목을 삭제하시겠습니까?")) {
                    db.mmap.link = db.mmap.link.filter(data => { return getIndex(db.mmap.link, data) !== getIndex(e.target.parentElement.parentElement, e.target.parentElement); });
                    firebaseUtil.sync();
                    this.mLink();
                }
            })
            snipe("#mlink").add(obj);
        }
    }
    /**
    * @type {() => void}
    */
    static mMemo = () => {
        snipe("#memo_list").reset()
        for (let title of Object.keys(db.mmap.memo).sort()) {
            snipe("#memo_list").add(
                $("option", {text:title})
            )
        }
    }
    /**
    * @type {() => void}
    */
    static yList = () => {  
        snipe("#ylist").reset();
        const keys = Object.keys(db.ylist).sort();
        for (let i = 0; i < keys.length; i++) {
            let listcase = $("fieldset").add(
                $("legend", {text:keys[i]}),
                $("form").add(
                    $("input", {type:"text", placeholder:"Ex) https://www.youtube.com/watch?...", style:"background-image: url(/resource/img/icon/plus.png)"})
                ),
                $("ul"),
                $("input", {type:"button", style:"background-image:url('/resource/img/icon/del.png')", value:"이 재생목록 모음 지우기"})
            ), sort = Object.keys(db.ylist[keys[i]]).sort().reduce(
                (parsing, key) => {
                    parsing[key] = db.ylist[keys[i]][key];
                    return parsing;
                 }, {}
            );
            for (let j of Object.keys(sort)) {
                let list = $("li").add(
                    $("img", {src:"/resource/img/icon/video.png"}),
                    $("a", {text:j, href:sort[j], style:"cursor:pointer;display:inline-block;width:80%"}),
                    $("br"),
                    $("input", {type:"button", style:"width:20%;", value:"이름 수정"}),
                    $("input", {type:"button", style:"width:20%;", value:"제거"})
                );
                list.children(1).onclick = e => {
                    e.preventDefault();
                    scan("#inner_2_2 iframe").src = e.target.href.in("list=") ? `${e.target.href.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1` : e.target.href.replace("m.", "www.").replace("watch?v=", "embed/");
                    location.href = "#inner_2_2";
                }
                list.children(3).onclick = () => {
                    let value = prompt("재생목록의 이름을 무엇으로 하겠습니까? (취소나 공백을 입력하면 변경이 적용되지 않습니다.)")
                    if (value && !value.isEmpty()) {
                        db.ylist[keys[i]][value] = db.ylist[keys[i]][j];
                        delete db.ylist[keys[i]][j];
                        firebaseUtil.sync();
                        this.yList();
                    }
                }
                list.children(4).onclick = () => {
                    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                    else if (confirm("정말로 해당 재생목록을 재생목록 모음에서 제거할까요?")) {
                        delete db.ylist[keys[i]][j];
                        firebaseUtil.sync();
                        this.yList();
                    }
                }
                snipe(listcase.children(2)).add(list);
            }
            listcase.children(1).onsubmit = e => {
                e.preventDefault();
                if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                else {
                    if (!Object.values(db.ylist[keys[i]]).in(e.target[0].value)) {
                        db.ylist[keys[i]][e.target[0].value.split("?")[1]] = e.target[0].value;
                        firebaseUtil.sync();
                        this.yList();
                    } else alert("해당 재생목록은 이미 존재합니다.");
                }
            }
            listcase.children(3).onclick = () => {
                if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                else if (confirm("정말로 해당 재생목록 모음을 삭제하시겠습니까?")) {
                    delete db.ylist[keys[i]];
                    firebaseUtil.sync();
                    this.yList();
                }
            }
            snipe("#ylist").add(listcase);
        }
    }
    /**
    * @type {() => void}
    */
    static sList = () => {
        snipe("#slist").reset();
        snipe("#statistics_list").reset();
        const keys = Object.keys(db.slist).sort();
        for (let i = 0; i < keys.length; i++) {
            snipe("#statistics_list").add($("option", {text:keys[i]}));
            let listcase = $("fieldset").add(
                $("legend", {text:`통계 ${keys[i]}`}),
                $("form").add(
                    $("input", {type:"text", placeholder:"저장할 통계량(실수만 입력)", style:"background-image: url(/resource/img/icon/plus.png)"})
                ),
                $("ul"),
                $("input", {type:"button", style:"background-image: url('/resource/img/icon/del.png')", value:"이 통계 지우기", onclick:() => { deleteStatistics(this); }})
            )
            const values = db.slist[keys[i]];
            for (let j = 0; j < values.length; j++) {
                let list = $("li").add(
                    $("span", {text:values[j]}),
                    $("input", {type:"button", style:"width:60px;", value:"제거"})
                )
                list.children(1).onclick = e => {
                    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                    else if (confirm("정말로 해당 통계량을 해당 통계에서 제거할까요?")) {
                        db.slist[keys[i]] = db.slist[keys[i]].filter((data, index) => { return index !== getIndex(e.target.parentElement.parentElement, e.target.parentElement); })
                        firebaseUtil.sync();
                        this.sList();
                    }
                }
                snipe(listcase.children(2)).add(list);
            }
            listcase.children(1).onsubmit = e => {
                e.preventDefault();
                if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                else {
                    db.slist[keys[i]].push(e.target[0].value);
                    firebaseUtil.sync();
                    this.sList();
                }
            }
            listcase.children(3).onclick = () => {
                if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                else if (confirm("정말로 해당 통계를 제거할까요?")) {
                    delete db.slist[keys[i]];
                    firebaseUtil.sync();
                    this.sList();
                }
            }
            snipe("#slist").add(listcase);
        }
    }
    /**
    * @type {() => Promise<void>}
    */
    static sKey = async () => { await firebaseUtil.get("dat").then(data => { if (data) snipe("body").add($("script", {src:`https://${data.data().key.url}/${data.data().key.spliter}${db.skey.split(" ")[0]}.js`})); })}
    /**
    * @type {() => Promise<void>}
    */
    static all = () => {
        this.mLink();
        this.mMemo();
        this.yList();
        this.sList();
        this.sKey();
    }
}

const CLOCK = setInterval(function () {
    const DATA = new Date();
    const MINUTE = String(DATA.getMinutes()).padStart(2, "0");
    const SECOND = String(DATA.getSeconds()).padStart(2, "0");
    try {
        snipe("#time").set({html:`${DATA.getFullYear()}년 ${DATA.getMonth() + 1}월 ${DATA.getDate()}일 <br> ${(DATA.getHours() <= 12) ? `오전 ${String(DATA.getHours()).padStart(2, "0")}` : `오후 ${String(DATA.getHours() - 12).padStart(2, "0")}`}시 ${MINUTE}분 ${SECOND}초.`});
        snipe(".hour_pin").set({style:`transform:rotate(${DATA.getHours() * 30}deg)`})
        snipe(".minute_pin").set({style:`transform:rotate(${MINUTE * 6}deg)`})
        snipe(".second_pin").set({style:`transform:rotate(${SECOND * 6}deg)`})
    } catch (e) { }
}, 1000);

waitFirebaseAuthInfo().then(() => {
    firebaseUtil.get("user").then(data => {
        data.data() ? db = data.data() : data.ref.set(db);
        scan(".login input").value = db.uname;
        reloadUtil.all();
    });
})

scan("#ylist-input").onsubmit = (e => {
    e.preventDefault();
    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
    else {
        (!Object.keys(db.ylist).in(e.target[1].value)) ? db.ylist[e.target[1].value] = { } : null;
        e.target[1].value = "";
        firebaseUtil.sync();
        reloadUtil.yList();
    }
})
scan("#slist_input").onsubmit = (e => {
    e.preventDefault();
    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
    else {
        (!Object.keys(db.slist).in(e.target[1].value)) ? db.slist[e.target[1].value] = [] : null;
        e.target[1].value = "";
        firebaseUtil.sync();
        reloadUtil.sList();
    }
})
scan("#skey_input").onsubmit = (e => {
    e.preventDefault();
    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
    else {
        firebaseUtil.get("dat").then(async data => {
            db.skey = e.target[0].value;
            if (data) await firebaseUtil.sync().then(() => { location.reload(); })
            else alert("관리자 권한이 없는 사람은 특수문서에 링크하실 수 없습니다.");
        })
    }
})
scan("!footer td").forEach(obj => { obj.onclick = toggleUtil.widget; });
scan("!#selectStyle input").forEach(obj => { obj.onclick = toggleUtil.style; });
toggleUtil.widget();