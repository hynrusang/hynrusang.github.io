import { Dynamic } from "../init/module.js";

// ==========================================
// 1. Reusable content handlers
// ==========================================

const HandlerContainerX = (...handler) => Dynamic.$("div", { style: "flex-direction: column", class: "handlerX" }).add(...handler);

/**
 * @description 읽기 화면과 textarea 편집 화면을 전환하는 공용 메모 핸들러입니다.
 * 편집 textarea는 실제 내용 높이에 맞춰 확장하되 화면 높이의 60%를 넘을 때만 내부 스크롤을 사용합니다.
 */
const HandlerX = ({ element, onedit, ondelete, editFrom = "innerText" }) => {
    const editorTextarea = Dynamic.$("textarea", {
        required: null,
        class: "inlineEditTextarea",
        spellcheck: "false",
        rows: "2",
        oninput: event => resizeEditor(event.currentTarget)
    });
    const editor = Dynamic.$("form", { class: "inlineEditForm memo-inline-editor", onsubmit: onedit }).add(
        editorTextarea,
        Dynamic.$("button", { type: "submit", class: "inlineEditSubmit", text: "반영" })
    );
    const frame = Dynamic.$("div", { class: "handlerContent" }).add(element);
    let isEditable = false;

    /**
     * @description 짧은 메모는 불필요한 스크롤바 없이 전부 보이고,
     * 매우 긴 메모만 화면을 모두 덮지 않도록 최대 높이를 제한합니다.
     */
    function resizeEditor(textarea) {
        const maxHeight = Math.max(240, Math.floor(window.innerHeight * 0.6));
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight + 4, maxHeight)}px`;
        textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
    }

    return Dynamic.$("div", { class: "handlerX" }).add(
        frame,
        Dynamic.$("div", { class: "handlerActions" }).add(
            IconX({ icon: "edit", title: "수정", onclick: () => {
                isEditable = !isEditable;
                if (isEditable) {
                    editorTextarea.node.value = element.node[editFrom];
                    frame.reset(editor);
                    requestAnimationFrame(() => {
                        resizeEditor(editorTextarea.node);
                        editorTextarea.node.focus();
                    });
                    return;
                }
                frame.reset(element);
            } }),
            IconX({ icon: "delete", title: "삭제", onclick: ondelete })
        )
    );
};

// ==========================================
// 2. Basic layout controls
// ==========================================

const ScreenX = screenId => Dynamic.$("div", { class: "screenX" }).add(
    Dynamic.$("div", { id: screenId })
);

const InputX = ({ label, value, placeholder, type = "text", oninput, autocomplete }) => Dynamic.$("div", { class: "inputX" }).add(
    Dynamic.$("label", { text: label }),
    Dynamic.$("input", {
        required: "",
        type,
        value,
        placeholder,
        oninput,
        autocomplete
    })
);

const ButtonX = ({ value, type = "button", onclick }) => Dynamic.$("div", { class: "inputX" }).add(
    Dynamic.$("input", { type, value, onclick })
);

/**
 * @description 로컬 아이콘 또는 외부 사이트 favicon을 사용하는 공용 아이콘 버튼입니다.
 */
const IconX = ({ icon, onclick, title = "" }) => Dynamic.$("input", {
    type: "button",
    style: `background-image: url(${icon.includes("http") ? `https://www.google.com/s2/favicons?domain=${icon})` : `/resource/img/icon/${icon}.png)`}`,
    class: "iconX",
    onclick,
    title,
    "aria-label": title || icon
});

export { HandlerContainerX, HandlerX, ScreenX, InputX, ButtonX, IconX };
