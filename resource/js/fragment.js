const menuFragment = {
    main: new Fragment("menu",
        $("div", {
            class: "itemBox",
        }).add(
            $("input", {
                type: "button",
                style: "background-image: url(/resource/img/icon/data.png)",
                value: "마이 페이지",
                onclick: () => {
                    scan("[rid=menu]").removeAttribute("open");
                    current.value("tab", "main");
                }
            })
        ),
        $("div"),
        R.Shared.Handler({
            fadd: () => makeModal("어떤 동작을 수행하시겠습니까?", R.Modal.Room.Add())
        })
    ),
    video: new Fragment("menu",
        $("form", {
            onsubmit: async e => {
                e.preventDefault();
                const data = DB.value("playlist");
                if (Object.keys(data).includes(e.target[0].value)) makeToast("해당 이름은 이미 존재합니다.")
                else if (e.target[0].value) {
                    data[e.target[0].value] = {};
                    DB.value("playlist", data);
                    e.target[0].value = "";
                    notifyDataChange(data);
                }
            }
        }).add(
            $("input", {
                type: "text",
                style: "background-image: url(/resource/img/icon/plus.png); margin-top: 22px;",
                placeholder: "재생목록 바구니 이름",
            })
        ),
        $("div")
    ),
    secret: new Fragment("menu")
}
const subFragment = {
    main: {
        채팅: new Fragment("main", ...R.Chat.Form(false)),
        링크: new Fragment("main", ...R.Link.Form(false)),
        설정: new Fragment("main",
            $("fieldset", {
                style: "height: calc(100vh - 80px); background: rgba(0,0,0,0.1);"
            })
        )
    },
    chatroom: {
        채팅: new Fragment("main", ...R.Chat.Form(true)),
        링크: new Fragment("main", ...R.Link.Form(true)),
        설정: new Fragment("main",
            $("fieldset", {
                style: "height: calc(100vh - 80px); background: rgba(0,0,0,0.1);"
            })
        )
    }
};
const mainFragment = {
    login: new Fragment("page",
        $("div", {
            class: "loginField"
        }).add(
            $("h1", {
                text: "Micron"
            }),
            $("form", {
                onsubmit: async e => {
                    e.preventDefault();
                    await firebase.auth().signInWithEmailAndPassword(e.target[0].value, e.target[1].value).then(async data => {
                        if (!data.user.emailVerified) {
                            makeToast("이메일 인증이 되지 않은 계정은 사용하실 수 없습니다.\n(인증용 메일을 다시 보내드릴 테니, 해당 메일에서 이메일 인증을 해주세요.)");
                            await data.user.sendEmailVerification()
                                .then(() => makeToast("인증용 메일을 다시 보냈습니다."))
                                .catch(e => { if (e.code == "auth/too-many-requests") makeToast("현재 요청이 너무 많아 요청을 보류중입니다. 잠시 후 다시 시도해주세요."); });
                        }
                    }).catch(async err => {
                        if (err.code == "auth/user-not-found") {
                            if (confirm("해당 계정은 존재하지 않습니다.\n해당 계정으로 새롭게 회원가입을 시도할까요?")) {
                                makeToast("회원가입을 시도하는 중입니다.");
                                await firebase.auth().createUserWithEmailAndPassword(e.target[0].value, e.target[1].value).then(async data => {
                                    makeToast("회원가입 인증을 위한 메일을 발송하는 중입니다.");
                                    await data.user.sendEmailVerification().then(() => makeToast("회원가입이 완료되었습니다.\n(회원가입 때 사용하셨던 이메일 주소에서, 이메일 인증을 해주세요.)"));
                                }).catch(e => {
                                    if (e.code == "auth/weak-password") makeToast("비밀번호는 최소 6자리 이상이여야만 합니다.");
                                    else console.log(e);
                                })
                            }
                        }
                        else if (err.code == "auth/wrong-password") alert("비밀번호가 잘못되었습니다.");
                        else if (err.code == "auth/invalid-email") alert("잘못된 이메일 주소입니다.");
                        else if (err.code == "auth/internal-error") alert("이 사이트에서는 로그인 API를 호출하실 수 없습니다.");
                        else console.log(err);
                    });
                }
            }).add(
                $("input", {
                    style: "background-image: url(resource/img/icon/email.png)",
                    type: "text",
                    placeholder: "email",
                    oninput: e => {
                        const preValue = e.target.preValue ??  "";
                        if (preValue.includes("@") && preValue.indexOf("@") == preValue.length - 1) {
                            switch (e.data) {
                                case "g":
                                    e.target.value += "mail.com";
                                    break;
                                case "n":
                                    e.target.value += "aver.com";
                                    break;
                                case "d":
                                    e.target.value += "aum.net";
                                    break;
                            }
                        }
                        e.target.preValue = e.target.value
                    }, 
                    onkeypress: e => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            scan("!.loginField input")[1].focus();
                        }
                    }
                }),
                $("input", {
                    style: "background-image: url(resource/img/icon/password.png)",
                    type: "password",
                    placeholder: "password"
                }),
                $("br"),
                $("div").add(
                    $("input", {
                        type: "submit",
                        value: "login / regist"
                    }),
                    $("input", {
                        type: "button",
                        value: "password reset",
                        onclick: async () => {
                            makeToast("이메일 주소로 비밀번호 초기화 메일을 보내기 시도하는 중입니다.");
                            await firebase.auth().sendPasswordResetEmail(scan("form").children[0].value)
                                .then(() => makeToast("이메일 주소로 초기화 메일을 보냈습니다."))
                                .catch(e => {
                                    if (e.code == "auth/invalid-email") makeToast("잘못된 이메일 주소입니다.");
                                    else if (e.code == "auth/user-not-found") makeToast("해당 계정은 존재하지 않습니다.");
                            })
                        }
                    })
                )
            )
        )
    ).registAction(() => {
        scan(".loginField input").focus();
    }).launch(),
    main: new Fragment("page",
        $("fragment", {
            rid: "main"
        }).add(
            subFragment.main.채팅.fragment,
        ),
        $("div", {
            id: "current-main",
            style: "display: flex; width: 100%; height: 40px"
        }).add(
            $("input", {
                style: "width: 30%; height: 100%; background-image: url(resource/img/icon/chat.png)",
                class: "current",
                type: "button",
                value: "채팅",
                onclick: e => current.value("main", e.target.value)
            }),
            $("input", {
                style: "width: 30%; height: 100%; background-image: url(resource/img/icon/link.png)",
                type: "button",
                value: "링크",
                onclick: e => current.value("main", e.target.value)
            }),
            $("input", {
                style: "width: 30%; height: 100%; background-image: url(resource/img/icon/setting.png)",
                type: "button",
                value: "설정",
                onclick: e => current.value("main", e.target.value)
            })
        )
    ),
    chatroom: new Fragment("page",
        $("fragment", {
            rid: "main"
        }).add(
            subFragment.chatroom.채팅.fragment,
        ),
        $("div", {
            id: "current-main",
            style: "display: flex; width: 100%; height: 40px"
        }).add(
            $("input", {
                style: "width: 30%; height: 100%; background-image: url(resource/img/icon/chat.png)",
                class: "current",
                type: "button",
                value: "채팅",
                onclick: e => current.value("chat", e.target.value)
            }),
            $("input", {
                style: "width: 30%; height: 100%; background-image: url(resource/img/icon/link.png)",
                type: "button",
                value: "링크",
                onclick: e => current.value("chat", e.target.value)
            }),
            $("input", {
                style: "width: 30%; height: 100%; background-image: url(resource/img/icon/setting.png)",
                type: "button",
                value: "설정",
                onclick: e => current.value("chat", e.target.value)
            })
        )
    ),
    secret: new Fragment("page")
};
