const menuFragment = {
    main: new Fragment("menu"),
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
                class: "inputWidget",
                style: "background-image: url(/resource/img/icon/plus.png); width: 100%; margin-top: 22px;",
                placeholder: "재생목록 바구니 이름",
            })
        ),
        $("div")
    ),
    secret: new Fragment("menu")
}
const subFragment = {
    main: {
        링크: new Fragment("main",
            $("fieldset", {
                style: "height: calc(100vh - 240px); background: rgba(0,0,0,0.1); overflow-y: scroll"
            }),
            $("form", {
                style: "height: 160px; border: 1px solid black;",
                onsubmit: async e => {
                    e.preventDefault();
                    const data = DB.value("link");
                    data.push({
                        data: [
                            scan("#add-link-href").value,
                            scan("#add-link-exp").value
                        ]
                    })
                    DB.value("link", data);
                    scan("#add-link-href").value = "";
                    scan("#add-link-exp").value = "";
                    await notifyDataChange();
                }
            }).add(
                $("input", {
                    id: "add-link-href",
                    autocomplete: "off",
                    required: "",
                    style: "width: 100%",
                    placeholder: "링크의 주소 (https://...)"
                }),
                $("hr"),
                $("input", {
                    id: "add-link-exp",
                    autocomplete: "off",
                    style: "width: 100%; height: 40px",
                    placeholder: "링크의 설명"
                }),
                $("input", {
                    style: "float: right; background-image: url(resource/img/icon/save.png)",
                    class: "chatButton",
                    type: "submit",
                    value: ""
                })
            )
        ),
        메모: new Fragment("main",
            $("fieldset", {
                style: "height: calc(100vh - 240px); background: rgba(0,0,0,0.1); overflow-y: scroll"
            }),
            $("form", {
                style: "height: 160px; border: 1px solid black;",
                onsubmit: async e => {
                    e.preventDefault();
                    const data = DB.value("memo");
                    data.push(scan("#add-memo").value);
                    DB.value("memo", data);
                    scan("#add-memo").value = "";
                    await notifyDataChange();
                }
            }).add(
                $("textarea", {
                    id: "add-memo",
                    required: "",
                    spellcheck: "false",
                    style: "width: 100%; height: 125px",
                    placeholder: "기억해야 할 것"
                }),
                $("input", {
                    style: "float: right; background-image: url(resource/img/icon/save.png)",
                    class: "chatButton",
                    type: "submit",
                    value: ""
                })
            )
        ),
        설정: new Fragment("main",
            $("fieldset", {
                style: "height: calc(100vh - 80px); background: rgba(0,0,0,0.1);"
            }).add(
            )
        )
    }
};
const mainFragment = {
    login: new Fragment("page",
        $("div", {
            style: "left: 0px; position: absolute; width: 100%; height: 100%;"
        }).add(
            $("h1", {
                class: "login_title",
                text: "Chatting Site"
            }),
            $("form", {
                onsubmit: async e => {
                    e.preventDefault();
                    await firebase.auth().signInWithEmailAndPassword(e.target[1].value, e.target[2].value).then(async data => {
                        if (!data.user.emailVerified) {
                            makeToast("이메일 인증이 되지 않은 계정은 사용하실 수 없습니다.\n(인증용 메일을 다시 보내드릴 테니, 해당 메일에서 이메일 인증을 해주세요.)");
                            await data.user.sendEmailVerification()
                                .then(() => makeToast("인증용 메일을 다시 보냈습니다."))
                                .catch(e => { if (e.code == "auth/too-many-requests") makeToast("현재 요청이 너무 많아 요청을 보류중입니다. 잠시 후 다시 시도해주세요."); });
                        }
                    }).catch(async err => {
                        if (err.code == "auth/user-not-found") {
                            makeToast("회원가입을 시도하는 중입니다.");
                            await firebase.auth().createUserWithEmailAndPassword(e.target[1].value, e.target[2].value).then(async data => {
                                makeToast("회원가입 인증을 위한 메일을 발송하는 중입니다.");
                                await data.user.sendEmailVerification().then(() => {
                                    alert("회원가입이 완료되었습니다.\n(회원가입 때 사용하셨던 이메일 주소에서, 이메일 인증을 해주세요.)");
                                    firebase.auth().signOut();
                                    location.reload();
                                });
                            }).catch(e => {
                                if (e.code == "auth/weak-password") makeToast("비밀번호는 최소 6자리 이상이여야만 합니다.");
                                else console.log(e);
                            })
                        }
                        else if (err.code == "auth/wrong-password") alert("비밀번호가 잘못되었습니다.");
                        else if (err.code == "auth/invalid-email") alert("잘못된 이메일 주소입니다.");
                        else if (err.code == "auth/internal-error") alert("이 사이트에서는 로그인 API를 호출하실 수 없습니다.");
                        else console.log(err);
                    });
                }
            }).add(
                $("fieldset", {
                    class: "login_field"
                }).add(
                    $("legend", {
                        class: "login_legend",
                        text: "login field"
                    }),
                    $("input", {
                        class: "login_input",
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
                                scan("!.login_input")[1].focus();
                            }
                        }
                    }),
                    $("input", {
                        class: "login_input",
                        style: "background-image: url(resource/img/icon/password.png)",
                        type: "password",
                        placeholder: "password"
                    }),
                    $("br"),
                    $("div", {
                        class: "login_button_box"
                    }).add(
                        $("input", {
                            class: "login_button",
                            type: "submit",
                            value: "login / regist"
                        }),
                        $("input", {
                            class: "login_button",
                            type: "button",
                            value: "password reset",
                            onclick: async () => {
                                makeToast("이메일 주소로 비밀번호 초기화 메일을 보내기 시도하는 중입니다.");
                                await firebase.auth().sendPasswordResetEmail(scan("form").children[0].children[1].value)
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
        )
    ).registAction(() => {
        scan(".login_input").focus();
    }).launch(),
    main: new Fragment("page",
        $("fragment", {
            rid: "main"
        }).add(
            subFragment.main.링크.fragment,
        ),
        $("div", {
            id: "current-main",
            style: "display: flex; width: 100%; height: 40px"
        }).add(
            $("input", {
                style: "width: 30%; height: 100%; background-image: url(resource/img/icon/link.png)",
                class: "current",
                type: "button",
                value: "링크",
                onclick: e => current.value("main", e.target.value)
            }),
            $("input", {
                style: "width: 30%; height: 100%; background-image: url(resource/img/icon/memo.png)",
                type: "button",
                value: "메모",
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
    secret: new Fragment("page")
};