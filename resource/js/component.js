/**
 * about shared interface component
 */
const SComponent = {
    /**
     * @type {(icon: string, text: string, fonclick: Function) => Dom}
     */
    WidgetButton: (icon, text, fonclick) => $("input", { 
        type: "button",
        class: "inputWidget",
        style: `background-image: url('/resource/img/icon/${icon}.png')`, 
        value: text,
        onclick: fonclick
    }),
    
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
}

/**
 * about user interface component
 */
const UComponent = {
    /**
     * @type {(props: {idx: string?, field: Dom, style: string?, fedit: Function?, fdelete: Function?}) => Dom}
     */
    Frame: ({idx, field, style, fedit, fdelete}) => $("div", {
        class: "itemBox",
        style: style,
        id: idx
    }).add(
        $("div").add(field),
        SComponent.Handler({
            fedit: fedit,
            fdelete: fdelete
        })
    ),
    
    /**
     * @type {(dataset: string[]) => Dom[]}
     */
    ChatBox: dataset => dataset.map((data, index) => {
        let field = $("span", {
            class: "detail",
            text: data,
        });

        return UComponent.Frame({
            idx: `c${index}`,
            field: field,
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
                snipe(`#c${index} div`).reset(field);
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
     * @type {(dataset: object[]) => Dom[]}
     */
    LinkBox: dataset => dataset.map((data, index) => {
        let field = $("a", {
            class: "detail",
            href: data.data[0],
            text: data.data[1],
            target: "_blank"
        });

        return UComponent.Frame({
            idx: `l${index}`,
            field: field,
            fedit: () => {
                if (field.node.nodeName == "A") {
                    field = $("input", {
                        style: `height: ${field.node.offsetHeight}px`,
                        class: "detail",
                        spellcheck: "false",
                        onfocus: e => e.target.value = data.data[1],
                        onkeyup: e => (e.code == "Enter") ? scan(`#l${index} .handler input`).click() : null
                    })
                } else {
                    dataset[index].data[1] = field.node.value;
                    field = $("a", {
                        class: "detail",
                        href: dataset[index].data[0],
                        text: dataset[index].data[1],
                        target: "_blank"
                    })
                    DB.value("link", dataset);
                    notifyDataChange();
                    makeToast("해당 링크의 설명이 변경되었습니다.");
                }
                snipe(`#l${index} div`).reset(field);
                field.node.focus();
            },
            fdelete: () => {
                if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) {
                    dataset.splice(index, 1);
                    DB.value("link", dataset);
                    notifyDataChange();
                }
            }
        })
    }),

    /**
     * @type {(dataset: object[]) => Dom[]}
     */
    RoomBox: dataset => dataset.map((data, index) => {
        const field = SComponent.WidgetButton("server", data.data[1], e => {
            scan("[rid=menu]").removeAttribute("open");
            current.value("tab", "chatroom");
            current.value("chatroom", data.data[0]);
        });

        return UComponent.Frame({
            field: field,
            style: "padding: 0px;",
            fedit: () => {
                const newName = prompt("해당 채팅방의 이름으로 설정할 새로운 이름을 입력해주세요.");
                if (newName) {
                    dataset[index].data[1] = newName;
                    DB.value("chatroom", dataset);
                    notifyDataChange();
                }
            },
            fdelete: () => {
                if (confirm("정말 해당 채팅방에서 나가시겠습니까?\n데이터는 자동으로 삭제되지 않으며,\n추후 다시 들어올 시 신청을 다시 해야합니다.")) {
                    firebase.firestore().collection("chat").doc(field.node.attributes.target.value).get().then(async data => {
                        const owner = data.data().owner;
                        if (owner == firebase.auth().currentUser.uid) alert("채팅방 관리자는 채팅방에서 나갈 수 없습니다.\n채팅방 메뉴에서 채팅방 삭제를 해야 합니다.");
                        else {
                            await data.ref.collection("enroll").doc(firebase.auth().currentUser.uid).delete();
                            dataset.splice(index, 1);
                            DB.value("chatroom", dataset);
                            notifyDataChange();
                            current.value("tab", "main");
                        }
                    })
                }
            }
        })
    }),

    Youtube: {
        /**
         * @type {(dataset: object) => Dom[]}
         */
        Frame: dataset => Object.keys(dataset).sort().map(data => $("fieldset", {
            style: "position: relative;"
        }).add(
            $("legend", {
                text: data
            }),
            $("div", {
                style: "margin-bottom: 40px"
            }).add(UComponent.Youtube.Item(dataset, data)),
            SComponent.Handler({
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
        Item: (dataset, key) => Object.keys(dataset[key]).sort().map(data => UComponent.Frame({
            field: $("a", {
                text: data,
                style: "width: 100%; padding: 4px; display: inline-block;",
                href: dataset[key][data],
                onclick: e => {
                    e.preventDefault();
                    const href = e.target.href.includes("list=") ? `${e.target.href.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1` : e.target.href.replace("m.", "www.").replace("watch?v=", "embed/").split("&")[0];
                    scan("main iframe").src = href;
                    scan("main span").innerText = `${key}: ${data}`;
                    scan("[rid=menu]").removeAttribute("open");
                }
            }),
            fedit: () => {
                const name = prompt("재생목록의 이름을 뭘로 변경하시겠습니까?");
                if (dataset[key][name]) makeToast("해당 이름은 이미 재생목록 바구니 내에 존재합니다.");
                else if (name) {
                    dataset[key][name] = dataset[key][data];
                    delete dataset[key][data];
                    DB.value("playlist", dataset);
                    notifyDataChange();
                }
            },
            fdelete: () => {
                if (confirm("정말 해당 재생목록을 삭제하시겠습니까?\n(해당 결정은 되돌릴 수 없습니다.)")) {
                    delete dataset[key][data];
                    DB.value("playlist", dataset);
                    notifyDataChange();
                }
            }
        }))
    },

    /**
     * @type {(dataset: object) => Dom}
     */
    InfoBox: dataset => {
        let element = [
            SComponent.UserProfile({
                name: firebase.auth().currentUser.uid
            }),
            SComponent.WidgetButton("password", "비밀번호 변경 이메일 보내기", () => {
                makeToast("이메일 주소로 비밀번호 초기화 메일을 보내기 시도하는 중입니다.");
                firebase.auth().sendPasswordResetEmail(firebase.auth().currentUser.email)
                .then(() => makeToast("이메일 주소로 초기화 메일을 보냈습니다."))
                .catch(e => {
                    if (e.code == "auth/invalid-email") makeToast("잘못된 이메일 주소입니다.");
                    else if (e.code == "auth/user-not-found") makeToast("해당 계정은 존재하지 않습니다.");
                })
            }),
            SComponent.WidgetButton("setting", "로그아웃", () => firebase.auth().signOut().then(() => location.reload())),
            SComponent.WidgetButton("del", "회원 탈퇴", async () => {
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
            })
        ]
        if (SDB.value.token) element = element.concat([
            $("hr"),
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
                    style: "background-image: url('/resource/img/icon/lock.png')",
                    class: "inputWidget",
                    placeholder: "특수문서 키"
                })
            )
        ])
        return element;
    }
}

/**
 * about global interface component
 */
const GComponent = {

}
