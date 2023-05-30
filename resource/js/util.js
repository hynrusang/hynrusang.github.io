try {
    if (localStorage.getItem("page") == null) localStorage.setItem("page", 0);
} catch { 
    alert("웹 사이트 쿠키를 허용해주세요.\nchrome://settings/cookies")
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
            for (let key of Object.keys(rdb)) R.value(key, data.data()[key]);
        } else {
            R.value("uname", "anonymous");
            data.ref.set(R.toObject())
        }
    });
})

scan("#ylist-input").onsubmit = (e => {
    e.preventDefault();
    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
    else {
        let new_ylist = R.value("ylist");
        if (!Object.keys(new_ylist).includes(e.target[1].value)) {
            new_ylist[e.target[1].value] = { }
            R.value("ylist", new_ylist);
            firebaseUtil.sync();
        } else alert("해당 재생목록 모음은 이미 존재합니다.");
        e.target[1].value = "";
    }
})
__$$CURRENTFRAGMENT.value = parseInt(localStorage.getItem("page"));
scan("!footer td").forEach((obj, index) => { obj.onclick = () => __$$CURRENTFRAGMENT.value = index; })
Array.prototype.edit = function (data, toReplace) {
    this[this.indexOf(data)] = toReplace;
    return this;
}