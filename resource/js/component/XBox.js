import { Dynamic } from "../init/module.js";

const HandlerContainerX = (...handler) => Dynamic.$("div", {style: "flex-direction: column", class: "handlerX"}).add(...handler)
const HandlerX = ({element, onedit, ondelete, editFrom="innerText"}) => {
    const elements = {
        static: element,
        editer: Dynamic.$("form", {onsubmit: onedit}).add(
            Dynamic.$("textarea", {required: null, style: "width: 100%;", spellcheck: "false"}),
            Dynamic.$("input", {type: "submit", style: "display: none"})
        )
    }
    let isEditable = false;
    const frame = Dynamic.$("div", {style: "width: 100%"}).add(elements["static"]);

    return Dynamic.$("div", {class: "handlerX"}).add(
        frame,
        Dynamic.$("div", {style: "display: flex"}).add(
            IconX({icon: "edit", onclick: () => {
                isEditable = !isEditable;
                if (isEditable) {
                    elements.editer.node[0].value = elements.static.node[editFrom];
                    elements.editer.node[0].style.height = `${elements.static.node.scrollHeight + 20}px`;
                } else elements.editer.node[1].click();
                frame.reset(elements[isEditable ? "editer" : "static"]);
            }}),
            IconX({icon: "delete", onclick: ondelete})
        )
    )
}
const ScreenX = screenId => Dynamic.$("div", {class: "screenX"}).add(
    Dynamic.$("div", {id: screenId, style: "height: 100%; overflow-y: scroll;"})
)
const InputX = ({label, value, placeholder, type="text", oninput}) => Dynamic.$("div", {class: "inputX"}).add(
    Dynamic.$("label", {text: label}),
    Dynamic.$("input", {required: "", type: type, value: value, placeholder: placeholder, oninput: oninput})
)
const ButtonX = ({value, type="button", onclick}) => Dynamic.$("div", {class: "inputX"}).add(
    Dynamic.$("input", {type: type, value: value, onclick: onclick})
)
const IconX = ({icon, onclick}) => Dynamic.$("input", {type: "button", style: `background-image: url(${icon.includes("http") ? `https://www.google.com/s2/favicons?domain=${icon})` : `/resource/img/icon/${icon}.png)`}`, class: "iconX", onclick: onclick})

export { HandlerContainerX, HandlerX, ScreenX, InputX, ButtonX, IconX }
