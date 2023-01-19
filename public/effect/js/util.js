let db = {
    mlist : [],
    ylist : { "default" : []},
    slist : {}
};
try {
    if (localStorage.getItem("page") == null) localStorage.setItem("page", 0);
} catch { }

/**
 * @type {(e: MouseEvent) => void}
 */
const toggleWidget = e => {
    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
    else {
        let index = [];
        if (e != null) {
            if (e.target.nodeName != "TD") index = [localStorage.getItem("page"), getIndex(scan("!footer td"), e.target.parentElement)];
            else index = [localStorage.getItem("page"), getIndex(scan("!footer td"), e.target)];
            localStorage.setItem("page", index[1]);
        } else index = [0, localStorage.getItem("page")];
        scan("!footer td")[index[0]].style.background = null;
        scan("!main")[index[0]].setAttribute("hidden", null);
        scan("!footer td")[index[1]].style.background = "rgba(128, 128, 128, 0.5)";
        scan("!main")[index[1]].removeAttribute("hidden");
    }
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
                $("span", `$<<${db.mlist[i]}`, "style<<cursor:pointer", "onclick<<window.open(this.innerHTML)"),
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
    const keys = Object.keys(db.ylist);
    for (let i = 0; i < keys.length; i++) {
        let listcase = $("fieldset", `id<<youtubelinkList_${keys[i]}`).add(
            $("legend", `$<<${keys[i]}`),
            $("form").add(
                $("input", "$<<text", "placeholder<<Ex) https://www.youtube.com/watch?...", "style<<background-image: url(effect/img/icon-plus.png)")
            ),
            $("ul"),
            $("input", "$<<button", "value<<이 재생목록 모음 지우기")
        );
        const values = db.ylist[keys[i]];
        for (let j = 0; j < values.length; j++) {
            let list = $("li").add(
                $("img", `$<<https://www.google.com/s2/favicons?domain=https://youtube.com/`),
                $("span", `$<<${keys[i]} 중 ${[j + 1]}번 재생목록`, `link<<${values[j]}`, "style<<cursor:pointer"),
                $("input", "$<<button", "value<< / 제거")
            );
            list.children(1).onclick = (e => {
                scan("#inner_2_2 iframe").src = `${e.target.attributes[0].nodeValue.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1`;
                location.href = "#inner_2_2"
            })
            list.children(2).onclick = (e => {
                if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                else if (confirm("정말로 해당 재생목록을 재생목록 모음에서 제거할까요?")) {
                    let key = e.target.parentElement.parentElement.parentElement.id.split("_")[1];
                    db.ylist[key] = db.ylist[key].filter(data => { return getIndex(db.ylist[key], data) !== getIndex(e.target.parentElement.parentElement, e.target.parentElement) });
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
                let key = e.target.parentElement.id.split("_")[1];
                if (db.ylist[key].indexOf(e.target[0].value) == -1) {
                    db.ylist[key].push(e.target[0].value);
                    firebaseUtil.sync();
                    reloadYList();
                } else alert("해당 재생목록은 이미 존재합니다.");
            }
        })
        listcase.children(3).onclick = (e => {
            let key = e.target.parentElement.id.split("_")[1];
            if (key == "default") alert("default 재생목록 모음은 지울 수 없습니다.");
            else {
                if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                else if (confirm("정말로 해당 재생목록 모음을 삭제하시겠습니까?")) {
                    delete db.ylist[key];
                    firebaseUtil.sync();
                    reloadYList();
                }
            }
        })
        snipe("#ylist").add(listcase)
    }
}

/**
 * @type {() => void}
 */
const reloadSList = () => {
    snipe("#slist").reset();
    const keys = Object.keys(db.slist);
    for (var i = 0; i < keys.length; i++) {
        let listcase = $("fieldset", `id<<statistics_${keys[i]}`).add(
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
                    let key = e.target.parentElement.parentElement.parentElement.id.split("_")[1];
                    db.slist[key] = db.slist[key].filter((data, index) => {  
                        return index !== getIndex(e.target.parentElement.parentElement, e.target.parentElement); 
                    })
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
                db.slist[e.target.parentElement.id.split("_")[1]].push(e.target[0].value);
                firebaseUtil.sync();
                reloadSList();
            }
        })
        listcase.children(3).onclick = (e => {
            if (!firebase.auth().currentUser()) alert("먼저 로그인을 해 주십시오.");
            else if (confirm("정말로 해당 통계를 제거할까요?")) {
                delete db.slist[e.target.parentElement.id.split("_")[1]];
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
  scan(".login span").innerText = firebase.auth().currentUser.displayName;
  scan(".login input").value = "로그아웃";
  firebaseUtil.get("user").then(data => {
    if (data.data() == null) data.ref.set(db);
    else db = data.data();
    toggleWidget();
    reloadAll();
  });
})

scan("#mlist-input").onsubmit = (e => {
    e.preventDefault();
    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
    else {
        (db.mlist.indexOf(e.target[0].value) == -1) ? db.mlist.push(e.target[0].value) : null
        db.mlist.sort();
        e.target[0].value = "";
        firebaseUtil.sync();
        reloadMList();
    }
});
scan("#ylist-input").onsubmit = (e => {
    e.preventDefault();
    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
    else {
        (Object.keys(db.ylist).indexOf(e.target[1].value) == -1) ? db.ylist[e.target[1].value] = [] : null;
        db.ylist = Object.keys(db.ylist).sort().reduce(
            (result, key) => {
                result[key] = db.ylist[key];
                return result;
            }, {});
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
        db.slist = Object.keys(db.slist).sort().reduce(
            (result, key) => {
                result[key] = db.slist[key];
                return result;
            }, {});
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

if (localStorage.getItem("hyperlink") != null) {
  db.mlist = JSON.parse(localStorage.getItem("hyperlink"));
  reloadMList();
}
if (localStorage.getItem("youtube") != null) {
  db.ylist = JSON.parse(localStorage.getItem("youtube"));
  reloadYList();
}
if (localStorage.getItem("statistics") != null) {
  db.slist = JSON.parse(localStorage.getItem("statistics"));
  reloadSList();
}