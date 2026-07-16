import { Dynamic } from "../init/module.js";
import DataResource from "../util/DataResource.js";
import { ButtonX, InputX } from "./XBox.js";

// ==========================================
// 1. Authentication form
// ==========================================

const LoginForm = Dynamic.$("form", { class: "formBox", autocomplete: "off", onsubmit: event => {
    event.preventDefault();
    const email = event.currentTarget.querySelector('[data-field="loginEmail"]').value;
    const password = event.currentTarget.querySelector('[data-field="loginPassword"]').value;
    DataResource.Auth.authenticate(email, password);
}}).add(
    InputX({ label: "email", field: "loginEmail", placeholder: "Enter your Email.", oninput: event => {
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
    InputX({ label: "password", field: "loginPassword", type: "password", placeholder: "Enter your Password." }),
    ButtonX({ label: "login / register", type: "submit", value: "로그인 / 회원가입" }),
    ButtonX({ label: "find password", type: "button", value: "비밀번호 초기화", onclick: event => DataResource.Auth.changePassword(event.currentTarget.closest("form").querySelector('[data-field="loginEmail"]').value) })
);

// ==========================================
// 2. Legacy playlist form
// ==========================================

/**
 * @description Player 내부 목록 편집기와 별도로 남아 있는 공용 재생목록 입력 폼입니다.
 * 저장 대상 객체를 먼저 복사하므로 Firestore 저장 실패 시 현재 LiveData가 중간 상태로 남지 않습니다.
 */
const PlaylistForm = Dynamic.$("form", { class: "playlist-create-form", autocomplete: "off", onsubmit: async event => {
    event.preventDefault();

    // 1. 입력값을 읽고 저장 가능한 최소 조건을 확인합니다.
    const categoryInput = event.currentTarget.querySelector('[data-field="playlistCategory"]');
    const nameInput = event.currentTarget.querySelector('[data-field="playlistName"]');
    const urlInput = event.currentTarget.querySelector('[data-field="playlistUrl"]');
    const category = categoryInput.value.trim();
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();
    if (!category || !name || !url) return;

    // 2. 기존 객체를 직접 변경하지 않고 다음 저장본을 구성합니다.
    const currentPlaylist = DataResource.Data.basic.playlist || {};
    const nextPlaylistMap = {
        ...currentPlaylist,
        [category]: { ...(currentPlaylist[category] || {}) }
    };
    if (nextPlaylistMap[category][name]) return;
    nextPlaylistMap[category][name] = url;

    // 3. 서버 저장이 확정된 경우에만 입력란을 비웁니다.
    if (!await DataResource.Data.commitBasicData("playlist", nextPlaylistMap)) return;
    nameInput.value = "";
    urlInput.value = "";
}}).add(
    InputX({ label: "분류", field: "playlistCategory", value: "기본" }),
    InputX({ label: "표시 이름", field: "playlistName", placeholder: "예: 출근길 음악" }),
    InputX({ label: "영상 / 재생목록 주소", field: "playlistUrl", placeholder: "https://www.youtube.com/watch?v=..." }),
    ButtonX({ type: "submit", value: "목록 저장" })
);

export { LoginForm, PlaylistForm };
