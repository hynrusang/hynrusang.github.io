let db = {
    uname : "anonymous",
    mlist : [],
    ylist : {},
    slist : {}
};
try {
    if (localStorage.getItem("page") == null) localStorage.setItem("page", 0);
} catch { }

/**
 * @type {(e: MouseEvent?) => void}
 */
const toggleWidget = e => {
    let index = [];
    if (e != null) {
        if (e.target.nodeName != "TD") index = [localStorage.getItem("page"), getIndex(scan("!footer td"), e.target.parentElement)];
        else index = [localStorage.getItem("page"), getIndex(scan("!footer td"), e.target)];
        localStorage.setItem("page", index[1]);
    } else index = [0, localStorage.getItem("page")];
    scan("!footer td")[index[0]].style.background = null;
    scan("!main")[index[0]].setAttribute("hidden", null);
    scan("!footer td")[index[1]].style.background = "rgba(180, 180, 180, 0.6)";
    scan("!main")[index[1]].removeAttribute("hidden");
}

/**
 * @type {() => void}
 */
const reloadMList = () => {
    snipe("#mlist").reset();
    for (let i = 0; i < db.mlist.length; i++) {
        let obj;
        if (db.mlist[i].indexOf("http") == 0) {
            obj = $("li").add(
                $("img", `$<<https://www.google.com/s2/favicons?domain=${db.mlist[i]}`),
                $("a", `$<<${db.mlist[i]}`, `href<<${db.mlist[i]}`, "style<<cursor:pointer"),
                $("input", "$<<button", "value<< / 제거")
            )
            obj.children(2).onclick = (e => {
                if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                else if (confirm("정말로 해당 항목을 삭제하시겠습니까?")) {
                    db.mlist = db.mlist.filter(data => { return getIndex(db.mlist, data) !== getIndex(e.target.parentElement.parentElement, e.target.parentElement); });
                    firebaseUtil.sync();
                    reloadMList();
                }
            })
        } else {
            obj = $("li").add(
                $("span", `$<<${db.mlist[i]}`),
                $("input", "$<<button", "value<< / 제거")
            )
            obj.children(1).onclick = (e => {
                if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                else if (confirm("정말로 해당 항목을 삭제하시겠습니까?")) {
                    db.mlist = db.mlist.filter(data => { return getIndex(db.mlist, data) !== getIndex(e.target.parentElement.parentElement, e.target.parentElement); });
                    firebaseUtil.sync();
                    reloadMList();
                }
            })
        }
        snipe("#mlist").add(obj);
    }
}

/**
 * @type {() => void}
 */
const reloadYList = () => {
    snipe("#ylist").reset();
    const keys = Object.keys(db.ylist).sort();
    for (let i = 0; i < keys.length; i++) {
        let listcase = $("fieldset").add(
            $("legend", `$<<${keys[i]}`),
            $("form").add(
                $("input", "$<<text", "placeholder<<Ex) https://www.youtube.com/watch?...", "style<<background-image: url(effect/img/icon-plus.png)")
            ),
            $("ul"),
            $("input", "$<<button", "value<<이 재생목록 모음 지우기")
        ), sort = Object.keys(db.ylist[keys[i]]).sort().reduce(
            (parsing, key) => {
                parsing[key] = db.ylist[keys[i]][key];
                return parsing;
             }, {}
        );
        for (let j of Object.keys(sort)) {
            let list = $("li").add(
                $("img", `$<<https://www.google.com/s2/favicons?domain=https://youtube.com/`),
                $("a", `$<<${j}`, `href<<${sort[j]}`, "style<<cursor:pointer;display:inline-block;width:80%;margin:0px;margin-left:5px;"),
                $("br"),
                $("input", "$<<button", "style<<width:20%;", "value<<이름 수정"),
                $("input", "$<<button", "style<<width:20%;", "value<<제거")
            );
            list.children(1).onclick = (e => {
                e.preventDefault();
                scan("#inner_2_2 iframe").src = `${e.target.href.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1`;
                location.href = "#inner_2_2"
            })
            list.children(3).onclick = (() => {
                let value = prompt("재생목록의 이름을 무엇으로 하겠습니까? (취소나 공백을 입력하면 변경이 적용되지 않습니다.)")
                if (value && value != "") {
                    db.ylist[keys[i]][value] = db.ylist[keys[i]][j];
                    delete db.ylist[keys[i]][j];
                    firebaseUtil.sync();
                    reloadYList();
                }
            })
            list.children(4).onclick = (() => {
                if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                else if (confirm("정말로 해당 재생목록을 재생목록 모음에서 제거할까요?")) {
                    delete db.ylist[keys[i]][j];
                    firebaseUtil.sync();
                    reloadYList();
                }
            })
            listcase.children(2).appendChild(list.node);
        }
        listcase.children(1).onsubmit = (e => {
            e.preventDefault();
            if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
            else {
                if (Object.values(db.ylist[keys[i]]).indexOf(e.target[0].value) == -1) {
                    db.ylist[keys[i]][e.target[0].value.split("?")[1]] = e.target[0].value;
                    firebaseUtil.sync();
                    reloadYList();
                } else alert("해당 재생목록은 이미 존재합니다.");
            }
        })
        listcase.children(3).onclick = (e => {
            if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
            else if (confirm("정말로 해당 재생목록 모음을 삭제하시겠습니까?")) {
                delete db.ylist[keys[i]];
                firebaseUtil.sync();
                reloadYList();
            }
        })
        snipe("#ylist").add(listcase);
    }
}

/**
 * @type {() => void}
 */
const reloadSList = () => {
    snipe("#slist").reset();
    const keys = Object.keys(db.slist).sort();
    for (let i = 0; i < keys.length; i++) {
        let listcase = $("fieldset").add(
            $("legend", `$<<통계 ${keys[i]}`),
            $("form").add(
                $("input", "$<<text", "placeholder<<저장할 통계량(실수만 입력)", "style<<background-image: url(effect/img/icon-plus.png)")
            ),
            $("ul"),
            $("input", "$<<button", "value<<이 통계 지우기", "onclick<<deleteStatistics(this)")
        )
        const values = db.slist[keys[i]];
        for (let j = 0; j < values.length; j++) {
            let list = $("li").add(
                $("span", `$<<${values[j]}`, "style<<cursor:pointer"),
                $("input", "$<<button", "value<< / 제거")
            )
            list.children(1).onclick = (e => {
                if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                else if (confirm("정말로 해당 통계량을 해당 통계에서 제거할까요?")) {
                    db.slist[keys[i]] = db.slist[keys[i]].filter((data, index) => { return index !== getIndex(e.target.parentElement.parentElement, e.target.parentElement); })
                    firebaseUtil.sync();
                    reloadSList();
                }
            })
            listcase.children(2).appendChild(list.node);
        }
        listcase.children(1).onsubmit = (e => {
            e.preventDefault();
            if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
            else {
                db.slist[keys[i]].push(e.target[0].value);
                firebaseUtil.sync();
                reloadSList();
            }
        })
        listcase.children(3).onclick = (e => {
            if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
            else if (confirm("정말로 해당 통계를 제거할까요?")) {
                delete db.slist[keys[i]];
                firebaseUtil.sync();
                reloadSList();
            }
        })
        snipe("#slist").add(listcase);
    }
}

/**
 * @type {() => Promise<void>}
 */
const reloadSKey = async () => { await firebaseUtil.get("system").then(data => { if (data) snipe("body").add($("script", `$<<https://${data.data().special}/--${db.skey}.js`)); })}

/**
 * @type {() => void}
 */
const reloadAll = () => {
    reloadMList();
    reloadYList();
    reloadSList();
    reloadSKey();
}

waitFirebaseAuthInfo().then(() => {
    firebaseUtil.get("user").then(data => {
        (data.data()) ? db = data.data() : data.ref.set(db);
        if (localStorage.getItem("hyperlink") != null) {
            db.mlist = JSON.parse(localStorage.getItem("hyperlink"));
            localStorage.removeItem("hyperlink");
            firebaseUtil.sync();
        }
        if (localStorage.getItem("youtube") != null) {
            db.ylist = JSON.parse(localStorage.getItem("youtube"));
            for (let i of Object.keys(db.ylist)) {
                let parsing = {};
                for (let j of db.ylist[i]) parsing[j] = j;
                db.ylist[i] = parsing;
            }
            localStorage.removeItem("youtube");
            firebaseUtil.sync();
        }
        if (localStorage.getItem("statistics") != null) {
            db.slist = JSON.parse(localStorage.getItem("statistics"));
            localStorage.removeItem("statistics");
            firebaseUtil.sync();
        }
        scan(".login input").value = db.uname;
        reloadAll();
    });
})

scan("#ylist-input").onsubmit = (e => {
    e.preventDefault();
    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
    else {
        (Object.keys(db.ylist).indexOf(e.target[1].value) == -1) ? db.ylist[e.target[1].value] = { } : null;
        e.target[1].value = "";
        firebaseUtil.sync();
        reloadYList();
    }
})
scan("#slist_input").onsubmit = (e => {
    e.preventDefault();
    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
    else {
        (Object.keys(db.slist).indexOf(e.target[1].value) == -1) ? db.slist[e.target[1].value] = [] : null;
        e.target[1].value = "";
        firebaseUtil.sync();
        reloadSList();
    }
})
scan("#skey_input").onsubmit = (e => {
    e.preventDefault();
    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
    else {
        firebaseUtil.get("system").then(async data => {
            db.skey = e.target[0].value;
            if (data) await firebaseUtil.sync().then(() => { location.reload(); })
            else alert("관리자 권한이 없는 사람은 특수문서에 링크하실 수 없습니다.");
        })
    }
})
scan("!footer td").forEach(obj => { obj.onclick = toggleWidget; });
toggleWidget();