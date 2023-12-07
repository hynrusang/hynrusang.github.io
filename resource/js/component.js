const R = {};
R.Modal = {
    Room: {
        Add: () => [
            $("input", {
                type: "button",
                style: "background-image: url(/resource/img/icon/plus.png)",
                value: "채팅방 새로 만들기",
                onclick: () => makeModal("정말로 새로운 채팅방을 만드시겠습니까?", R.Modal.Room.Make())
            }),
            $("input", {
                type: "button",
                style: "background-image: url(/resource/img/icon/data.png)",
                value: "기존 채팅방 들어가기",
                onclick: () => makeModal("들어가고 싶은 채팅방의 아이디를 입력해주세요.", R.Modal.Room.Enter())
            })
        ],
        Make: () => [
            $("input", {
                type: "button",
                style: "background-image: url(/resource/img/icon/accept.png)",
                value: "예",
                onclick: () => {
                    firebase.firestore().collection("chat").add({
                        owner: firebase.auth().currentUser.uid
                    })
                    .then(doc => {
                        doc.collection("enroll").doc(firebase.auth().currentUser.uid).set({
                            accept: true,
                            name: firebase.auth().currentUser.email
                        })
                        const temp = DB.value("chatroom");
                        temp[doc.id] = doc.id;
                        DB.value("chatroom", temp);
                        notifyDataChange();
                    })
                    scan("modal").removeAttribute("open");
                }
            }),
            $("input", {
                type: "button",
                style: "background-image: url(/resource/img/icon/del.png)",
                value: "아니오",
                onclick: () => scan("modal").removeAttribute("open")
            })
        ],
        Enter: () => {
            const field = $("input", {
                type: "text",
                style: "background-image: url(/resource/img/icon/password.png)",
                placeholder: "roomid"
            })

            return [
                field,
                $("input", {
                    type: "button",
                    style: "background-image: url(/resource/img/icon/accept.png)",
                    value: "확인",
                    onclick: () => {
                        if (field.node.value) {
                            firebase.firestore().collection("chat").doc(field.node.value).get().then(data => {
                                if (data.data()) {
                                    const temp = DB.value("chatroom");
                                    temp[field.node.value] = field.node.value;
                                    DB.value("chatroom", temp);
                                    notifyDataChange();
                                    scan("modal").removeAttribute("open");
                                } else makeModal("해당 채팅방은 존재하지 않습니다.")
                            })
                        }
                    }
                })
            ]
        }
    }
}
R.Shared = {
    Frame: {
        /**
         *  @type {(props: {type: string, comp: Dom, fedit: Function?, fdelete: Function?}) => Dom}
         */
        Item: ({type, comp, fedit, fdelete}) => $("div", {
            class: `itemBox ${type ?? ""}`,
        }).add(
            comp,
            R.Shared.Handler({
                fedit: fedit,
                fdelete: fdelete
            })
        ),

        /**
         * @type {(props: {showSubmitIcon: boolean?, comp: Dom | Dom[], fsubmit: Function}) => Dom[]}
         */
        Form: ({showSubmitIcon = true, comp, fsubmit}) => [
            $("fieldset", {
                style: "height: calc(100vh - 160px); background: rgba(0,0,0,0.1); overflow-y: scroll"
            }),
            $("form", {
                style: "",
                class: "inputBox",
                onsubmit: fsubmit
            }).add(
                comp,
                $("div", {
                    style: !showSubmitIcon ? `display: none` : null,
                    class: "handler"
                }).add(
                    $("input", {
                        style: "background-image: url(resource/img/icon/plus.png)",
                        type: "submit",
                        value: ""
                    })
                )
            )
        ]
    },

    /**
     * @type {(props: {fadd: Function?, fedit: Function?, fdelete: Function?}) => Dom}
     */
    Handler: ({fadd, fedit, fdelete}) => $("div", {
        class: "handler"
    }).add(
        fadd ? $("input", {
            type: "button",
            style: "background-image: url(/resource/img/icon/plus.png)",
            onclick: fadd
        }) : null,
        fedit ? $("input", {
            type: "button",
            style: "background-image: url(resource/img/icon/edit.png)",
            onclick: fedit
        }) : null,
        fdelete ? $("input", {
            type: "button",
            style: "background-image: url(resource/img/icon/del.png)",
            onclick: fdelete
        }) : null
    ),
    
    /**
     * @type {(props: {name: string?, exp: string?}) => Dom}
     */
    UserProfile: ({name, exp}) => $("div", {
        class: "userProfile"
    }).add(
        $("img"),
        $("span", {
            text: name,
            exp: exp
        })
    )
};
R.Chat = {
    /**
     * @type {(dataset: string[]) => Dom[]}
     */
    User: dataset => dataset.map((data, index) => {
        let field = $("span", {
            class: "detail",
            text: data,
        });
        const comp = $("div").add(field);

        return R.Shared.Frame.Item({
            type: "owner",
            comp: comp,
            fedit: () => {
                if (field.node.nodeName == "SPAN") {
                    field = $("textarea", {
                        style: `height: ${field.node.offsetHeight}px`,
                        class: "detail",
                        spellcheck: "false",
                        rows: "1",
                        onfocus: e => e.target.value = data,
                        oninput: e => {
                            e.target.style.height = "auto";
                            e.target.style.height = e.target.scrollHeight + "px";
                        }
                    })
                } else {
                    dataset[index] = field.node.value;
                    field = $("span", {
                        class: "detail",
                        text: dataset[index],
                    })
                    DB.value("chat", dataset);
                    notifyDataChange();
                    makeToast("해당 채팅의 내용이 변경되었습니다.");
                }
                comp.reset(field);
                field.node.focus();
            },
            fdelete: () => {
                if (confirm("정말로 채팅을 삭제하시겠습니까?")) {
                    dataset.splice(index, 1);
                    DB.value("chat", dataset);
                    notifyDataChange();
                }
            }
        })
    }),

    /**
     * @type {(isGlobal: boolean) => Dom[]}
     */
    Form: isGlobal => {
        const comp = $("textarea", {
            class: "detail",
            required: "",
            spellcheck: "false",
            style: "height: 74px",
            placeholder: "|"
        });
        return R.Shared.Frame.Form({
            comp: comp,
            fsubmit: async e => {
                e.preventDefault();
                const dataset = isGlobal ? getChatDoc("chat") : DB.value("chat");
                if (isGlobal) dataset.set({
                    author: firebase.auth().currentUser.uid,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    text: comp.node.value
                })
                else {
                    dataset.unshift(comp.node.value);
                    DB.value("chat", dataset);
                    await notifyDataChange();
                }
                comp.node.value = "";
            }
        })
    }
}
R.Link = {
    /**
     * @type {(dataset: object[]) => Dom[]}
     */    
    User: dataset => Object.keys(dataset).sort().map((data, index) => {
        let field = $("a", {
            class: "detail",
            href: dataset[data],
            text: data,
            target: "_blank"
        });
        const comp = $("div").add(field);

        return R.Shared.Frame.Item({
            type: "owner",
            comp: comp,
            fedit: () => {
                if (field.node.nodeName == "A") {
                    field = $("input", {
                        style: `background-image: url(/resource/img/icon/edit.png); margin: 0px; height: 25px;`,
                        spellcheck: "false",
                        onfocus: e => e.target.value = data,
                        onkeyup: e => (e.code == "Enter") ? scan(`#l${index} .handler input`).click() : null
                    })
                } else if (field.node.value) {
                    dataset[field.node.value] = dataset[data];
                    if (field.node.value != data) delete dataset[data];
                    field = $("a", {
                        class: "detail",
                        href: dataset[field.node.value],
                        text: field.node.value,
                        target: "_blank"
                    })
                    DB.value("link", dataset);
                    notifyDataChange();
                    makeToast("해당 링크의 설명이 변경되었습니다.");
                }
                comp.reset(field);
                field.node.focus();
            },
            fdelete: () => {
                if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) {
                    delete dataset[data];
                    DB.value("link", dataset);
                    notifyDataChange();
                }
            }
        })
    }),

    /**
     * @type {(isGlobal: boolean) => Dom[]}
     */
    Form: isGlobal => {
        const comp = [
            $("input", {
                autocomplete: "off",
                required: "",
                style: "margin: 0px;",
                placeholder: "링크의 주소 (https://...)"
            }),
            $("input", {
                autocomplete: "off",
                style: "margin: 0px;",
                placeholder: "링크의 설명"
            })
        ];
        return R.Shared.Frame.Form({
            showSubmitIcon: false,
            comp: comp,
            fsubmit: async e => {
                e.preventDefault();
                const dataset = isGlobal ? getChatDoc("link") : DB.value("link");
                const exp = comp[1].node.value ? comp[1].node.value : comp[0].node.value;
                if (isGlobal) dataset.set({
                    author: firebase.auth().currentUser.uid,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    link: comp[0].node.value,
                    exp: exp
                })
                else {
                    dataset[exp] = comp[0].node.value;
                    DB.value("link", dataset);
                    await notifyDataChange();  
                }
                comp.forEach(item => item.node.value = "");
            }
        })
    }
}
R.Youtube = {
    /**
     * @type {(dataset: object) => Dom[]}
     */
    Container: dataset => Object.keys(dataset).sort().map(data => $("fieldset", {
        style: "position: relative;"
    }).add(
        $("legend", {
            text: data
        }),
        $("div", {
            style: "margin-bottom: 40px"
        }).add(R.Youtube.Items(dataset, data)),
        R.Shared.Handler({
            fadd: () => {
                const url = prompt("추가하길 원하는 재생목록(또는 동영상)의 링크를 입력해주세요.");
                if (url && !Object.values(dataset[data]).includes(url)) {
                    dataset[data][url] = url;
                    DB.value("playlist", dataset);
                    notifyDataChange();
                }
            },
            fdelete: () => {
                if (confirm("정말 해당 재생목록 바구니를 삭제하시겠습니까?")) {
                    delete dataset[data];
                    DB.value("playlist", dataset);
                    notifyDataChange();
                }
            }
        })
    )),
    
    /**
     * @type {(dataset: object, key: string) => Dom[]}
     */
    Items: (dataset, key) => Object.keys(dataset[key]).sort().map((data, index) => {
        let field = $("a", {
            class: "detail",
            href: dataset[key][data],
            text: data,
            onclick: e => {
                e.preventDefault();
                const href = "https://www.youtube.com/embed/" + (e.target.href.includes("list=") ? `videoseries/?list=${dataset[key][data].match(/[?&]list=([^&]+)/)[1]}&amp;loop=1&autoplay=1` : dataset[key][data].match(/[?&]v=([^&]+)/)[1]);
                scan("main iframe").src = href;
                scan("main span").innerText = `${key}: ${data}`;
                scan("[rid=menu]").removeAttribute("open");
            }
        });
        const comp = $("div").add(field);
        return R.Shared.Frame.Item({
            comp: comp,
            fedit: () => {
                if (field.node.nodeName == "A") {
                    field = $("input", {
                        style: `background-image: url(/resource/img/icon/edit.png); margin: 0px; height: 25px;`,
                        spellcheck: "false",
                        onfocus: e => e.target.value = data,
                        onkeyup: e => (e.code == "Enter") ? scan(`#y${index} .handler input`).click() : null
                    })
                } else if (field.node.value) {
                    dataset[key][field.node.value] = dataset[key][data];
                    if (field.node.value != data) delete dataset[key][data];
                    field = $("a", {
                        class: "detail",
                        href: dataset[key][field.node.value],
                        text: field.node.value,
                        onclick: e => {
                            e.preventDefault();
                            const href = "https://www.youtube.com/embed/" + (e.target.href.includes("list=") ? `videoseries/?list=${dataset[key][data].match(/[?&]list=([^&]+)/)[1]}&amp;loop=1&autoplay=1` : dataset[key][data].match(/[?&]v=([^&]+)/)[1]);
                            scan("main iframe").src = href;
                            scan("main span").innerText = `${key}: ${data}`;
                            scan("[rid=menu]").removeAttribute("open");
                        }
                    })
                    DB.value("playlist", dataset);
                    notifyDataChange();
                    makeToast("해당 재생목록의 이름이 변경되었습니다.");
                }
                comp.reset(field);
                field.node.focus();
            },
            fdelete: () => {
                if (confirm("정말 해당 재생목록을 삭제하시겠습니까?\n(해당 결정은 되돌릴 수 없습니다.)")) {
                    delete dataset[key][data];
                    DB.value("playlist", dataset);
                    notifyDataChange();
                }
            }
        })
    })
}
/**
 * @type {(dataset: object) => Dom[]}
 */
R.Room = dataset => Object.keys(dataset).sort().map(data => {
    let field = $("input", {
        type: "button",
        style: "background-image: url(/resource/img/icon/server.png)",
        value: data,
        onfocus: e => e.target.value = data,
        onclick: () => {
            scan("[rid=menu]").removeAttribute("open");
            current.value("tab", "chatroom");
            current.value("chatroom", data);
        }
    });
    const comp = $("div").add(field);

    return R.Shared.Frame.Item({
        comp: comp,
        fedit: () => {
            if (field.node.type == "button") {
                field.node.type = "text";
                field.node.onclick = null;
            } else if (field.node.value) {
                dataset[field.node.value] = dataset[data];
                if (field.node.value != data) delete dataset[data];
                field.node.type = "button";
                field.node.onclick = e => {
                    scan("[rid=menu]").removeAttribute("open");
                    current.value("tab", "chatroom");
                    current.value("chatroom", data);
                }
                DB.value("chatroom", dataset);
                notifyDataChange();
                makeToast("해당 채팅방의 이름이 변경되었습니다.");
            }
            field.node.value = "";
            field.node.focus();
        },
        fdelete: () => {
            if (confirm("정말 해당 채팅방에서 나가시겠습니까?\n데이터는 자동으로 삭제되지 않으며,\n추후 다시 들어올 시 신청을 다시 해야합니다.")) {
                firebase.firestore().collection("chat").doc(dataset[data]).get().then(async data => {
                    const owner = data.data().owner;
                    if (owner == firebase.auth().currentUser.uid) alert("채팅방 관리자는 채팅방에서 나갈 수 없습니다.\n채팅방 메뉴에서 채팅방 삭제를 해야 합니다.");
                    else {
                        await data.ref.collection("enroll").doc(firebase.auth().currentUser.uid).delete();
                        delete dataset[data];
                        DB.value("chatroom", dataset);
                        notifyDataChange();
                        current.value("tab", "main");
                    }
                })
            }
        }
    })
})
R.Info = dataset => {
    let element = [
        R.Shared.UserProfile({
            name: firebase.auth().currentUser.uid
        }),
        $("input", {
            type: "button",
            style: "background-image: url(/resource/img/icon/password.png",
            value: "비밀번호 변경 이메일 보내기",
            onclick: () => {
                makeToast("이메일 주소로 비밀번호 초기화 메일을 보내기 시도하는 중입니다.");
                firebase.auth().sendPasswordResetEmail(firebase.auth().currentUser.email)
                .then(() => makeToast("이메일 주소로 초기화 메일을 보냈습니다."))
                .catch(e => {
                    if (e.code == "auth/invalid-email") makeToast("잘못된 이메일 주소입니다.");
                    else if (e.code == "auth/user-not-found") makeToast("해당 계정은 존재하지 않습니다.");
                })
            }
        }),
        $("input", {
            type: "button",
            style: "background-image: url(/resource/img/icon/setting.png",
            value: "로그아웃",
            onclick: () => firebase.auth().signOut().then(() => location.reload())
        }),
        $("input", {
            type: "button",
            style: "background-image: url(/resource/img/icon/del.png",
            value: "회원 탈퇴",
            onclick: () => async () => {
                if (confirm("정말로 이 계정을 삭제하시겠습니까?\n(이 결정은 번복되지 않습니다.)\n(추가로 다시 한 번 물어보는 절차도 없습니다.)")) {
                    makeToast("잠시만 기다려 주십시오. 정보가 곧 삭제됩니다.");
                    await firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).delete().then(() => makeToast("사용자의 데이터를 모두 삭제하는데 성공하였습니다."));
                    firebase.auth().currentUser.delete()
                    .then(() => {
                        alert("사이트에서 당신의 정보를 삭제했습니다.\n(다음에 뵙기를 믿습니다.)");
                        location.reload();
                    })
                    .catch(e => alert(e.code == "auth/requires-recent-login" ? "사용자의 계정을 삭제하는데 실패했습니다.\n사유: 계정 삭제 작업은 중요하므로 최근 인증이 필요합니다.\n재 로그인한 후, 다시 계정 삭제를 진행해주세요." : "알 수 없는 이유로 회원 탈퇴에 실패하였습니다. 다시 한 번 시도해주세요."));
                }
            }
        })
    ]
    if (SDB.value.key) element = element.concat([
        $("form", {
            onsubmit: async e => {
                e.preventDefault();
                dataset.key = e.target[0].value;
                DB.value("secret", dataset);
                await notifyDataChange();
                location.reload();
            }
        }).add(
            $("input", {
                type: "text",
                style: "background-image: url('/resource/img/icon/password.png')",
                placeholder: "특수문서 키"
            })
        )
    ])
    return element;
}