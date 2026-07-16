import { Dynamic } from "../init/module.js";

// ==========================================
// 1. Reusable content handlers
// ==========================================

const HandlerContainerX = (...handler) => Dynamic.$("div", { style: "flex-direction: column", class: "handlerX" }).add(...handler);

/**
 * @description 읽기 요소와 textarea 편집 화면을 전환하는 공용 콘텐츠 핸들러입니다.
 * textarea와 읽기 본문은 카드 내부에서 잘리지 않고 실제 콘텐츠 높이만큼 확장됩니다.
 */
const HandlerX = ({ element, onedit, ondelete, editFrom = "innerText" }) => {
    let isEditing = false;
    const frame = Dynamic.$("div", { class: "handlerContent" });

    /** 읽기 요소를 카드 본문에 복원합니다. */
    const showContent = () => {
        isEditing = false;
        frame.reset(element);
    };

    /** textarea 높이를 내용 전체가 보이는 실제 scrollHeight에 맞춥니다. */
    const resizeEditor = textarea => {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight + 2}px`;
    };

    /** 기존 본문을 복사한 편집 폼을 카드 안에 표시합니다. */
    const showEditor = () => {
        isEditing = true;
        const editorTextarea = Dynamic.$("textarea", {
            name: "memoValue",
            required: "",
            class: "inlineEditTextarea",
            autocomplete: "new-password",
            autocapitalize: "off",
            spellcheck: "false",
            "aria-autocomplete": "none",
            "data-lpignore": "true",
            "data-1p-ignore": "true",
            oninput: event => resizeEditor(event.currentTarget)
        });
        const editor = Dynamic.$("form", {
            class: "inlineEditForm memo-inline-editor",
            autocomplete: "off",
            onsubmit: onedit
        }).add(
            editorTextarea,
            Dynamic.$("div", { class: "inlineEditActions" }).add(
                Dynamic.$("button", { type: "button", class: "inlineEditCancel", text: "취소", onclick: showContent }),
                Dynamic.$("button", { type: "submit", class: "inlineEditSubmit", text: "수정 반영" })
            )
        );

        editorTextarea.node.value = element.node[editFrom];
        frame.reset(editor);
        requestAnimationFrame(() => {
            resizeEditor(editorTextarea.node);
            editorTextarea.node.focus();
        });
    };

    showContent();
    return Dynamic.$("div", { class: "handlerX memo-handler" }).add(
        frame,
        Dynamic.$("div", { class: "handlerActions" }).add(
            IconX({ icon: "edit", title: "수정", onclick: () => isEditing ? showContent() : showEditor() }),
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
