const HandlerX = ({element, onedit, ondelete}) => {
    const elements = {
        static: element,
        editer: $("form", {onsubmit: onedit}).add(
            $("textarea", {required: null, style: "width: 100%;", spellcheck: "false"}),
            $("input", {type: "submit", style: "display: none"})
        )
    }
    let elementMode = "static";
    const frame = $("div", {style: "width: 100%"}).add(elements[elementMode]);

    return $("div", {class: "handlerX"}).add(
        frame,
        $("div", {style: "display: flex; flex-direction: row-reverse;"}).add(
            IconX({icon: "delete", onclick: ondelete}),
            IconX({icon: "edit", onclick: () => {
                const isStatic = elementMode == "static";
                if (isStatic) {
                    elements.editer.node[0].value = elements.static.node.innerText;
                    elements.editer.node[0].style.height = `${elements.static.node.scrollHeight + 20}px`;
                } else elements.editer.node[1].click();
                elementMode = elementMode == "static" ? "editer" : "static";
                frame.reset(elements[elementMode]);
            }})
        )
    )
}
const ScreenX = screenId => $("div", {class: "screenX"}).add(
    $("div", {id: screenId, style: "height: calc(100% - 150px); overflow-y: scroll;"})
)
const InputX = ({label, value, placeholder, type="text", oninput}) => $("div", {class: "inputX"}).add(
    $("label", {text: label}),
    $("input", {required: "", type: type, value: value, placeholder: placeholder, oninput: oninput})
)
const ButtonX = ({value, type="button", onclick}) => $("div", {class: "inputX"}).add(
    $("input", {type: type, value: value, onclick: onclick})
)
const IconX = ({icon, onclick}) => $("input", {type: "button", style: `background-image: url(${icon.includes("http") ? `https://www.google.com/s2/favicons?domain=${icon})` : `/resource/img/icon/${icon}.png)`}`, class: "iconX", onclick: onclick})

export { HandlerX, ScreenX, InputX, ButtonX, IconX }
