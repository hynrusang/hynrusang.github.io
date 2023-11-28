/**
 * @type {(f: Function) => Dom}
 */
const _Handler = f => $("div", {
    class: "handler"
}).add(
    $("input", {
        type: "button",
        class: "chatButton",
        style: "background-image: url(resource/img/icon/edit.png)",
        onclick: f[0]
    }),
    $("input", {
        type: "button",
        class: "chatButton",
        style: "background-image: url(resource/img/icon/del.png)",
        onclick: f[1]
    })
)

/**
 * @type {(props: {id: number, data: string, isGlobal: boolean}) => Dom}
 */
const ChatBox = ({id, data, isGlobal = false}) => {
    let chatField = $("span", {
        class: "detail",
        text: data,
    });
    let handler = new Array(2);

    if (isGlobal) {

    } else {
        handler[0] = () => {
            if (chatField.node.nodeName == "SPAN") {
                chatField = $("textarea", {
                    style: `height: ${chatField.node.offsetHeight}px`,
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
                const temp = DB.value("chat");
                temp[id] = chatField.node.value;
                chatField = $("span", {
                    class: "detail",
                    text: temp[id],
                })
                DB.value("chat", temp);
                notifyDataChange();
                makeToast("해당 채팅의 내용이 변경되었습니다.");
            }
            snipe(`#c${id} div`).reset(chatField);
            chatField.node.focus();
        }
        handler[1] = () => {
            if (confirm("정말로 채팅을 삭제하시겠습니까?")) {
                const temp = DB.value("chat");
                temp.splice(id, 1);
                DB.value("chat", temp);
                notifyDataChange();
            }
        }
    }

    return $("div", {
        class: "itemBox",
        id: `c${id}`
    }).add(
        $("div").add(chatField),
        _Handler(handler)
    )
}

/**
 * @type {(props: {id: number, data: string[], isGlobal: boolean}) => Dom}
 */
const LinkBox = ({id, data, isGlobal = false}) => {
    let linkField = $("a", {
        class: "detail",
        href: data[0],
        text: data[1],
        target: "_blank"
    });
    let handler = new Array(2);

    if (isGlobal) {

    } else {
        handler[0] = () => {
            if (linkField.node.nodeName == "A") {
                linkField = $("input", {
                    style: `height: ${linkField.node.offsetHeight}px`,
                    class: "detail",
                    spellcheck: "false",
                    onfocus: e => e.target.value = data[1],
                    onkeyup: e => {
                        if (e.code == "Enter") scan(`#l${index} .handler input`).click();
                    }
                })
            } else {
                const temp = DB.value("link");
                temp[id].data[1] = linkField.node.value;
                linkField = $("a", {
                    class: "detail",
                    href: data[0],
                    text: temp[id].data[1],
                    target: "_blank"
                })
                DB.value("link", temp);
                notifyDataChange();
                makeToast("해당 링크의 설명이 변경되었습니다.");
            }
            snipe(`#l${id} div`).reset(linkField);
            linkField.node.focus();
        }
        handler[1] = () => {
            if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) {
                const temp = DB.value("link");
                temp.splice(id, 1);
                DB.value("link", temp);
                notifyDataChange();
            }
        }
    }
    
    return $("div", {
        class: "itemBox",
        id: `l${id}`
    }).add(
        $("div").add(linkField),
        _Handler(handler)
    )
}