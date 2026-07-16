import { Dynamic } from "../init/module.js";
import DataResource from "../util/DataResource.js";
import { ButtonX, InputX } from "./XBox.js";

// ==========================================
// 1. Authentication form
// ==========================================

const LoginForm = Dynamic.$("form", { class: "formBox", onsubmit: event => {
    event.preventDefault();
    DataResource.Auth.authenticate(event.target[0].value, event.target[1].value);
}}).add(
    InputX({ label: "email", placeholder: "Enter your Email.", oninput: event => {
        const preValue = event.target.preValue ?? "";
        if (preValue.includes("@") && preValue.indexOf("@") === preValue.length - 1) {
            switch (event.data) {
                case "g":
                    event.target.value += "mail.com";
                    break;
                case "n":
                    event.target.value += "aver.com";
                    break;
                case "d":
                    event.target.value += "aum.net";
                    break;
            }
        }
        event.target.preValue = event.target.value;
    } }),
    InputX({ label: "password", type: "password", placeholder: "Enter your Password." }),
    ButtonX({ label: "login / register", type: "submit", value: "로그인 / 회원가입" }),
    ButtonX({ label: "find password", type: "button", value: "비밀번호 초기화", onclick: () => DataResource.Auth.changePassword(Dynamic.scan("form")[0].value) })
);

// ==========================================
// 2. Memo and link creation forms
// ==========================================

/**
 * @description 새 메모를 서버에 저장합니다.
 * 기존 배열을 직접 변경하지 않고 새 배열을 만들어 저장 실패 시 현재 화면 데이터가 오염되지 않게 합니다.
 */
const MemoForm = Dynamic.$("form", { class: "memo-create-form", autocomplete: "off", onsubmit: async event => {
    event.preventDefault();
    const memoInput = event.currentTarget.elements[0];
    const value = memoInput.value.trim();
    if (!value) return;

    const nextMemo = [value, ...(DataResource.Data.basic.memo || [])];
    if (!await DataResource.Data.commitBasicData("memo", nextMemo)) return;

    memoInput.value = "";
}}).add(
    Dynamic.$("textarea", {
        required: null,
        class: "memo-create-input",
        placeholder: "메모 내용",
        spellcheck: "false"
    }),
    Dynamic.$("button", { type: "submit", class: "formApplyButton", text: "작성" })
);

/**
 * @description 새 링크를 서버에 저장합니다.
 * 링크 제목과 주소 입력에는 브라우저 자동완성을 사용하지 않아 편집 화면을 가리는 제안 목록을 차단합니다.
 */
const LinkForm = Dynamic.$("form", { class: "link-create-form", autocomplete: "off", onsubmit: async event => {
    event.preventDefault();
    const [titleInput, urlInput] = event.currentTarget.elements;
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    if (!title || !url) return;

    const nextLink = { ...(DataResource.Data.basic.link || {}), [title]: url };
    if (!await DataResource.Data.commitBasicData("link", nextLink)) return;

    titleInput.value = "";
    urlInput.value = "";
}}).add(
    Dynamic.$("div", { class: "link-create-row" }).add(
        Dynamic.$("input", { required: "", autocomplete: "off", spellcheck: "false", placeholder: "링크 타이틀 · 예: 구글" }),
        Dynamic.$("input", { required: "", autocomplete: "off", spellcheck: "false", placeholder: "링크 주소 · 예: https://www.google.com/" })
    ),
    Dynamic.$("button", { type: "submit", class: "formApplyButton", text: "링크 주소 반영" })
);

// ==========================================
// 3. Legacy playlist form
// ==========================================

/**
 * @description Player 내부 목록 편집기와 별도로 남아 있는 공용 재생목록 입력 폼입니다.
 * 중첩 객체를 복사한 뒤 저장하여 기존 재생목록 객체를 직접 변경하지 않습니다.
 */
const PlaylistForm = Dynamic.$("form", { class: "playlist-create-form", autocomplete: "off", onsubmit: async event => {
    event.preventDefault();
    const [categoryInput, nameInput, urlInput] = event.currentTarget.elements;
    const category = categoryInput.value.trim();
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    if (!category || !name || !url) return;

    const currentPlaylist = DataResource.Data.basic.playlist || {};
    const nextPlaylistMap = {
        ...currentPlaylist,
        [category]: { ...(currentPlaylist[category] || {}) }
    };
    if (nextPlaylistMap[category][name]) return;

    nextPlaylistMap[category][name] = url;
    if (!await DataResource.Data.commitBasicData("playlist", nextPlaylistMap)) return;

    nameInput.value = "";
    urlInput.value = "";
}}).add(
    InputX({ label: "분류", value: "기본", autocomplete: "off" }),
    InputX({ label: "표시 이름", placeholder: "예: 출근길 음악", autocomplete: "off" }),
    InputX({ label: "영상 / 재생목록 주소", placeholder: "https://www.youtube.com/watch?v=...", autocomplete: "off" }),
    ButtonX({ type: "submit", value: "목록 저장" })
);

export { LoginForm, MemoForm, LinkForm, PlaylistForm };
