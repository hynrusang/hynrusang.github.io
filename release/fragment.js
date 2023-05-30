const __$$MAKEFRAME = (menu, section) => $("main").add(
    $("aside").add($("nav").add(menu)),
    $("article").add(section)
)
const __$$FRAGMENTS = [new Fragment("page", __$$MAKEFRAME([
    $("a", {href: "javascript:window.open('https://google.com/')"}).add(
        $("img", {src: "https://www.google.com/s2/favicons?domain=https://www.google.com/"}),
        $("span", {text: "구글"})
    ),
    $("a", {href: "javascript:window.open((window.innerWidth > 450) ? 'https://www.naver.com/' : 'https://m.naver.com')"}).add(
        $("img", {src: "https://www.google.com/s2/favicons?domain=https://www.naver.com/"}),
        $("span", {text: "네이버"})
    ),
    $("a", {href: "javascript:window.open('https://www.daum.net/')"}).add(
        $("img", {src: "https://www.google.com/s2/favicons?domain=https://m.daum.net/"}),
        $("span", {text: "다음"})
    ),
    $("a", {href: "javascript:window.open('https://duckduckgo.com/')"}).add(
        $("img", {src: "https://www.google.com/s2/favicons?domain=https://duckduckgo.com/"}),
        $("span", {text: "덕덕고"})
    ),
    $("a", {href: "javascript:window.open('https://chat.openai.com/chat')"}).add(
        $("img", {src: "https://www.google.com/s2/favicons?domain=https://chat.openai.com/"}),
        $("span", {text: "chatGPT"})
    ),
    $("a", {href: "javascript:window.open('https://papago.naver.com/')"}).add(
        $("img", {src: "https://www.google.com/s2/favicons?domain=https://papago.naver.com/"}),
        $("span", {text: "papago"})
    ),
    $("a", {href: "javascript:window.open('https://youtube.com/')"}).add(
        $("img", {src: "https://www.google.com/s2/favicons?domain=https://youtube.com/"}),
        $("span", {text: "유튜브"})
    ),
    $("a", {href: "javascript:window.open('https://twitch.tv/')"}).add(
        $("img", {src: "https://www.google.com/s2/favicons?domain=https://twitch.tv/"}),
        $("span", {text: "트위치"})
    )
], [
    $("fragment", {rid: "mainboard"})
])).registAction(function () {
    this.indexFragment = new Fragment("mainboard", $("section").add(
        $("div", { class: "login" }).add(
            __$$LIVEWIDGET[0]
        ),
        $("div", { class: "clock" }).add(
            $("div", { class: "hour_pin" }),
            $("div", { class: "minute_pin" }),
            $("div", { class: "second_pin" })
        ),
        $("p", { id: "time", style: "position: relative; top: 10px; text-align: center;" }),
        $("form", {onsubmit: e => e.preventDefault()}).add(
            $("input", {type: "button", style: "width:40%;background-image:url('/resource/img/icon/favorite.png');background-color:rgba(180, 180, 180, 0.3)", value: "링크", onclick: e => {
                const children = e.target.parentElement.children
                children[0].style.backgroundColor = "rgba(180, 180, 180, 0.3)";
                children[1].style.backgroundColor = null;
                __$$FRAGMENTS[0].linkFragment.launch();
            }}),
            $("input", {type: "button", style: "width:40%;background-image:url('/resource/img/icon/library.png');", value: "메모", onclick: e => {
                const children = e.target.parentElement.children
                children[1].style.backgroundColor = "rgba(180, 180, 180, 0.3)";
                children[0].style.backgroundColor = null;
                __$$FRAGMENTS[0].memoFragment.launch();
            }})
        ),
        $("fragment", {rid: "bookmarks"})
    )).launch();
    this.userInfoFragment = new Fragment("mainboard", $("fieldset", { id: "user_field" }).add(
        __$$LIVEWIDGET[1],
        $("input", { type: "button", style: "background-image: url('/resource/img/icon/save.png')", value: "이름 변경", onclick: () => {
            const temp = prompt("당신의 새로운 이름을 알려주세요.\n(아무 값도 입력하지 않으면 변경을 취소합니다.)");
            if (temp && temp != "") {
                R.value("uname", temp);
                firebaseUtil.sync();
            }
        }}),
        $("input", { type: "button", style: "background-image: url('/resource/img/icon/lock.png')", value: "비밀번호 변경 이메일 보내기", onclick:  async () => {
            await firebase.auth().sendPasswordResetEmail(firebase.auth().currentUser.email).then(() => alert("이메일 주소로 비밀번호 초기화 메일을 보냈습니다.")).catch(e => {
                if (e.code == "auth/invalid-email") alert("잘못된 이메일 주소입니다.");
                else if (e.code == "auth/user-not-found") alert("해당 계정은 존재하지 않습니다.");
            })
        }}),
        $("input", { type: "button", style: "background-image: url('/resource/img/icon/setting.png')", value: "로그아웃", onclick: async () => {
            await firebase.auth().signOut().then(() => location.reload())
        }}),
        $("input", { type: "button", style: "background-image: url('/resource/img/icon/del.png')", value: "회원 탈퇴", onclick: async () => {
            if (confirm("정말로 이 계정을 삭제하시겠습니까?\n(이 결정은 번복되지 않습니다.)\n(추가로 다시 한 번 물어보는 절차도 없습니다.)")) {
                await firebaseUtil.get("user").then(async data => { await data.ref.delete() });
                await firebase.auth().currentUser.delete().then(() => {
                    alert("사이트에서 당신의 정보를 삭제했습니다.\n(다음에 뵙기를 믿습니다.)");
                    location.reload();
                });
            }
        }}),
        $("hr"),
        $("input", {type: "button", value: "처음 화면으로 돌아가기", onclick: () => { __$$FRAGMENTS[0].indexFragment.launch(); }})
    ));
    this.loginFragment = new Fragment("mainboard", $("section").add(
        $("fieldset").add(
            $("legend").add(
                $("img", { src: "/resource/img/icon/library.png", alt: "로그인 창" }),
                $("span", { text: "로그인" })
            ),
            $("span", { text: "Enter 키를 누르면, 자동으로 다음 절차로 넘어갑니다." }),
            $("form", {id: "login", method: "post", onsubmit: async e => {
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
            }}).add(
                $("input", { type: "email", pattern: "[A-Za-z0-9]+@[A-Za-z0-9]+\.[A-Za-z]{2,}", style: "background-image: url('/resource/img/icon/program.png')", placeholder: "이메일 주소 (*@*.*)", oninput: e => {
                    const target = e.target;
                    const preValue = target.preValue ? target.preValue : "";
                    if (preValue.includes("@") && preValue.indexOf("@") == preValue.length - 1) {
                        e.target.value = e.target.value + ((e.data == "d") ? "aum.net"  
                                : (e.data == "n") ? "aver.com"
                                : (e.data == "g") ? "mail.com"
                                : (e.data == "h") ? "anmail.net"
                                : "");
                    }
                    target.preValue = target.value
                }, onkeypress: e => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        scan("!#login input")[1].focus();
                    }
                }}),
                $("input", { type: "password", style: "background-image: url('/resource/img/icon/lock.png')", placeholder: "비밀번호", autocomplete: "off" }),
                $("input", { type: "submit", value: "로그인" }),
                $("input", {type: "button", value: "비밀번호 초기화", onclick: async () => {
                    await firebase.auth().sendPasswordResetEmail(scan("!#login input")[0].value).then(() => alert("이메일 주소로 비밀번호 초기화 메일을 보냈습니다.")).catch(e => {
                        if (e.code == "auth/invalid-email") alert("잘못된 이메일 주소입니다.");
                        else if (e.code == "auth/user-not-found") alert("해당 계정은 존재하지 않습니다.");
                    })
                }}),
                $("input", { type: "button", value: "회원가입 화면으로 이동", onclick: () => { __$$FRAGMENTS[0].registFragment.launch(); } })
            ),
            $("span", { style: "display:inline-block;width:100%;text-align:center;", text: "인증되지 않은 계정으로 로그인 할 시, 인증 메일을 다시 보냅니다." }),
            $("hr"),
            $("input", {type: "button", value: "처음 화면으로 돌아가기", onclick: () => { __$$FRAGMENTS[0].indexFragment.launch(); }})
        ),
    )).registAction(() => scan("#login input").focus());
    this.registFragment = new Fragment("mainboard", $("section").add(
        $("fieldset").add(
            $("legend").add(
                $("img", { src: "/resource/img/icon/plus.png", alt: "회원가입 창" }),
                $("span", { text: "회원가입" })
            ),
            $("span", { text: "Enter 키를 누르면, 자동으로 다음 절차로 넘어갑니다." }),
            $("form", { id: "regist", method: "post", onsubmit: async e => {
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
            }).add(
                $("input", { type: "email", pattern: "[A-Za-z0-9]+@[A-Za-z0-9]+\.[A-Za-z]{2,}", style: "background-image: url('/resource/img/icon/program.png')", placeholder: "이메일 주소 (*@*.*) - 인증에 사용됩니다.", oninput: e => {
                        const target = e.target;
                        const preValue = target.preValue ? target.preValue : "";
                        if (preValue.includes("@") && preValue.indexOf("@") == preValue.length - 1) {
                            e.target.value = e.target.value + ((e.data == "d") ? "aum.net"  
                                : (e.data == "n") ? "aver.com"
                                : (e.data == "g") ? "mail.com"
                                : (e.data == "h") ? "anmail.net"
                                : "");
                        }
                        target.preValue = target.value
                }, onkeypress: e => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        scan("!#regist input")[1].focus();
                    }
                }}),
                $("input", { type: "password", style: "background-image: url('/resource/img/icon/lock.png')", placeholder: "비밀번호 - 6자 이상", autocomplete: "off", onkeypress: e => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        scan("!#regist input")[2].focus();
                    }
                }}),
                $("input", { type: "password", style: "background-image: url('/resource/img/icon/lock.png')", placeholder: "비밀번호 확인", autocomplete: "off" }),
                $("input", { type: "submit", value: "회원가입" }),
                $("input", { type: "button", value: "로그인 화면으로 이동", onclick: () => { __$$FRAGMENTS[0].loginFragment.launch(); } }),
                $("hr"),
            $("input", {type: "button", value: "처음 화면으로 돌아가기", onclick: () => { __$$FRAGMENTS[0].indexFragment.launch(); }})
            )
        ),
    )).registAction(() => scan("#regist input").focus())

    this.linkFragment = new Fragment("bookmarks", $("form", { onsubmit: e => {
        e.preventDefault();
        if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
        else {
            e.target[0].value = e.target[0].value.split(" ").pop();
            if (!e.target[0].value.includes("http")) e.target[0].value = `https://${e.target[0].value}`;
            if (!R.value("mlink").includes(e.target[0].value)) {
                R.value("mlink", R.value("mlink").add(e.target[0].value).sort())
                firebaseUtil.sync();
            } else alert("이미 저장된 링크입니다.");
            e.target[0].value = "";
        }
    }}).add(
        $("input", { type: "text", style: "background-image:url(/resource/img/icon/favorite.png)", placeholder:"링크" })
    ), __$$LIVEWIDGET[2]).launch();
    this.memoFragment = new Fragment("bookmarks", __$$LIVEWIDGET[3], $("form", {onsubmit: e => {
        e.preventDefault();
        if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
        else {
            const memolist = R.value("memo");
            if (!scan("#memo-value").value.isEmpty()) memolist[e.target[0].value] = scan("#memo-value").value
            else delete memolist[e.target[0].value];
            R.value("memo", memolist);
            firebaseUtil.sync();
        }
    }}).add(
        $("input", { type: "text", style: "background-image:url(/resource/img/icon/library.png)", placeholder: "메모", required: null, list: "memo_list", onchange: e => {
            scan("#memo-value").value = (R.value("memo")[e.target.value]) ? R.value("memo")[e.target.value] : "";
        }}),
        $("textarea", { id: "memo-value", spellcheck: "false", placeholder: "공백을 저장하면, 해당 메모가 삭제됩니다." }),
        $("input", { type: "button", style: "width:40%;background-image:url('/resource/img/icon/del.png');", value: "메모 클리어", onclick: e => {
            e.target.parentElement.children[0].value = "";
            scan("#memo-value").value = "";
        }}),
        $("input", { type: "submit", style: "width:40%;background-image:url('/resource/img/icon/save.png');", value: "저장" })
    ));

    if (navigator.userAgent.split(" ").pop().split("/")[0] == "Edg") {
        scan("!nav a img")[4].src = "https://www.google.com/s2/favicons?domain=https://www.bing.com/";
        scan("!nav a")[4].href = "https://www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx";
        scan("!nav a span")[4].innerText = "Bing Ai"
    }
}).launch(), null, new Fragment("page", $("main").add(
    $("aside"), $("article").add(
        $("section").add(
            $("fieldset").add(
                $("legend").add(
                    $("img", {src: "/resource/img/icon/lock.png"}),
                    $("span", {text: "특수문서 키 (관리자 전용)"})
                ),
                $("form", {onsubmit: e => {
                    e.preventDefault();
                    if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
                    else {
                        firebaseUtil.get("dat").then(async data => {
                            if (data) {
                                R.value("secret", {
                                    ...R.value("secret"),
                                    key: e.target[0].value
                                });
                                await firebaseUtil.sync().then(() => { location.reload(); })
                            } else alert("관리자 권한이 없는 사람은 특수문서에 링크하실 수 없습니다.");
                        })
                    }
                }}).add(
                    $("input", {type: "text", style: "background-image:url('/resource/img/icon/setting.png');"}),
                    $("input", {type: "submit", style: "background-image: url('/resource/img/icon/save.png');", value: "값 저장"})
                )
            )
        )
    )
)), new Fragment("page", $("main").add($("p", {style: "width: 100%; text-align: center;", text: "죄송하지만... 연결할 특수 문서가 없는 것 같네요..."})))];
