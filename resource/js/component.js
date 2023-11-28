/**
 * about shared interface component
 */
const _SComponent = {
    /**
     * @type {(props: {fedit: Function?, fdelete: Function?}) => Dom}
     */
    Handler: ({fedit, fdelete}) => $("div", {
        class: "handler"
    }).add(
        fedit ? $("input", {
            type: "button",
            class: "chatButton",
            style: "background-image: url(resource/img/icon/edit.png)",
            onclick: fedit
        }) : fedit,
        fdelete ? $("input", {
            type: "button",
            class: "chatButton",
            style: "background-image: url(resource/img/icon/del.png)",
            onclick: fdelete
        }) : fdelete
    ),

    /**
     * @type {(props: {idx: string, field: Dom, style: string?, fedit: Function?, fdelete: Function?}) => Dom}
     */
    UFrame: ({idx, field, style, fedit, fdelete}) => $("div", {
        class: "itemBox",
        style: style,
        id: idx
    }).add(
        $("div").add(field),
        _SComponent.Handler({
            fedit: fedit,
            fdelete: fdelete
        })
    )
}

/**
 * about user interface component
 */
const UComponent = {
    /**
     * @type {(dataset: string[]) => Dom[]}
     */
    ChatBox: dataset => dataset.map((data, index) => {
        let field = $("span", {
            class: "detail",
            text: data,
        });

        return _SComponent.UFrame({
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

        return _SComponent.UFrame({
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
        const field = $("input", {
            style: "background-image: url(resource/img/icon/server.png); width: calc(100% - 100px)",
            class: "inputWidget",
            type: "button",
            target: data.data[0],
            value: data.data[1],
            onclick: e => {
                scan("[rid=menu]").removeAttribute("open");
                current.value("tab", "chatroom");
                current.value("chatroom", e.target.attributes.target.value);
            }
        });

        return _SComponent.UFrame({
            idx: `r${index}`,
            field: field,
            style: "padding: 0px; background-color: inherit;",
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
    })
}