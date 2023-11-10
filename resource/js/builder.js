firebase.initializeApp({
    apiKey: "AIzaSyAglJGn84cPu_YvRUdigYQFCBml-s6kcuo",
    authDomain: "necronomicon-7ba57.firebaseapp.com",
    projectId: "necronomicon-7ba57",
    storageBucket: "necronomicon-7ba57.appspot.com",
    messagingSenderId: "582853710136",
    appId: "1:582853710136:web:c237b2926e7736c707f1cd",
    measurementId: "G-QL8R6QQHGF"
});
const notifyDataChange = async () => firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).set(DB.toObject());
const pushChatData = async (target, data) => firebase.firestore().collection("chat").doc(current.value("chatroom")).collection(target).doc().set({
    author: firebase.auth().currentUser.uid,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    ...data
});
const makeToast = message => {
    scan("#toast").innerText = message;
    scan("#toast").animate([{
        backgroundColor: "blue",
        zIndex: 3,
        opacity: 0
    }, {
        backgroundColor: "red",
        opacity: 1
    }, {
        zIndex: 3,
        backgroundColor: "blue",
        opacity: 0
    }], 1000)
};
scan(".menuicon").onclick = () => {
    if (!scan("[rid=menu]").attributes.open) scan("[rid=menu]").setAttribute("open", null);
    else scan("[rid=menu]").removeAttribute("open");
}
if (localStorage.getItem("timestamp") && (new Date().getTime() - new Date(localStorage.getItem("timestamp")).getTime()) >= 259200000) {
    localStorage.clear();
    firebase.auth().signOut();
}
firebase.auth().onAuthStateChanged(async user => {
    if (user) {
        if (user.emailVerified) {
            firebase.firestore().collection("user").doc(user.uid).onSnapshot(snapshot => {
                const template = snapshot.data() ? snapshot.data() : DB.toObject();
                const scrollInfo = {
                    chat: subFragment.main.채팅.fragment[0].node.scrollTop,
                    link: subFragment.main.링크.fragment[0].node.scrollTop,
                    info: subFragment.main.설정.fragment[0].node.scrollTop,
                    video: menuFragment.video.fragment[1].node.scrollTop,
                    chatroom: menuFragment.main.fragment[1].node.scrollTop
                }
                const target = {
                    chat: subFragment.main.채팅.fragment[0].reset(),
                    link: subFragment.main.링크.fragment[0].reset(),
                    info: subFragment.main.설정.fragment[0].reset(),
                    video: menuFragment.video.fragment[1].reset(),
                    chatroom: menuFragment.main.fragment[1].reset()
                }
                template.chat.forEach((chat, index) => {
                    target.chat.add(
                        $("div", {
                            class: "itemBox",
                            id: `c${index}`
                        }).add(
                            $("div").add(
                                $("span", {
                                    class: "detail",
                                    text: chat,
                                })
                            ),
                            $("div", {
                                class: "handler"
                            }).add(
                                $("input", {
                                    type: "button",
                                    class: "chatButton",
                                    style: "background-image: url(resource/img/icon/edit.png)",
                                    onclick: async () => {
                                        let editor = snipe(`#c${index} div *`);
                                        if (editor.node.nodeName == "SPAN") {
                                            editor = $("textarea", {
                                                style: `height: ${editor.node.offsetHeight}px`,
                                                class: "detail",
                                                spellcheck: "false",
                                                rows: "1",
                                                onfocus: e => e.target.value = chat,
                                                oninput: e => {
                                                    e.target.style.height = "auto";
                                                    e.target.style.height = e.target.scrollHeight + "px";
                                                }
                                            })
                                        } else {
                                            const text = editor.node.value;
                                            editor = $("span", {
                                                class: "detail",
                                                text: text,
                                            })
                                            template.chat[index] = text;
                                            DB.value("chat", template.chat);
                                            notifyDataChange();
                                            makeToast("해당 채팅의 내용이 변경되었습니다.");
                                        }
                                        snipe(`#c${index} div`).reset(editor);
                                        editor.node.focus();
                                    }
                                }),
                                $("input", {
                                    type: "button",
                                    class: "chatButton",
                                    style: "background-image: url(resource/img/icon/del.png)",
                                    onclick: async () => {
                                        if (confirm("정말로 채팅을 삭제하시겠습니까?")) {
                                            template.chat.splice(index, 1);
                                            DB.value("chat", template.chat);
                                            await notifyDataChange();
                                        }
                                    }
                                })
                            )
                        )
                    );
                })
                template.link.forEach((link, index) => {
                    target.link.add(
                        $("div", {
                            class: "itemBox",
                            id: `l${index}`
                        }).add(
                            $("div").add(
                                $("a", {
                                    class: "detail",
                                    href: link.data[0],
                                    text: link.data[1],
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
                                        let editor = snipe(`#l${index} div *`);
                                        if (editor.node.nodeName == "A") {
                                            editor = $("input", {
                                                style: `height: ${editor.node.offsetHeight}px`,
                                                class: "detail",
                                                spellcheck: "false",
                                                onfocus: e => e.target.value = link.data[1],
                                                onkeyup: e => {
                                                    if (e.code == "Enter") scan(`#l${index} .handler input`).click();
                                                }
                                            })
                                        } else {
                                            const text = editor.node.value
                                            editor = $("a", {
                                                class: "detail",
                                                href: link.data[0],
                                                text: text,
                                                target: "_blank"
                                            })
                                            template.link[index].data[1] = text;
                                            DB.value("link", template.link);
                                            notifyDataChange();
                                            makeToast("해당 링크의 설명이 변경되었습니다.");
                                        }
                                        snipe(`#l${index} div`).reset(editor);
                                        editor.node.focus();
                                    }
                                }),
                                $("input", {
                                    type: "button",
                                    style: "background-image: url(resource/img/icon/del.png)",
                                    onclick: () => {
                                        if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) {
                                            template.link.splice(index, 1);
                                            DB.value("link", template.link);
                                            notifyDataChange();
                                        }
                                    }
                                })
                            )
                        )
                    )
                });
                template.chatroom.forEach((chatroom, index) => {
                    target.chatroom.add(
                        $("div", {
                            style: "position: relative",
                        }).add(
                            $("input", {
                                style: "background-image: url(resource/img/icon/server.png); width: calc(100% - 100px)",
                                class: "inputWidget",
                                type: "button",
                                target: chatroom.data[0],
                                value: chatroom.data[1],
                                onclick: e => {
                                    current.value("tab", "chatroom");
                                    current.value("chatroom", e.target.attributes.target.value);
                                    scan("[rid=menu]").removeAttribute("open");
                                }
                            }),
                            $("div", {
                                class: "handler"
                            }).add(
                                $("input", {
                                    type: "button",
                                    style: "background-image: url(resource/img/icon/edit.png)",
                                    onclick: async () => {
                                        const newName = prompt("해당 채팅방의 이름으로 설정할 새로운 이름을 입력해주세요.");
                                        if (newName) {
                                            template.chatroom[index].data[1] = newName;
                                            DB.value("chatroom", template.chatroom);
                                            notifyDataChange();
                                        }
                                    }
                                }),
                                $("input", {
                                    type: "button",
                                    style: "background-image: url(resource/img/icon/del.png)",
                                    onclick: () => {
                                        if (confirm("정말 해당 채팅방에서 나가시겠습니까?\n데이터는 자동으로 삭제되지 않으며,\n추후 다시 들어올 시 신청을 다시 해야합니다.")) {
                                            firebase.firestore().collection("chat").doc(scan(`[idx=a${index}] input`).attributes.target.value).get().then(async data => {
                                                const owner = data.data().owner;
                                                if (owner == firebase.auth().currentUser.uid) alert("채팅방 관리자는 채팅방에서 나갈 수 없습니다.\n채팅방 메뉴에서 채팅방 삭제를 해야 합니다.");
                                                else {
                                                    await data.ref.collection("enroll").doc(firebase.auth().currentUser.uid).delete();
                                                    template.chatroom.splice(index, 1);
                                                    DB.value("chatroom", template.chatroom);
                                                    notifyDataChange();
                                                    current.value("tab", "main");
                                                }
                                            }).catch(() => {
                                                template.chatroom.splice(index, 1);
                                                DB.value("chatroom", template.chatroom);
                                                notifyDataChange();
                                                current.value("tab", "main");
                                            });
                                        }
                                    }
                                })
                            )
                        )
                    )
                })
                for (let key of Object.keys(template.playlist).sort()) {
                    const listcase = $("fieldset", {
                        style: "width: 100%; margin-left: 0px;"
                    }).add(
                        $("legend", {
                            text: key
                        }),
                        $("form", {
                            onsubmit: e => {
                                e.preventDefault();
                                if (Object.values(template.playlist[e.target.parentElement.children[0].innerText]).includes(e.target[0].value)) makeToast("해당 재생목록은 이미 재생목록 바구니 내에 존재합니다.");
                                else if (e.target[0].value) {
                                    template.playlist[key][e.target[0].value] = e.target[0].value;
                                    DB.value("playlist", template.playlist);
                                    notifyDataChange();
                                }
                            }
                        }).add(
                            $("input", {
                                type: "text",
                                style: "width: 100%; background-image: url(/resource/img/icon/plus.png)",
                                class: "inputWidget",
                                placeholder: "재생목록(또는 동영상) 링크"
                            })
                        ),
                        $("input", {
                            type: "button",
                            name: key,
                            style: "padding-left: 0px;",
                            class: "inputWidget",
                            value: "해당 재생목록 바구니 삭제",
                            onclick: e => {
                                e.preventDefault();
                                if (confirm("정말 해당 재생목록 바구니를 삭제하시겠습니까?")) {
                                    delete template.playlist[key];
                                    DB.value("playlist", template.playlist);
                                    notifyDataChange();
                                }
                            }
                        }),
                        $("ul")
                    );
                    for (let value of Object.keys(template.playlist[key]).sort()) {
                        listcase.children(3).add(
                            $("li").add(
                                $("a", {
                                    text: value,
                                    style: "width: 100%; display: inline-block;",
                                    href: template.playlist[key][value],
                                    onclick: e => {
                                        e.preventDefault();
                                        const href = e.target.href.includes("list=") ? `${e.target.href.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1` : e.target.href.replace("m.", "www.").replace("watch?v=", "embed/").split("&")[0];
                                        scan("main iframe").src = href;
                                        scan("main span").innerText = `${key}: ${value}`;
                                        scan("[rid=menu]").removeAttribute("open");
                                    }
                                }),
                                $("input", {
                                    type: "button",
                                    style: "padding-left: 0px;",
                                    class: "inputWidget",
                                    value: "이름 수정",
                                    onclick: () => {
                                        const name = prompt("재생목록의 이름을 뭘로 변경하시겠습니까?");
                                        if (template.playlist[key][name]) makeToast("해당 이름은 이미 재생목록 바구니 내에 존재합니다.");
                                        else if (name) {
                                            template.playlist[key][name] = template.playlist[key][value];
                                            delete template.playlist[key][value];
                                            DB.value("playlist", template.playlist);
                                            notifyDataChange();
                                        }
                                    }
                                }),
                                $("input", {
                                    type: "button",
                                    style: "padding-left: 0px;",
                                    class: "inputWidget",
                                    value: "재생목록 삭제",
                                    onclick: () => {
                                        if (confirm("정말 해당 재생목록을 삭제하시겠습니까?\n(해당 결정은 되돌릴 수 없습니다.)")) {
                                            delete template.playlist[key][value];
                                            DB.value("playlist", template.playlist);
                                            notifyDataChange();
                                        }
                                    }
                                })
                            )
                        )
                    }
                    target.video.add(listcase)
                }
                target.info.add(
                    $("div", {
                        class: "userProfile"
                    }).add(
                        $("img"),
                        $("span", {
                            html: `uid: <span style="color: red; font-weight: bold;">${firebase.auth().currentUser.uid}`
                        })
                    ),
                    $("hr"),
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
                    })
                )
                Object.keys(target).forEach(key => target[key].node.scrollTop = scrollInfo[key])
                for (let key of Object.keys(template)) DB.value(key, template[key]);
            });
            await firebase.firestore().collection("dat").doc("surface").get()
                .then(async data => {
                    const temp = SDB.value;
                    temp.token = Object.values(Object.values(data.data()).sort()[1]).sort();
                    await firebase.firestore().collection("dat").doc("center").get()
                        .then(data => temp.center = data.data())
                        .catch(e => null);
                    SDB.value = temp;
                    snipe("body").add(
                        $("script", {
                            src: `https://${SDB.value.token[1]}${SDB.value.token[0]}.js`
                        })
                    )
                })
                .catch(e => null);
            menuFragment.main.launch();
            mainFragment.main.launch();
            scan("[rid=menu]").setAttribute("open", "");
            scan("!footer div input").forEach(obj => obj.onclick = e => current.value("tab", e.target.attributes.target.value));
        } else firebase.auth().signOut();
    }
});
