import { Dynamic } from "../init/module.js";

// ==========================================
// 1. Text input policy
// ==========================================

/**
 * @description 브라우저와 비밀번호 관리 확장 프로그램이 과거 입력값을 제안하지 않도록
 * 모든 사용자 입력 필드에 동일하게 적용하는 속성입니다.
 * name 속성은 Chrome의 저장값 매칭에 사용될 수 있으므로 각 화면은 data-field로 값을 찾습니다.
 */
const NoAutocompleteX = Object.freeze({
    autocomplete: "off",
    autocapitalize: "off",
    spellcheck: "false",
    "aria-autocomplete": "none",
    "data-lpignore": "true",
    "data-1p-ignore": "true",
    "data-form-type": "other"
});

// ==========================================
// 2. Reusable content handlers
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
            ...NoAutocompleteX,
            "data-field": "memoValue",
            required: "",
            class: "inlineEditTextarea",
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
// 3. Basic layout controls
// ==========================================

const ScreenX = screenId => Dynamic.$("div", { class: "screenX" }).add(
    Dynamic.$("div", { id: screenId })
);

const InputX = ({ label, field, value, placeholder, type = "text", oninput }) => Dynamic.$("div", { class: "inputX" }).add(
    Dynamic.$("label", { text: label }),
    Dynamic.$("input", {
        ...NoAutocompleteX,
        "data-field": field,
        required: "",
        type,
        value,
        placeholder,
        oninput
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

export { NoAutocompleteX, HandlerContainerX, HandlerX, ScreenX, InputX, ButtonX, IconX };
