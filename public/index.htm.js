snipe("!article")[0].reset(
    $("section").add(
        $("div", "class<<login").add(
            $("input", "$<<button", "style<<cursor: pointer", "value<<로그인 화면으로 이동", "onclick<<loading('login');")
        ),
        $("a", "href<<https://hynrusang.github.io/", "style<<display: block; width: 10vw; height: 10vw; background: url(effect/img/icon-igo.png) 100% no-repeat; background-position: center center;"),
        $("div", "class<<clock").add(
            $("div", "class<<hour_pin"),
            $("div", "class<<minute_pin"),
            $("div", "class<<second_pin")
        ),
        $("p", "id<<time", "style<<position: relative; top: 10px; text-align: center;"),
        $("form", "id<<mlist-input").add(
            $("input", "$<<text", "style<<background-image:url(effect/img/icon-favorite.png)", "placeholder<<메모 또는 링크", "required")
        ),
        $("ul", "id<<mlist")
    )
)
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
waitFirebaseAuthInfo().then(() => {
    scan(".login input").value= firebase.auth().currentUser.displayName;
    firebaseUtil.get("user").then(data => {
        if (data.data() == null) data.ref.set(db);
        else db = data.data();
        reloadAll();
    });
})
scan("!article input")[0].onclick = e => {
    if (!firebase.auth().currentUser) loading("login");
    else if (confirm("사이트에서 로그아웃 하시겠습니까? (타 사이트를 이용하여 로그인 하셨을 경우, 타 사이트에서도 로그아웃 하셔야 합니다.)")) firebase.auth().signOut().then(() => { location.reload(); });
}