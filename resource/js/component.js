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
     * @type {(props: {idx: string, field: Dom, fedit: Function, fdelete: Function}) => Dom}
     */
    UFrame: ({idx, field, fedit, fdelete}) => $("div", {
        class: "itemBox",
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
     * @type {(props: {id: number, dataset: string[]}) => Dom}
     */
    ChatBox: ({id, dataset}) => {
        let field = $("span", {
            class: "detail",
            text: dataset[id],
        });
    
        return _SComponent.UFrame({
            idx: `c${id}`,
            field: field,
            fedit: () => {
                if (field.node.nodeName == "SPAN") {
                    field = $("textarea", {
                        style: `height: ${field.node.offsetHeight}px`,
                        class: "detail",
                        spellcheck: "false",
                        rows: "1",
                        onfocus: e => e.target.value = dataset[id],
                        oninput: e => {
                            e.target.style.height = "auto";
                            e.target.style.height = e.target.scrollHeight + "px";
                        }
                    })
                } else {
                    dataset[id] = field.node.value;
                    field = $("span", {
                        class: "detail",
                        text: dataset[id],
                    })
                    DB.value("chat", dataset);
                    notifyDataChange();
                    makeToast("해당 채팅의 내용이 변경되었습니다.");
                }
                snipe(`#c${id} div`).reset(field);
                field.node.focus();
            },
            fdelete: () => {
                if (confirm("정말로 채팅을 삭제하시겠습니까?")) {
                    dataset.splice(id, 1);
                    DB.value("chat", dataset);
                    notifyDataChange();
                }
            }
        })
    },

    /**
     * @type {(props: {id: number, dataset: object[]}) => Dom}
     */
    LinkBox: ({id, dataset}) => {
        let field = $("a", {
            class: "detail",
            href: dataset[id].data[0],
            text: dataset[id].data[1],
            target: "_blank"
        });

        return _SComponent.UFrame({
            idx: `l${id}`,
            field: field,
            fedit: () => {
                if (field.node.nodeName == "A") {
                    field = $("input", {
                        style: `height: ${field.node.offsetHeight}px`,
                        class: "detail",
                        spellcheck: "false",
                        onfocus: e => e.target.value = dataset[id].data[1],
                        onkeyup: e => (e.code == "Enter") ? scan(`#l${id} .handler input`).click() : null
                    })
                } else {
                    dataset[id].data[1] = field.node.value;
                    field = $("a", {
                        class: "detail",
                        href: dataset[id].data[0],
                        text: dataset[id].data[1],
                        target: "_blank"
                    })
                    DB.value("link", dataset);
                    notifyDataChange();
                    makeToast("해당 링크의 설명이 변경되었습니다.");
                }
                snipe(`#l${id} div`).reset(field);
                field.node.focus();
            },
            fdelete: () => {
                if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) {
                    dataset.splice(id, 1);
                    DB.value("link", dataset);
                    notifyDataChange();
                }
            }
        })
    }
}