let targetUID = "";
const chatDB = new LiveData({
    name: "",
    chat: [],
    link: [],
    memo: []
}, {
    type: Object
});
const DB = new LiveDataManager({
    link: new LiveData([], {
        type: Array
    }),
    memo: new LiveData([], {
        type: Array
    }),
    playlist: new LiveData({}, {
        type: Object,
    }),
    setting : new LiveData({
        theme: "right"
    }, {
        type: Object,
    }),
    secret: new LiveData({
        key: ""
    }, {
        type: Object
    }),
    chatroom: new LiveData([], {
        type: Array
    })
}, false);
const SDB = new LiveData({}, {
    type: Object
})
const current = new LiveDataManager({
    main: new LiveData("링크", {
        type: String,
        observer: function () {
            scan("#current-main .current").classList.remove("current");
            scan(`#current-main [value=${this.value}]`).classList.add("current")
            subFragment.main[this.value].launch();
        }
    }),
    chat: new LiveData("채팅", {
        type: String,
        observer: function () {
            scan("#current-main .current").classList.remove("current");
            scan(`#current-main [value=${this.value}]`).classList.add("current")
            subFragment.chatroom[this.value].launch();
        }
    }),
    chatroom: new LiveData("", {
        type: String,
        observer: function () {
            if (this.unsubscribe) this.unsubscribe();
            if (this.value) {
                this.unsubscribe = firebase.firestore().collection("chat").doc(this.value).collection("enroll").onSnapshot(snapshot => {
                    const template = {
                        chat: [],
                        link: [],
                        memo: []
                    };
                    const scrollInfo = {
                        chat: subFragment.chatroom.채팅.fragment[0].node.scrollTop,
                        link: subFragment.chatroom.링크.fragment[0].node.scrollTop,
                        memo: subFragment.chatroom.메모.fragment[0].node.scrollTop,
                    }
                    const target = {
                        chat: subFragment.chatroom.채팅.fragment[0].reset(),
                        link: subFragment.chatroom.링크.fragment[0].reset(),
                        memo: subFragment.chatroom.메모.fragment[0].reset(),
                    }
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        if (doc.id == firebase.auth().currentUser.uid) {
                            chatDB.value = {
                                name: data.name,
                                chat: JSON.parse(JSON.stringify(data.chat)),
                                link: JSON.parse(JSON.stringify(data.link)),
                                memo: JSON.parse(JSON.stringify(data.memo))
                            }
                        }
                        ["chat", "link", "memo"].forEach(key => {
                            data[key].forEach(token => token.data.push(data.name));
                            template[key] = template[key].concat(data[key]).sort((a, b) => b.data[0] - a.data[0])
                        })
                    });
                    template.chat.forEach((chat, index) => {
                        if (chat.data[2] == chatDB.value.name) {
                            target.chat.add(
                                $("div", {
                                    class: "itemBox",
                                    idx: `a${index}`
                                }).add(
                                    $("span", {
                                        text: chat.data[2]
                                    }),
                                    $("hr"),
                                    $("input", {
                                        style: "height: 30px;",
                                        class: "detail",
                                        value: chat.data[1],
                                    }),
                                    $("div", {
                                        class: "handler"
                                    }).add(
                                        $("input", {
                                            type: "button",
                                            style: "background-image: url(resource/img/icon/edit.png)",
                                            onclick: async () => {
                                                const temp = chatDB.value;
                                                for (let data of temp.chat) {
                                                    if (data.data[0] == chat.data[0]) {
                                                        data.data[1] =scan(`[idx=a${index}] textarea`).value;
                                                        break;
                                                    }
                                                }
                                                chatDB.value = temp;
                                                await notifyChatChange();
                                                makeToast("해당 채팅의 내용이 변경되였습니다.");
                                            }
                                        }),
                                        $("input", {
                                            type: "button",
                                            style: "background-image: url(resource/img/icon/del.png)",
                                            onclick: async e => {
                                                if (confirm("정말로 해당 채팅을 삭제하시겠습니까?")) {
                                                    let temp = chatDB.value;
                                                    temp.chat = temp.chat.filter(data => data.data[0] !== chat.data[0])
                                                    chatDB.value = temp;
                                                    notifyChatChange();
                                                }
                                            }
                                        })
                                    )
                                )
                            )
                        } else {
                            target.chat.add(
                                $("div", {
                                    class: "itemBox",
                                }).add(
                                    $("span", {
                                        text: chat.data[2]
                                    }),
                                    $("hr"),
                                    $("span", {
                                        style: "height: 30px;",
                                        class: "detail",
                                        innerText: chat.data[1],
                                    })
                                )
                            )
                        }
                    })
                    template.link.forEach((link, index) => {
                        if (link.data[3] == chatDB.value.name) {
                            target.link.add(
                                $("div", {
                                    class: "itemBox",
                                    idx: `a${index}`
                                }).add(
                                    $("span", {
                                        text: link.data[3]
                                    }),
                                    $("hr"),
                                    $("a", {
                                        href: link.data[1],
                                        text: link.data[1],
                                        target: "_blank"
                                    }),
                                    $("hr"),
                                    $("input", {
                                        style: "height: 30px",
                                        class: "detail",
                                        value: link.data[2]
                                    }),
                                    $("div", {
                                        class: "handler"
                                    }).add(
                                        $("input", {
                                            type: "button",
                                            style: "background-image: url(resource/img/icon/edit.png)",
                                            onclick: async () => {
                                                const temp = chatDB.value;
                                                for (let data of temp.link) {
                                                    if (data.data[0] == link.data[0]) {
                                                        data.data[2] = scan(`[idx=a${index}] input`).value;
                                                        break;
                                                    }
                                                }
                                                chatDB.value = temp;
                                                await notifyChatChange();
                                                makeToast("해당 링크의 설명이 변경되였습니다.");
                                            }
                                        }),
                                        $("input", {
                                            type: "button",
                                            style: "background-image: url(resource/img/icon/del.png)",
                                            onclick: async e => {
                                                if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) {
                                                    let temp = chatDB.value;
                                                    temp.link = temp.link.filter(data => data.data[0] !== link.data[0])
                                                    chatDB.value = temp;
                                                    notifyChatChange();
                                                }
                                            }
                                        })
                                    )
                                )
                            )
                        } else {
                            target.link.add(
                                $("div", {
                                    class: "itemBox",
                                    idx: `a${index}`
                                }).add(
                                    $("span", {
                                        text: link.data[3]
                                    }),
                                    $("hr"),
                                    $("a", {
                                        href: link.data[1],
                                        text: link.data[1],
                                        target: "_blank"
                                    }),
                                    $("hr"),
                                    $("span", {
                                        style: "height: 30px;",
                                        class: "detail",
                                        text: link.data[2]
                                    })
                                )
                            )
                        }
                    })
                    template.memo.forEach((memo, index) => {
                        if (memo.data[2] == chatDB.value.name) {
                            target.memo.add(
                                $("div", {
                                    class: "itemBox",
                                    idx: `a${index}`
                                }).add(
                                    $("span", {
                                        text: memo.data[2]
                                    }),
                                    $("hr"),
                                    $("textarea", {
                                        style: "height: 100px",
                                        class: "detail",
                                        spellcheck: "false",
                                        value: memo.data[1]
                                    }),
                                    $("div", {
                                        class: "handler"
                                    }).add(
                                        $("input", {
                                            type: "button",
                                            class: "chatButton",
                                            style: "background-image: url(resource/img/icon/edit.png)",
                                            onclick: async () => {
                                            }
                                        }),
                                        $("input", {
                                            type: "button",
                                            class: "chatButton",
                                            style: "background-image: url(resource/img/icon/del.png)",
                                            onclick: async () => {
                                            }
                                        })
                                    )
                                )
                            )
                        } else {
                            target.memo.add(
                                $("div", {
                                    class: "itemBox",
                                    idx: `a${index}`
                                }).add(
                                    $("span", {
                                        text: memo.data[2]
                                    }),
                                    $("hr"),
                                    $("textarea", {
                                        style: "height: 100px",
                                        class: "detail",
                                        spellcheck: "false",
                                        value: memo.data[1]
                                    })
                                )
                            )
                        }
                    })
                    Object.keys(target).forEach(key => target[key].node.scrollTop = scrollInfo[key]);
                }, err => {
                    if (confirm("해당 채팅방은 관리자의 승인이 필요합니다.\n지금 해당 채팅방에 승인 요청을 보내시겠습니까?")) {
                        firebase.firestore().collection("chat").doc(this.value).collection("enroll").doc(firebase.auth().currentUser.uid).set({
                            name: firebase.auth().currentUser.email,
                            chat: [],
                            link: [],
                            memo: []
                        }).catch(e => alert("이미 해당 채팅방에 승인 요청을 보냈습니다.\n또는, 해당 채팅방은 존재하지 않습니다."))
                    }
                    current.value("tab", "main");
                })
            }
        }
    }),
    tab: new LiveData("main", {
        type: String,
        observer: function () {
            if (this.value == "chatroom") {
                mainFragment[this.value].launch();
            } else {
                scan("footer .current").classList.remove("current");
                scan(`footer [target=${this.value}]`).classList.add("current");
                if (this.value == "video") {
                    scan("main[player]").style.display = "block";
                    scan("fragment[rid=page]").style.display = "none";
                } else {
                    scan("main[player]").style = scan("fragment[rid=page]").style = null;
                    mainFragment[this.value].launch();
                }
                menuFragment[this.value].launch();
                current.value("chatroom", "")
            }
        }
    })
})