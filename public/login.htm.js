var resetPassword = async email => {
    await firebase.auth().sendPasswordResetEmail(email).then(() => {
        alert("이메일 주소로 비밀번호 초기화 메일을 보냈습니다.");
    }).catch(e => {
        if (e.code == "auth/invalid-email") alert("잘못된 이메일 주소입니다.");
        else if (e.code == "auth/user-not-found") alert("해당 계정은 존재하지 않습니다.");
    })
}
if (!firebase.auth().currentUser) {
    snipe("!article")[0].reset(
        $("fieldset").add(
            $("legend").add(
                $("img", "$<<effect/img/icon-library.png", "style<<width: auto; height: 25px;", "alt<<로그인 창"),
                $("span", "$<<로그인")
            ),
            $("form", "id<<login", "method<<post").add(
                $("input", "$<<text", "style<<background-image: url('effect/img/icon-igo.png')", "placeholder<<이메일 주소", "list<<email_sample"),
                $("input", "$<<password", "style<<background-image: url('effect/img/icon-special.png')", "placeholder<<비밀번호"),
                $("input", "$<<submit", "value<<로그인"),
                $("input", "$<<button", "value<<비밀번호 초기화"),
                $("input", "$<<button", "value<<회원가입 화면으로 이동", "onclick<<loading('regist')")
            )
        ),
        $("a", "$<<처음 화면으로 돌아가기", "href<<javascript:loading('index');")
    )
    scan("#login").onsubmit = async e => {
        e.preventDefault();
        await firebase.auth().signInWithEmailAndPassword(scan("!#login input")[0].value, scan("!#login input")[1].value).then(async data => {
            if (!data.user.emailVerified) {
                alert("이메일 인증이 되지 않은 계정은 사용하실 수 없습니다.");
                await data.user.sendEmailVerification().then(() => { alert("인증용 메일을 다시 보냈습니다."); })
                .catch(e => { if (e.code == "auth/too-many-requests") alert("현재 요청이 너무 많아서 요청을 보류중입니다. (잠시 후 다시 시도해주세요.)"); });
            }
            location.reload();
        }).catch(e => {
            if (e.code == "auth/wrong-password") alert("비밀번호가 잘못되었습니다.");
            else if (e.code == "auth/invalid-email") alert("잘못된 이메일 주소입니다.");
            else if (e.code == "auth/user-not-found") alert("해당 계정은 존재하지 않습니다.");
            else console.log(e);
        });
    }
    scan("!#login input")[3].onclick = () => { resetPassword(scan("!#login input")[0].value); };
} else {
    snipe("!article")[0].reset(
        $("fieldset", "id<<user_field").add(
            $("legend").add(
                $("span", `$<<${db.uname}`),
            ),
            $("input", "$<<button", "style<<background-image: url('effect/img/icon-save.png')", "value<<이름 변경"),
            $("input", "$<<button", "style<<background-image: url('effect/img/icon-special.png')", "value<<비밀번호 변경"),
            $("input", "$<<button", "style<<background-image: url('effect/img/icon-setting.png')", "value<<로그아웃"),
            $("input", "$<<button", "style<<background-image: url('effect/img/icon-warning.png')", "value<<회원 탈퇴"),
        ),
        $("a", "$<<처음 화면으로 돌아가기", "href<<javascript:loading('index');")
    )
    scan("!#user_field input")[0].onclick = () => {
        const temp = prompt("당신의 새로운 이름을 알려주세요. (아무 값도 입력하지 않으면 변경을 취소합니다.)");
        if (temp && temp != "") {
            db.uname = temp;
            scan("#user_field span").innerText = db.uname;
            firebaseUtil.sync();
        }
    }
    scan("!#user_field input")[1].onclick = () => { resetPassword(firebase.auth().currentUser.email); };
    scan("!#user_field input")[2].onclick = async () => { await firebase.auth().signOut().then(() => { location.reload(); }); };
    scan("!#user_field input")[3].onclick = async () => {
        if (confirm("정말로 이 계정을 삭제하시겠습니까? (이 결정은 번복되지 않습니다.) (추가로 다시 한 번 물어보는 절차도 없습니다.)")) {
            await firebaseUtil.get("user").then(data => { data.ref.delete() });
            await firebase.auth().currentUser.delete().then(() => { 
                alert("사이트에서 당신의 정보를 삭제했습니다. (다음에 뵙기를 믿습니다.)");
                location.reload();
            });
        }
    }
}