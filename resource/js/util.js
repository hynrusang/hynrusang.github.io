try {
    if (localStorage.getItem("page") == null) localStorage.setItem("page", 0);
} catch { 
    alert("웹 사이트 쿠키를 허용해주세요.\nchrome://settings/cookies")
}

const swip = e => {
    const index = (e) ? (e.target.nodeName != "TD") ? [localStorage.getItem("page"), getIndex(scan("!footer td"), e.target.parentElement)] : [localStorage.getItem("page"), getIndex(scan("!footer td"), e.target)] : [0, localStorage.getItem("page")];
    if (e) localStorage.setItem("page", index[1]);
    scan("!footer td")[index[0]].style.background = null;
    scan("!main")[index[0]].setAttribute("hidden", null);
    scan("!footer td")[index[1]].style.background = "rgba(180, 180, 180, 0.3)";
    scan("!main")[index[1]].removeAttribute("hidden");
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
        const rdb = data.data();
        if (rdb) {
            for (let key of Object.keys(rdb)) {
                if (["uname", "mlink", "memo", "ylist", "skey"].includes(key)) db[key].value = data.data()[key];
                else db[key] = data.data()[key]
            }
        } else data.ref.set(JSON.unlivedata(db))
    });
})

scan("#ylist-input").onsubmit = (e => {
    e.preventDefault();
    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
    else {
        let new_ylist = db.ylist.value;
        if (!Object.keys(new_ylist).in(e.target[1].value)) {
            new_ylist[e.target[1].value] = { }
            db.ylist.value = new_ylist;
            firebaseUtil.sync();
        } else alert("해당 재생목록 모음은 이미 존재합니다.");
        e.target[1].value = "";
    }
})
scan("#skey_input").onsubmit = (e => {
    e.preventDefault();
    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
    else {
        firebaseUtil.get("dat").then(async data => {
            if (data) {
                db.skey.value = e.target[0].value;
                await firebaseUtil.sync().then(() => { location.reload(); })
            } else alert("관리자 권한이 없는 사람은 특수문서에 링크하실 수 없습니다.");
        })
    }
})
scan("!footer td").forEach(obj => { obj.onclick = swip; });
swip();