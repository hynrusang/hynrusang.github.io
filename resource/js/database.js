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
    chat: new LiveData([], {
        type: Array
    }),
    link: new LiveData([], {
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
    main: new LiveData("채팅", {
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
        observer: async function () {
            if (this.unsubscribe) {
                for (unsubscribeListener of this.unsubscribe) unsubscribeListener();
            };
            if (this.value) {
                let owner = firebase.firestore().collection("chat").doc(this.value);
                await owner.get().then(data => owner = data.data().owner)
                this.unsubscribe = [
                    firebase.firestore().collection("chat").doc(this.value).collection("enroll").onSnapshot(snapshot => {
                        const target = subFragment.chatroom.설정.fragment[0].reset();
                        const userBox = [
                            $("div").add(
                                $("span", {
                                    text: "유저 목록"
                                })
                            ),
                            $("div").add(
                                $("span", {
                                    text: "수락 대기 목록"
                                })
                            )
                        ];
                        if (owner == firebase.auth().currentUser.uid) {
                            target.add(
                                $("span", {
                                    html: `채팅방 아이디: <span style="color: red; font-weight: bold;">${this.value}</span>`
                                }),
                                $("input", {
                                    style: "background-image: url(/resource/img/icon/del.png)",
                                    class: "inputWidget",
                                    type: "button",
                                    value: "채팅방 삭제하기",
                                    onclick: async () => {
                                        if (confirm("정말로 이 채팅방을 삭제하시겠습니까?\n(이 결정은 번복되지 않습니다.)\n(추가로 다시 한 번 물어보는 절차도 없습니다.)")) {
                                            const roomRef = await firebase.firestore().collection("chat").doc(this.value);
                                            const roomId = roomRef.id;
                                            roomRef.collection("enroll").get().then(docs => docs.forEach(doc => doc.ref.delete()));
                                            roomRef.collection("chat").get().then(docs => docs.forEach(doc => doc.ref.delete()));
                                            await roomRef.collection("link").get().then(docs => docs.forEach(doc => doc.ref.delete()));
                                            roomRef.delete();
                                            DB.value("chatroom", DB.value("chatroom").filter(room => room.data[0] != roomId));
                                            current.value("tab", "main");
                                            notifyDataChange();
                                        }
                                    }
                                }),
                                $("hr"),
                                userBox[0],
                                $("hr"),
                                userBox[1]
                            )
                        } else {
                            target.add(
                                $("span", {
                                    html: `채팅방 아이디: <span style="color: red; font-weight: bold;">${this.value}</span>`
                                }),
                                $("hr"),
                                userBox[0]
                            )
                        }
                        snapshot.forEach(username => {
                            const data = username.data();
                            Binder.define(username.id, data.name)
                            if (owner == firebase.auth().currentUser.uid && owner != username.id) {
                                if (data.accept) {
                                    userBox[0].add(
                                        $("div", {
                                            style: "position: relative;"
                                        }).add(
                                            $("div", {
                                                style: "width: calc(100% - 50px)",
                                                class: "userProfile"
                                            }).add(
                                                $("img"),
                                                $("span", {
                                                    text: data.name
                                                })
                                            ),
                                            $("div", {
                                                class: "handler"
                                            }).add(
                                                $("input", {
                                                    type: "button",
                                                    style: "background-image: url(resource/img/icon/del.png)",
                                                    onclick: () => {
                                                        if (confirm("정말로 해당 유저를 강퇴하시겠습니까?")) {
                                                            pushChatData("chat", {
                                                                text: `${data.name}님을 채팅방에서 퇴장시켰습니다.`
                                                            })
                                                            const parentRef = username.ref.parent.parent;
                                                            parentRef.collection("chat").where("author", "==", username.id).get().then(data => data.forEach(doc => doc.ref.delete()))
                                                            parentRef.collection("link").where("author", "==", username.id).get().then(data => data.forEach(doc => doc.ref.delete()))
                                                            username.ref.delete();
                                                        }
                                                    }
                                                })
                                            )
                                        )
                                    )
                                } else {
                                    userBox[1].add(
                                        $("div", {
                                            style: "position: relative;"
                                        }).add(
                                            $("div", {
                                                style: "width: calc(100% - 100px)",
                                                class: "userProfile"
                                            }).add(
                                                $("img"),
                                                $("span", {
                                                    text: data.name
                                                })
                                            ),
                                            $("div", {
                                                class: "handler"
                                            }).add(
                                                $("input", {
                                                    type: "button",
                                                    style: "background-image: url(resource/img/icon/plus.png)",
                                                    onclick: async e => {
                                                        if (confirm("정말로 해당 신청을 승낙하시겠습니까?")) {
                                                            pushChatData("chat", {
                                                                text: `${data.name}님이 채팅방에 입장했습니다.`
                                                            })
                                                            username.ref.set({
                                                                accept: true,
                                                                name: data.name
                                                            })
                                                        }
                                                    }
                                                }),
                                                $("input", {
                                                    type: "button",
                                                    style: "background-image: url(resource/img/icon/del.png)",
                                                    onclick: () => {
                                                        if (confirm("정말로 해당 신청을 거절하시겠습니까?")) username.ref.delete();
                                                    }
                                                })
                                            )
                                        )
                                    )
                                }
                            } else if (data.accept) {
                                userBox[0].add(
                                    $("div", {
                                        class: "userProfile"
                                    }).add(
                                        $("img"),
                                        $("span", {
                                            text: data.name
                                        })
                                    )
                                )
                            }
                        })
                    }, () => {
                        if (confirm("해당 채팅방은 관리자의 승인이 필요합니다.\n지금 해당 채팅방에 승인 요청을 보내시겠습니까?")) {
                            firebase.firestore().collection("chat").doc(this.value).collection("enroll").doc(firebase.auth().currentUser.uid).set({
                                name: firebase.auth().currentUser.email,
                                accept: false
                            }).catch(() => alert("이미 해당 채팅방에 승인 요청을 보냈습니다."))
                        }
                        current.value("tab", "main");
                    }),
                    firebase.firestore().collection("chat").doc(this.value).collection("chat").orderBy("timestamp", "desc").onSnapshot(snapshot => {
                        const scrollInfo = subFragment.chatroom.채팅.fragment[0].node.scrollTop;
                        const target = subFragment.chatroom.채팅.fragment[0].reset();
                        snapshot.forEach((chatdata) => {
                            const data = chatdata.data();
                            if (data.author == firebase.auth().currentUser.uid) {
                                target.add(
                                    $("div", {
                                        class: "itemBox chatOwner",
                                        id: `c${chatdata.id}`
                                    }).add(
                                        $("div").add(
                                            $("span", {
                                                class: "detail",
                                                text: data.text,
                                            })
                                        ),
                                        $("div", {
                                            class: "handler"
                                        }).add(
                                            $("input", {
                                                type: "button",
                                                style: "background-image: url(resource/img/icon/edit.png)",
                                                onclick: async () => {
                                                    let editor = snipe(`#c${chatdata.id} div *`);
                                                    if (editor.node.nodeName == "SPAN") {
                                                        editor = $("textarea", {
                                                            style: `height: ${editor.node.offsetHeight}px`,
                                                            class: "detail",
                                                            spellcheck: "false",
                                                            rows: "1",
                                                            onfocus: e => e.target.value = data.text,
                                                            oninput: e => {
                                                                e.target.style.height = "auto";
                                                                e.target.style.height = e.target.scrollHeight + "px";
                                                            }
                                                        })
                                                    } else {
                                                        const text = editor.node.value;
                                                        editor = $("span", {
                                                            class: "detail",
                                                            text: data.text,
                                                        })
                                                        data.text = text;
                                                        chatdata.ref.set(data);
                                                        makeToast("해당 채팅의 내용이 변경되었습니다.");
                                                    }
                                                    snipe(`#c${chatdata.id} div`).reset(editor);
                                                    editor.node.focus();
                                                }
                                            }),
                                            $("input", {
                                                type: "button",
                                                style: "background-image: url(resource/img/icon/del.png)",
                                                onclick: async e => {
                                                    if (confirm("정말로 해당 채팅을 삭제하시겠습니까?")) chatdata.ref.delete();
                                                }
                                            })
                                        )
                                    )
                                )
                            } else if (owner == firebase.auth().currentUser.uid) {
                                target.add(
                                    $("div", {
                                        class: "itemBox chatItem",
                                    }).add(
                                        $("div", {
                                            class: "userProfile"
                                        }).add(
                                            $("img"),
                                            $("span", {
                                                exp: `${data.author}->{${data.author}}`
                                            })
                                        ),
                                        $("span", {
                                            class: "detail",
                                            innerText: data.text,
                                        }),
                                        $("div", {
                                            class: "handler"
                                        }).add(
                                            $("input", {
                                                type: "button",
                                                style: "background-image: url(resource/img/icon/del.png)",
                                                onclick: async e => {
                                                    if (confirm("정말로 해당 채팅을 삭제하시겠습니까?")) chatdata.ref.delete();
                                                }
                                            })
                                        )
                                    )
                                )
                            } else {
                                target.add(
                                    $("div", {
                                        class: "itemBox chatItem",
                                    }).add(
                                        $("div", {
                                            class: "userProfile"
                                        }).add(
                                            $("img"),
                                            $("span", {
                                                exp: `${data.author}->{${data.author}}`
                                            })
                                        ),
                                        $("span", {
                                            class: "detail",
                                            innerText: data.text,
                                        })
                                    )
                                )
                            }
                        })
                        target.node.scrollTop = scrollInfo;
                    }, () => null),
                    firebase.firestore().collection("chat").doc(this.value).collection("link").orderBy("timestamp", "desc").onSnapshot(snapshot => {
                        const scrollInfo = subFragment.chatroom.링크.fragment[0].node.scrollTop;
                        const target = subFragment.chatroom.링크.fragment[0].reset();
                        snapshot.forEach((chatdata) => {
                            const data = chatdata.data();
                            if (data.author == firebase.auth().currentUser.uid) {
                                target.add(
                                    $("div", {
                                        class: "itemBox chatOwner",
                                        id: `l${chatdata.id}`
                                    }).add(
                                        $("div").add(
                                            $("a", {
                                                class: "detail",
                                                href: data.link,
                                                text: data.exp,
                                                target: "_blank"
                                            })
                                        ),
                                        $("div", {
                                            class: "handler"
                                        }).add(
                                            $("input", {
                                                type: "button",
                                                style: "background-image: url(resource/img/icon/edit.png)",
                                                onclick: async () => {
                                                    let editor = snipe(`#l${chatdata.id} div *`);
                                                    if (editor.node.nodeName == "A") {
                                                        editor = $("input", {
                                                            class: "detail",
                                                            spellcheck: "false",
                                                            onfocus: e => e.target.value = data.exp,
                                                            onkeyup: e => {
                                                                if (e.code == "Enter") scan(`#l${chatdata.id} .handler input`).click();
                                                            }
                                                        })
                                                    } else {
                                                        const text = editor.node.value
                                                        editor = $("a", {
                                                            class: "detail",
                                                            href: data.link,
                                                            text: text,
                                                            target: "_blank"
                                                        })
                                                        data.exp = text;
                                                        chatdata.ref.set(data);
                                                        makeToast("해당 링크의 설명이 변경되었습니다.");
                                                    }
                                                    snipe(`#l${chatdata.id} div`).reset(editor);
                                                    editor.node.focus();
                                                }
                                            }),
                                            $("input", {
                                                type: "button",
                                                style: "background-image: url(resource/img/icon/del.png)",
                                                onclick: async e => {
                                                    if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) chatdata.ref.delete();
                                                }
                                            })
                                        )
                                    )
                                )
                            } else if (owner == firebase.auth().currentUser.uid) {
                                target.add(
                                    $("div", {
                                        class: "itemBox chatItem",
                                        iden: chatdata.id
                                    }).add(
                                        $("div", {
                                            class: "userProfile"
                                        }).add(
                                            $("img"),
                                            $("span", {
                                                exp: `${data.author}->{${data.author}}`
                                            })
                                        ),
                                        $("a", {
                                            href: data.link,
                                            text: data.exp,
                                            target: "_blank"
                                        }),
                                        $("div", {
                                            class: "handler"
                                        }).add(
                                            $("input", {
                                                type: "button",
                                                style: "background-image: url(resource/img/icon/del.png)",
                                                onclick: async e => {
                                                    if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) chatdata.ref.delete();
                                                }
                                            })
                                        )
                                    )
                                )
                            } else {
                                target.add(
                                    $("div", {
                                        class: "itemBox chatItem",
                                        iden: chatdata.id
                                    }).add(
                                        $("div", {
                                            class: "userProfile"
                                        }).add(
                                            $("img"),
                                            $("span", {
                                                exp: `${data.author}->{${data.author}}`
                                            })
                                        ),
                                        $("a", {
                                            href: data.link,
                                            text: data.exp,
                                            target: "_blank"
                                        })
                                    )
                                )
                            }
                        })
                        target.node.scrollTop = scrollInfo;
                    }, () => null)
                ]
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
