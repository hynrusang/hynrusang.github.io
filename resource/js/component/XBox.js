import { Dynamic } from "../init/module.js";

const HandlerContainerX = (...handler) => Dynamic.$("div", {style: "flex-direction: column", class: "handlerX"}).add(...handler)
const HandlerX = ({element, onedit, ondelete, editFrom="innerText"}) => {
    const elements = {
        static: element,
        editer: Dynamic.$("form", {class: "inlineEditForm memo-inline-editor", onsubmit: onedit}).add(
            Dynamic.$("textarea", {required: null, class: "inlineEditTextarea", spellcheck: "false"}),
            Dynamic.$("button", {type: "submit", class: "inlineEditSubmit", text: "반영"})
        )
    }
    let isEditable = false;
    const frame = Dynamic.$("div", {class: "handlerContent"}).add(elements["static"]);

    return Dynamic.$("div", {class: "handlerX"}).add(
        frame,
        Dynamic.$("div", {class: "handlerActions"}).add(
            IconX({icon: "edit", onclick: () => {
                isEditable = !isEditable;
                if (isEditable) {
                    elements.editer.node[0].value = elements.static.node[editFrom];
                    elements.editer.node[0].style.height = "";
                    elements.editer.node[0].style.height = `${Math.min(Math.max(elements.static.node.scrollHeight + 12, 44), 180)}px`;
                }
                frame.reset(elements[isEditable ? "editer" : "static"]);
            }}),
            IconX({icon: "delete", onclick: ondelete})
        )
    )
}
const ScreenX = screenId => Dynamic.$("div", {class: "screenX"}).add(
    Dynamic.$("div", {id: screenId})
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
