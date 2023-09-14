const menuFragment = {
    main: new Fragment("menu", 
        $("a", {
            style: "display: flex; width: 100%; height: 30px; margin: 10px;",
            href: "https://google.com/",
            onclick: e => {
                e.preventDefault();
                window.open((e.target.nodeName == "A") ? e.target.href : e.target.parentElement.href, "_blank");
                if (setting.value.auto.closeOnClick) scan("details").removeAttribute("open"); 
            }
        }).add(
            $("img", {
                style: "height: 22px; top:4px; position: relative;",
                src: "https://www.google.com/s2/favicons?domain=https://www.google.com/"
            }),
            $("span", {
                style: "padding-top: 4px;",
                text: "구글"
            })
        ),
        $("a", {
            style: "display: flex; width: 100%; height: 30px; margin: 10px;",
            href: (window.innerWidth > 450) ? "https://www.naver.com/" : "https://m.naver.com", 
            onclick: e => {
                e.preventDefault();
                window.open((e.target.nodeName == "A") ? e.target.href : e.target.parentElement.href, "_blank");
                if (setting.value.auto.closeOnClick) scan("details").removeAttribute("open"); 
            }
        }).add(
            $("img", {
                style: "height: 22px; top:4px; position: relative;",
                src: "https://www.google.com/s2/favicons?domain=https://www.naver.com/"
            }),
            $("span", {
                style: "padding-top: 4px;",
                text: "네이버"
            })
        ),
        $("a", {
            style: "display: flex; width: 100%; height: 30px; margin: 10px;",
            href: "https://www.daum.net/", 
            onclick: e => {
                e.preventDefault();
                window.open((e.target.nodeName == "A") ? e.target.href : e.target.parentElement.href, "_blank");
                if (setting.value.auto.closeOnClick) scan("details").removeAttribute("open"); 
            }
        }).add(
            $("img", {
                style: "height: 22px; top:4px; position: relative;",
                src: "https://www.google.com/s2/favicons?domain=https://m.daum.net/"
            }),
            $("span", {
                style: "padding-top: 4px;",
                text: "다음"
            })
        ),
        $("a", {
            style: "display: flex; width: 100%; height: 30px; margin: 10px;",
            href: "https://duckduckgo.com/", 
            onclick: e => {
                e.preventDefault();
                window.open((e.target.nodeName == "A") ? e.target.href : e.target.parentElement.href, "_blank");
                if (setting.value.auto.closeOnClick) scan("details").removeAttribute("open"); 
            }
        }).add(
            $("img", {
                style: "height: 22px; top:4px; position: relative;",
                src: "https://www.google.com/s2/favicons?domain=https://duckduckgo.com/"
            }),
            $("span", {
                style: "padding-top: 4px;",
                text: "덕덕고"
            })
        ),
        $("a", {
            style: "display: flex; width: 100%; height: 30px; margin: 10px;",
            href: "https://chat.openai.com/chat", 
            onclick: e => {
                e.preventDefault();
                window.open((e.target.nodeName == "A") ? e.target.href : e.target.parentElement.href, "_blank");
                if (setting.value.auto.closeOnClick) scan("details").removeAttribute("open"); 
            }
        }).add(
            $("img", {
                style: "height: 22px; top:4px; position: relative;",
                src: "https://www.google.com/s2/favicons?domain=https://chat.openai.com/"
            }),
            $("span", {
                style: "padding-top: 4px;",
                text: "chatGPT"
            })
        ),
        $("a", {
            style: "display: flex; width: 100%; height: 30px; margin: 10px;",
            href: "https://papago.naver.com/", 
            onclick: e => {
                e.preventDefault();
                window.open((e.target.nodeName == "A") ? e.target.href : e.target.parentElement.href, "_blank");
                if (setting.value.auto.closeOnClick) scan("details").removeAttribute("open"); 
            }
        }).add(
            $("img", {
                style: "height: 22px; top:4px; position: relative;",
                src: "https://www.google.com/s2/favicons?domain=https://papago.naver.com/"
            }),
            $("span", {
                style: "padding-top: 4px;",
                text: "papago"
            })
        ),
        $("a", {
            style: "display: flex; width: 100%; height: 30px; margin: 10px;",
            href: "https://youtube.com/", 
            onclick: e => {
                e.preventDefault();
                window.open((e.target.nodeName == "A") ? e.target.href : e.target.parentElement.href, "_blank");
                if (setting.value.auto.closeOnClick) scan("details").removeAttribute("open"); 
            }
        }).add(
            $("img", {
                style: "height: 22px; top:4px; position: relative;",
                src: "https://www.google.com/s2/favicons?domain=https://youtube.com/"
            }),
            $("span", {
                style: "padding-top: 4px;",
                text: "유튜브"
            })
        ),
        $("a", {
            style: "display: flex; width: 100%; height: 30px; margin: 10px;",
            href: "https://twitch.tv/",
            onclick: e => {
                e.preventDefault();
                window.open((e.target.nodeName == "A") ? e.target.href : e.target.parentElement.href, "_blank");
                if (setting.value.auto.closeOnClick) scan("details").removeAttribute("open"); 
            }
        }).add(
            $("img", {
                style: "height: 22px; top:4px; position: relative;",
                src: "https://www.google.com/s2/favicons?domain=https://twitch.tv/"
            }),
            $("span", {
                style: "padding-top: 4px;",
                text: "트위치"
            })
        )
    ).launch(),
    video: new Fragment("menu",
        $("form", {
            onsubmit: e => {
                e.preventDefault();
                if (Object.keys(DB.value("playlist")).includes(e.target[0].value)) makeToast("해당 이름은 이미 존재합니다.")
                else {
                    const newPlaylist = DB.value("playlist");
                    newPlaylist[e.target[0].value] = {};
                    e.target[0].value = "";
                    DB.value("playlist", newPlaylist);
                    notifyDataChange();
                }
            }
        }).add(
            $("input", {
                type: "text",
                class: "inputWidget",
                style: "background-image: url(/resource/img/icon/plus.png); width: 100%; margin-top: 22px;",
                placeholder: "재생목록 바구니 이름",
            }),
            $("input", {
                style: "width: 100%; text-align: left; background-image: url(/resource/img/icon/program.png)",
                type: "button",
                class: "inputWidget",
                value: "랜덤 추천",
                onclick: () => {
                    if (Object.keys(DB.value("playlist")).isEmpty()) {
                        makeToast("재생목록 바구니가 하나도 존재하지 않습니다.");
                    } else {
                        const keyData = {
                            list: Object.keys(DB.value("playlist")),
                            num: Math.floor(Math.random() * Object.keys(DB.value("playlist")).length)
                        }
                        const valueData = {
                            keys: Object.keys(DB.value("playlist")[keyData.list[keyData.num]]),
                            values: Object.values(DB.value("playlist")[keyData.list[keyData.num]]).map(obj => {
                                return obj.includes("list=") ? `${obj.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1` : obj.replace("m.", "www.").replace("watch?v=", "embed/").split("&")[0];
                            }),
                            num: Math.floor(Math.random() * Object.keys(DB.value("playlist")[keyData.list[keyData.num]]).length)
                        }
                        currentVideo.value = [keyData.list[keyData.num], valueData.keys[valueData.num], valueData.values[valueData.num]];
                    }
                }
            })
        ),
        $("div", {
            id: "playlistbox"
        })
    ),
    setting: new Fragment("menu"),
    secret: new Fragment("menu")
}
const subFragment = {
    main: {
        link: new Fragment("main",
            $("fieldset").add(
                $("legend", {
                    text: "즐겨찾기"
                }),
                $("span", {
                    html: "여기에 즐겨찾기 할 링크를 저장해보세요.<br>(우측 상단의 위젯을 눌러 로그인 한 후 이용 가능합니다.)<br>(로그인 하셨으면, 우측 위젯은 정보창으로 변경됩니다.)"
                }),
                $("form", {
                    style: "display: flex",
                    onsubmit: e => {
                        e.preventDefault();
                        e.target[0].value = e.target[0].value.trim();
                        if (!e.target[0].value.includes("http")) e.target[0].value = `https://${e.target[0].value}`;
                        if (DB.value("main").link.includes(e.target[0].value)) makeToast("이미 저장된 링크입니다.");
                        else {
                            const temp = DB.value("main");
                            temp.link = temp.link.add(e.target[0].value).sort();
                            DB.value("main", temp);
                            notifyDataChange();
                        }
                        e.target[0].value = "";
                    }
                }).add(
                    $("input", {
                        type: "text",
                        class: "inputWidget",
                        style: "background-image: url(/resource/img/icon/save.png); width: 100%;",
                        placeholder: "즐겨찾기에 등록할 링크"
                    }),
                    $("input", {
                        type: "button",
                        class: "inputWidget",
                        style: "background-image: url(/resource/img/icon/library.png);",
                        value: "메모로 전환",
                        onclick: () => currentFragment.value("sub", "memo")
                    })
                ),
                $("ul")
            )
        ).registAnimation(FragAnimation.fade, 0.2).registAction(() => currentFragment.value("sub", "link")),
        memo: new Fragment("main",
            $("datalist", {
                id: "memo"
            }),
            $("fieldset").add(
                $("legend", {
                    text: "메모"
                }),
                $("span", {
                    html: "여기에 기억해야 할 정보를 남겨보세요.<br>(메모 제목을 먼저 적으신 후, 메모를 작성해주세요.)<br>(중간에 메모 제목을 지우면, 현재까지 작업한 내용이 사라집니다.)"
                }),
                $("form", {
                    onsubmit: async e => {
                        e.preventDefault();
                        const temp = DB.value("main");
                        if (![e.target[0].value.trim(), e.target[2].value.trim()].includes("")) {
                            temp.memo[e.target[0].value] = e.target[2].value;
                            DB.value("main", temp);
                            await notifyDataChange();
                            makeToast("저장되었습니다.");
                        }
                    }
                }).add(
                    $("div", {
                        style: "display: flex"
                    }).add(
                        $("input", {
                            type: "text",
                            class: "inputWidget",
                            style: "background-image: url(/resource/img/icon/save.png); width: 100%;",
                            placeholder: "메모 제목",
                            list: "memo",
                            oninput: e => scan("textarea").value = DB.value('main').memo[e.target.value] ?? ''
                        }),
                        $("input", {
                            type: "button",
                            class: "inputWidget",
                            style: "background-image: url(/resource/img/icon/library.png);",
                            value: "즐겨찾기로 전환",
                            onclick: () => currentFragment.value("sub", "link")
                        })
                    ),
                    $("textarea", { 
                        spellcheck: "false",
                    }),
                    $("input", {
                        type: "button",
                        class: "inputWidget",
                        style: "background-image: url(/resource/img/icon/del.png)",
                        value: "메모 삭제",
                        onclick: () => {
                            if (confirm("정말로 해당 메모를 삭제하시겠습니까?\n해당 시도는 되돌릴 수 없습니다.")) {
                                const temp = DB.value("main");
                                delete temp.memo[scan("[list=memo]").value];
                                scan("[list=memo]").value = scan("textarea").value = "";
                                DB.value("main", temp);
                                notifyDataChange();
                            }
                        }
                    }),
                    $("input", {
                        type: "submit",
                        class: "inputWidget",
                        style: "background-image: url(/resource/img/icon/save.png)",
                        value: "메모 저장"
                    })
                ),
            )
        ).registAnimation(FragAnimation.fade, 0.2).registAction(() => currentFragment.value("sub", "memo")),
        login: new Fragment("main",
            $("fieldset", {
                style: "position: absolute;"
            }).add(
                $("legend", {
                    text: "로그인"
                }),
                $("span", {
                    html: "하나의 정보를 입력한 후<br>엔터를 입력하면<br>자동으로 다음 절차로 넘어갑니다.<br>(이메일 인증 확인 절차가 있습니다.)"
                }),
                $("form", {
                    id: "loginField",
                    method: "post",
                    onsubmit: async e => {
                        e.preventDefault();
                        await firebase.auth().signInWithEmailAndPassword(scan("!#loginField input")[0].value, scan("!#loginField input")[1].value).then(async data => {
                            if (!data.user.emailVerified) {
                                firebase.auth().signOut();
                                makeToast("이메일 인증이 되지 않은 계정은 사용하실 수 없습니다.\n(인증용 메일을 다시 보내드릴 테니, 해당 메일에서 이메일 인증을 해주세요.)");
                                await wait(1000);
                                await data.user.sendEmailVerification()
                                    .then(() => makeToast("인증용 메일을 다시 보냈습니다."))
                                    .catch(e => { if (e.code == "auth/too-many-requests") makeToast("현재 요청이 너무 많아 요청을 보류중입니다. 잠시 후 다시 시도해주세요."); });
                            } else location.reload();
                        }).catch(e => {
                            if (e.code == "auth/wrong-password") makeToast("비밀번호가 잘못되었습니다.");
                            else if (e.code == "auth/invalid-email") makeToast("잘못된 이메일 주소입니다.");
                            else if (e.code == "auth/user-not-found") makeToast("해당 계정은 존재하지 않습니다.");
                            else if (e.code == "auth/internal-error") makeToast("이 사이트에서는 로그인 API를 호출하실 수 없습니다.");
                            else console.log(e);
                        });
                    }
                }).add(
                    $("input", {
                        style: "width: 100%; background-image: url(/resource/img/icon/program.png);",
                        class: "inputWidget",
                        type: "text",
                        placeholder: "email@*.*",
                        pattern: "[A-Za-z0-9]+@[A-Za-z0-9]+\.[A-Za-z]{2,}",
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
                                scan("!#loginField input")[1].focus();
                            }
                        }
                    }),
                    $("input", {
                        style: "width: 100%; background-image: url(/resource/img/icon/lock.png);",
                        class: "inputWidget",
                        type: "password",
                        placeholder: "abc-1234",
                        autocomplete: "off"
                    }),
                    $("input", { 
                        type: "button",
                        class: "inputWidget",
                        style: "display: block; background-image: url('/resource/img/icon/help.png')", 
                        value: "비밀번호 변경 이메일 보내기", 
                        onclick: async () => {
                            makeToast("이메일 주소로 비밀번호 초기화 메일을 보내기 시도하는 중입니다.");
                            await firebase.auth().sendPasswordResetEmail(scan("#loginField [type=text]").value)
                                .then(() => makeToast("이메일 주소로 초기화 메일을 보냈습니다."))
                                .catch(e => {
                                    if (e.code == "auth/invalid-email") makeToast("잘못된 이메일 주소입니다.");
                                    else if (e.code == "auth/user-not-found") makeToast("해당 계정은 존재하지 않습니다.");
                            })
                        }
                    }),
                    $("input", {
                        style: "background-image: url(/resource/img/icon/library.png);",
                        class: "inputWidget",
                        type: "button",
                        value: "회원가입 화면으로",
                        onclick: () => currentFragment.value("sub", "regist")
                    }),
                    $("input", {
                        style: "position: absolute; right: 10px;",
                        type: "submit"
                    }),
                    $("hr"),
                    $("input", {
                        style: "background-image: url(favicon.ico); background-size: 22px;",
                        class: "inputWidget",
                        type: "button",
                        value: "메인 화면으로 돌아가기",
                        onclick: () => currentFragment.value("sub", "link")
                    }),
                )
            )
        ).registAnimation(FragAnimation.fade, 0.2).registAction(() => {
            scan("#loginField input").focus();
            currentFragment.value("sub", "login");
        }),
        regist: new Fragment("main",
            $("fieldset", {
                style: "position: absolute;"
            }).add(
                $("legend", {
                    text: "회원가입"
                }),
                $("span", {
                    html: "하나의 정보를 입력한 후<br>엔터를 입력하면<br>자동으로 다음 절차로 넘어갑니다.<br>(이메일 인증 절차가 있습니다.)"
                }),
                $("form", { 
                    id: "registField", 
                    method: "post", 
                    onsubmit: async e => {
                        e.preventDefault();
                        if (scan("!#registField input")[1].value != scan("!#registField input")[2].value) makeToast("비밀번호가 일치하지 않습니다");
                        else {
                            makeToast("회원가입을 시도하는 중입니다.");
                            await firebase.auth().createUserWithEmailAndPassword(scan("!#registField input")[0].value, scan("!#registField input")[1].value).then(async data => {
                                makeToast("회원가입 인증을 위한 메일을 발송하는 중입니다.");
                                await data.user.sendEmailVerification().then(() => {
                                    alert("회원가입이 완료되었습니다.\n(회원가입 때 사용하셨던 이메일 주소에서, 이메일 인증을 해주세요.)");
                                    firebase.auth().signOut();
                                    location.reload();
                                });
                            }).catch(e => {
                                if (e.code == "auth/weak-password") makeToast("비밀번호는 최소 6자리 이상이여야만 합니다.");
                                else if (e.code == "auth/email-already-in-use") makeToast("이미 가입된 이메일입니다.\n만약, 비밀번호가 생각이 안나거나 본인이 가입한 것이 아닌 경우, 비밀번호 찾기를 해주세요.");
                                else if (e.code == "auth/internal-error") makeToast("이 사이트에서는 로그인 API를 호출하실 수 없습니다.");
                                else console.log(e);
                            })
                        }
                    }
                }).add(
                    $("input", {
                        style: "width: 100%; background-image: url(/resource/img/icon/program.png);",
                        class: "inputWidget",
                        type: "text",
                        placeholder: "email@*.*",
                        pattern: "[A-Za-z0-9]+@[A-Za-z0-9]+\.[A-Za-z]{2,}",
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
                                scan("!#registField input")[1].focus();
                            }
                        }
                    }),
                    $("input", {
                        style: "width: 100%; background-image: url(/resource/img/icon/lock.png);",
                        class: "inputWidget",
                        type: "password",
                        placeholder: "abc-1234",
                        autocomplete: "off",
                        onkeypress: e => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                scan("!#registField input")[2].focus();
                            }
                        }
                    }),
                    $("input", {
                        style: "width: 100%; background-image: url(/resource/img/icon/lock.png);",
                        class: "inputWidget",
                        type: "password",
                        placeholder: "abc-1234(확인)",
                        autocomplete: "off"
                    }),
                    $("input", {
                        style: "background-image: url(/resource/img/icon/lock.png);",
                        class: "inputWidget",
                        type: "button",
                        value: "로그인 화면으로",
                        onclick: () => currentFragment.value("sub", "login")
                    }),
                    $("input", {
                        style: "position: absolute; right: 10px;",
                        type: "submit"
                    }),
                    $("hr"),
                    $("input", {
                        style: "background-image: url(favicon.ico); background-size: 22px;",
                        class: "inputWidget",
                        type: "button",
                        value: "메인 화면으로 돌아가기",
                        onclick: () => currentFragment.value("sub", "link")
                    }),
                )
            )
        ).registAnimation(FragAnimation.fade, 0.2).registAction(() => {
            scan("#registField input").focus();
            currentFragment.value("sub", "regist");
        }),
        info: new Fragment("main",
            $("fieldset").add(
                $("legend", {
                    text: "로그인 정보 관리"
                }),
                $("input", { 
                    type: "button",
                    class: "inputWidget",
                    style: "display: block; background-image: url('/resource/img/icon/lock.png')", 
                    value: "비밀번호 변경 이메일 보내기", 
                    onclick: async () => {
                        makeToast("이메일 주소로 비밀번호 초기화 메일을 보내기 시도하는 중입니다.");
                        await firebase.auth().sendPasswordResetEmail(firebase.auth().currentUser.email)
                            .then(() => makeToast("이메일 주소로 초기화 메일을 보냈습니다."))
                            .catch(e => {
                                if (e.code == "auth/invalid-email") makeToast("잘못된 이메일 주소입니다.");
                                else if (e.code == "auth/user-not-found") makeToast("해당 계정은 존재하지 않습니다.");
                        })
                    }
                }),
                $("input", { 
                    type: "button",
                    class: "inputWidget",
                    style: "display: block; background-image: url('/resource/img/icon/setting.png')", 
                    value: "로그아웃", 
                    onclick: async () => {
                        await firebase.auth().signOut().then(() => {
                            localStorage.clear();
                            location.reload()
                        })
                    }
                }),
                $("input", { 
                    type: "button",
                    class: "inputWidget",
                    style: "display: block; background-image: url('/resource/img/icon/del.png')", 
                    value: "회원 탈퇴", 
                    onclick: async () => {
                        if (confirm("정말로 이 계정을 삭제하시겠습니까?\n(이 결정은 번복되지 않습니다.)\n(추가로 다시 한 번 물어보는 절차도 없습니다.)")) {
                            makeToast("잠시만 기다려 주십시오. 정보가 곧 삭제됩니다.");
                            await firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).delete().then(() => makeToast("사용자의 데이터를 모두 삭제하는데 성공하였습니다."));
                            await firebase.auth().currentUser.delete().then(() => {
                                localStorage.clear();
                                alert("사이트에서 당신의 정보를 삭제했습니다.\n(다음에 뵙기를 믿습니다.)");
                                location.reload();
                            }).catch(e => {
                                if (e.code == "auth/requires-recent-login") alert("사용자의 계정을 삭제하는데 실패했습니다.\n사유: 계정 삭제 작업은 중요하므로 최근 인증이 필요합니다.\n재 로그인한 후, 다시 계정 삭제를 진행해주세요.");
                                else alert("알 수 없는 이유로 회원 탈퇴에 실패하였습니다. 다시 한 번 시도해주세요.");
                            });
                        }
                    }
                }),
                $("hr"),
                $("input", {
                    style: "background-image: url(favicon.ico); background-size: 22px;",
                    class: "inputWidget",
                    type: "button",
                    value: "메인 화면으로 돌아가기",
                    onclick: () => currentFragment.value("sub", "link")
                }),
            )
        ).registAnimation(FragAnimation.fade, 0.2).registAction(() => currentFragment.value("sub", "info")),
    }
};
const mainFragment = {
    main: new Fragment("page",
        $("input", {
            type: "button",
            class: "inputWidget",
            style: "background-image: url(/resource/img/icon/setting.png); position: absolute; right: 0px; margin: 10px;",
            exp: "loginWidget -> {loginWidget}",
            onclick: () => firebase.auth().currentUser ? currentFragment.value("sub", "info") : currentFragment.value("sub", "login")
        }),
        $("div", { class: "clock" }).add(
            $("div", { class: "hour_pin" }),
            $("div", { class: "minute_pin" }),
            $("div", { class: "second_pin" })
        ),
        $("p", {
            style: "position: relative; top: 10px; text-align: center;",
            id: "time"
        }), 
        $("fragment", {
            rid: "main"
        }).add(
            subFragment.main.link.fragment
        )
    ).launch(),
    setting: new Fragment("page",
        $("div")
    ),
    secret: new Fragment("page", 
        $("span", {
            style: "color: red; width: 100%; text-align: center; display: inline-block; font-size: larger;",
            text: "권한이 부족하거나, 키가 잘못되었습니다."
        })
    )
};