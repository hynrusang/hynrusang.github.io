snipe("!article")[0].reset(
    $("fieldset").add(
        $("legend").add(
            $("img", "$<<effect/img/icon-special.png", "style<<width: auto; height: 25px;", "alt<<로그인 창"),
            $("span", "$<<회원가입")
        ),
        $("form", "id<<regist", "method<<post").add(
            $("input", "$<<text", "style<<background-image: url('effect/img/icon-igo.png')", "placeholder<<이메일 주소 (인증에 사용됩니다.)"),
            $("input", "$<<password", "style<<background-image: url('effect/img/icon-special.png')", "placeholder<<비밀번호 (6자 이상)"),
            $("input", "$<<password", "style<<background-image: url('effect/img/icon-special.png')", "placeholder<<비밀번호 확인"),
            $("input", "$<<submit", "value<<회원가입"),
            $("input", "$<<button", "value<<로그인 화면으로 이동", "onclick<<loading('login')")
        )
    ),
    $("a", "$<<처음 화면으로 돌아가기", "href<<javascript:loading('index');")
)
scan("#regist").onsubmit = async e => {
    e.preventDefault();
    if (scan("!#regist input")[1].value != scan("!#regist input")[2].value) alert("비밀번호가 일치하지 않습니다.");
    else await firebase.auth().createUserWithEmailAndPassword(scan("!#regist input")[0].value, scan("!#regist input")[1].value).then(async data => { 
        await data.user.sendEmailVerification().then(() => { 
            alert("회원가입이 완료되었습니다. (회원가입 때 사용하셨던 이메일 주소에서, 이메일 인증을 해주세요.)");
            location.reload();
        });
    }).catch(e => {
        if (e.code == "auth/weak-password") alert("비밀번호는 최소 6자리 이상이여야만 합니다.");
        else if (e.code == "auth/email-already-in-use") alert("이미 가입된 이메일입니다. (자신이 가입한 이메일이 아닐 경우, 로그인 창의 비밀번호 변경을 통해 로그인 하신 후, 회원탈퇴 해주세요.)");
        else console.log(e);
    })
}