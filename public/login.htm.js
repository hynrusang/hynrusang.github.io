snipe("!article")[0].reset(
    $("fieldset").add(
        $("img", "$<<effect/img/icon-warning.png", "style<<width: 20px; height: 20px;"),
        $("p", "$<<한번 포털 사이트로 로그인 하셨으면, 다른 포털 사이트로 로그인 하실 수 없습니다.", "style<<display: inline"),
        $("legend").add(
            $("img", "$<<effect/img/icon-special.png", "style<<width: auto; height: 25px;", "alt<<로그인 창"),
            $("span", "$<<로그인 방식 선택")
        ),
        $("input", "$<<button", "style<<background-image: url(https://www.google.com/s2/favicons?domain=https://www.google.com/)", "value<<google.com"),
        $("input", "$<<button", "style<<background-image: url(https://www.google.com/s2/favicons?domain=https://www.facebook.com/)", "value<<facebook.com"),
    ),
    $("a", "$<<처음 화면으로 돌아가기", "href<<javascript:loading('index');")
)
scan("!article input")[0].onclick = () => { firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(() => { location.reload(); }); };
scan("!article input")[1].onclick = () => { firebase.auth().signInWithPopup(new firebase.auth.FacebookAuthProvider()).then(() => { location.reload(); }); };