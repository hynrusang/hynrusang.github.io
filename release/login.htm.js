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
                $("img", {"src":"/resource/img/icon/library.png", "alt":"로그인 창"}),
                $("span", {"innerText":"로그인"})
            ),
            $("span", {"innerText":"Enter 키를 누르면, 자동으로 다음 절차로 넘어갑니다."}),
            $("form", {"id":"login", "method":"post"}).add(
                $("input", {"type":"email", "pattern":"[A-Za-z0-9]+@[A-Za-z0-9]+\.[A-Za-z]{2,}", "style":"background-image: url('/resource/img/icon/program.png')", "placeholder":"이메일 주소 (*@*.*)", "oninput": e => {
                    const target = e.target;
                    const preValue = (target.preValue) ? target.preValue : "";
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
                    target.preValue = target.value
                }}),
                $("input", {"type":"password", "style":"background-image: url('/resource/img/icon/lock.png')", "placeholder":"비밀번호", "autocomplete":"off"}),
                $("input", {"type":"submit", "value":"로그인"}),
                $("input", {"type":"button", "value":"비밀번호 초기화"}),
                $("input", {"type":"button", "value":"회원가입 화면으로 이동", "onclick": () => { loading('regist'); }})
            ),
            $("span", {"style":"display:inline-block;width:100%;text-align:center;", "innerText":"인증되지 않은 계정으로 로그인 할 시, 인증 메일을 다시 보냅니다."}),
        ),
        $("a", {"innerText":"처음 화면으로 돌아가기", "href":"javascript:loading('index');"})
    )
    scan("#login input").focus();
    scan("#login input").onkeypress = e => {
        if (e.key === "Enter") {
            e.preventDefault();
            scan("!#login input")[getIndex(scan("!#login input"), e.target) + 1].focus();
        }
    }
    scan("#login").onsubmit = async e => {
        e.preventDefault();
        await firebase.auth().signInWithEmailAndPassword(scan("!#login input")[0].value, scan("!#login input")[1].value).then(async data => {
            if (!data.user.emailVerified) {
                alert("이메일 인증이 되지 않은 계정은 사용하실 수 없습니다.\n(인증용 메일을 다시 보내드릴 테니, 해당 메일에서 이메일 인증을 해주세요.)");
                await data.user.sendEmailVerification().then(() => { alert("인증용 메일을 다시 보냈습니다."); })
                .catch(e => { if (e.code == "auth/too-many-requests") alert("현재 요청이 너무 많아서 요청을 보류중입니다.\n(잠시 후 다시 시도해주세요.)"); });
            }
            location.reload();
        }).catch(e => {
            if (e.code == "auth/wrong-password") alert("비밀번호가 잘못되었습니다.");
            else if (e.code == "auth/invalid-email") alert("잘못된 이메일 주소입니다.");
            else if (e.code == "auth/user-not-found") alert("해당 계정은 존재하지 않습니다.");
            else if (e.code == "auth/internal-error") alert("이 사이트에서는 로그인 api를 호출하실 수 없습니다.");
            else console.log(e);
        });
    }
    scan("!#login input")[3].onclick = () => { resetPassword(scan("!#login input")[0].value); };
} else {
    snipe("!article")[0].reset(
        $("fieldset", {"id":"user_field"}).add(
            $("legend").add(
                $("span", {"innerText":db.uname}),
            ),
            $("input", {"type":"button", "style":"background-image: url('/resource/img/icon/save.png')", "value":"이름 변경"}),
            $("input", {"type":"button", "style":"background-image: url('/resource/img/icon/lock.png')", "value":"비밀번호 변경 이메일 보내기"}),
            $("input", {"type":"button", "style":"background-image: url('/resource/img/icon/setting.png')", "value":"로그아웃"}),
            $("input", {"type":"button", "style":"background-image: url('/resource/img/icon/del.png')", "value":"회원 탈퇴"}),
        ),
        $("a", {"innerText":"처음 화면으로 돌아가기", "href":"javascript:loading('index');"})
    )
    scan("!#user_field input")[0].onclick = () => {
        const temp = prompt("당신의 새로운 이름을 알려주세요.\n(아무 값도 입력하지 않으면 변경을 취소합니다.)");
        if (temp && temp != "") {
            db.uname = temp;
            scan("#user_field span").innerText = db.uname;
            firebaseUtil.sync();
        }
    }
    scan("!#user_field input")[1].onclick = () => { resetPassword(firebase.auth().currentUser.email); };
    scan("!#user_field input")[2].onclick = async () => { await firebase.auth().signOut().then(() => { location.reload(); }); };
    scan("!#user_field input")[3].onclick = async () => {
        if (confirm("정말로 이 계정을 삭제하시겠습니까?\n(이 결정은 번복되지 않습니다.)\n(추가로 다시 한 번 물어보는 절차도 없습니다.)")) {
            await firebaseUtil.get("user").then(async data => { await data.ref.delete() });
            await firebase.auth().currentUser.delete().then(() => { 
                alert("사이트에서 당신의 정보를 삭제했습니다.\n(다음에 뵙기를 믿습니다.)");
                location.reload();
            });
        }
    }
}
