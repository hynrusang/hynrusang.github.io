snipe("!article")[0].reset(
    $("fieldset").add(
        $("legend").add(
            $("img", {"src":"/resource/img/icon/plus.png", "alt":"회원가입 창"}),
            $("span", {"innerText":"회원가입"})
        ),
        $("span", {"innerText":"Enter 키를 누르면, 자동으로 다음 절차로 넘어갑니다."}),
        $("form", {"id":"regist", "method":"post"}).add(
            $("input", {"preValue": " ", "type":"email", "pattern":"[A-Za-z0-9]+@[A-Za-z0-9]+\.[A-Za-z]{2,}", "style":"background-image: url('/resource/img/icon/program.png')", "placeholder":"이메일 주소 (*@*.*) - 인증에 사용됩니다.", "oninput": e => {
                const target = e.target;
                const preValue = target.getAttribute("preValue");
                if (preValue.indexOf("@") == preValue.length - 1) {
                    switch (e.data) {
                    case "d":
                        e.target.value = e.target.value + "aum.net";
                        break;
                    case "n":
                        e.target.value = e.target.value + "aver.com";
                        break;
                    case "g":
                        e.target.value = e.target.value + "mail.com";
                        break;
                    case "h":
                        e.target.value = e.target.value + "anmail.net";
                        break;
                    }
                }
                snipe(e.target).set({"preValue": e.target.value});
            }}),
            $("input", {"type":"password", "style":"background-image: url('/resource/img/icon/lock.png')", "placeholder":"비밀번호 - 6자 이상", "autocomplete":"off"}),
            $("input", {"type":"password", "style":"background-image: url('/resource/img/icon/lock.png')", "placeholder":"비밀번호 확인", "autocomplete":"off"}),
            $("input", {"type":"submit", "value":"회원가입"}),
            $("input", {"type":"button", "value":"로그인 화면으로 이동", "onclick":() => { loading('login'); }})
        )
    ),
    $("a", {"innerText":"처음 화면으로 돌아가기", "href":"javascript:loading('index');"})
)
scan("#regist input").focus();
scan("!#regist input").forEach((obj, index) => {
    if (index < 2) obj.onkeypress = e => {
        if (e.key === "Enter") {
            e.preventDefault();
            scan("!#regist input")[getIndex(scan("!#regist input"), e.target) + 1].focus();
        }
    }
})
scan("#regist").onsubmit = async e => {
    e.preventDefault();
    if (scan("!#regist input")[1].value != scan("!#regist input")[2].value) alert("비밀번호가 일치하지 않습니다.");
    else await firebase.auth().createUserWithEmailAndPassword(scan("!#regist input")[0].value, scan("!#regist input")[1].value).then(async data => { 
        await data.user.sendEmailVerification().then(() => { 
            alert("회원가입이 완료되었습니다.\n(회원가입 때 사용하셨던 이메일 주소에서, 이메일 인증을 해주세요.)");
            location.reload();
        });
    }).catch(e => {
        if (e.code == "auth/weak-password") alert("비밀번호는 최소 6자리 이상이여야만 합니다.");
        else if (e.code == "auth/email-already-in-use") alert("이미 가입된 이메일입니다.\n(비밀번호를 잊으셨을 경우, 로그인 창의 비밀번호 초기화 기능을 이용해 주세요.)");
        else if (e.code == "auth/internal-error") alert("이 사이트에서는 회원가입 api를 호출하실 수 없습니다.");
        else console.log(e);
    })
}
