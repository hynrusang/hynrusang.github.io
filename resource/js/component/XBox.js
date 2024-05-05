import { Dynamic } from "../init/module.js";

const HandlerX = ({element, onedit, ondelete}) => {
    const elements = {
        static: element,
        editer: Dynamic.$("form", {onsubmit: onedit}).add(
            Dynamic.$("textarea", {required: null, style: "width: 100%;", spellcheck: "false"}),
            Dynamic.$("input", {type: "submit", style: "display: none"})
        )
    }
    let elementMode = "static";
    const frame = Dynamic.$("div", {style: "width: 100%"}).add(elements[elementMode]);

    return Dynamic.$("div", {class: "handlerX"}).add(
        frame,
        Dynamic.$("div", {style: "display: flex; flex-direction: row-reverse;"}).add(
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
const ScreenX = screenId => Dynamic.$("div", {class: "screenX"}).add(
    Dynamic.$("div", {id: screenId, style: "height: calc(100% - 150px); overflow-y: scroll;"})
)
const InputX = ({label, value, placeholder, type="text", oninput}) => Dynamic.$("div", {class: "inputX"}).add(
    Dynamic.$("label", {text: label}),
    Dynamic.$("input", {required: "", type: type, value: value, placeholder: placeholder, oninput: oninput})
)
const ButtonX = ({value, type="button", onclick}) => Dynamic.$("div", {class: "inputX"}).add(
    Dynamic.$("input", {type: type, value: value, onclick: onclick})
)
const IconX = ({icon, onclick}) => Dynamic.$("input", {type: "button", style: `background-image: url(${icon.includes("http") ? `https://www.google.com/s2/favicons?domain=${icon})` : `/resource/img/icon/${icon}.png)`}`, class: "iconX", onclick: onclick})

export { HandlerX, ScreenX, InputX, ButtonX, IconX }
