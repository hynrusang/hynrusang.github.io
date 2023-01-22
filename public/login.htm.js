snipe("!article")[0].reset(
    $("fieldset").add(
        $("legend").add(
            $("img", "$<<effect/img/icon-special.png", "style<<width: auto; height: 25px;", "alt<<로그인 창"),
            $("span", "$<<로그인")
        ),
        $("form", "id<<login", "method<<post").add(
            $("input", "$<<text", "style<<background-image: url('effect/img/icon-igo.png')", "placeholder<<이메일 주소"),
            $("input", "$<<password", "style<<background-image: url('effect/img/icon-special.png')", "placeholder<<비밀번호"),
            $("input", "$<<submit", "value<<로그인"),
            $("input", "$<<button", "value<<회원가입 화면으로 이동", "onclick<<loading('regist')")
        )
    ),
    $("a", "$<<처음 화면으로 돌아가기", "href<<javascript:loading('index');")
)
scan("#login").onsubmit = async e => {
    e.preventDefault();
    await firebase.auth().signInWithEmailAndPassword(scan("!#login input")[0].value, scan("!#login input")[1].value).then(data => {
        if (!data.user.emailVerified) alert("이메일 인증이 되지 않은 계정은 사용하실 수 없습니다.");
        location.reload();
    }).catch(e => {
        if (e.code == "auth/wrong-password") alert("비밀번호가 잘못되었습니다.");
    });
}