import { Dynamic } from "../init/module.js";
import DataResource from "../util/DataResource.js";
import { ButtonX, InputX } from "./XBox.js";

const LoginForm = Dynamic.$("form", {class: "formBox", onsubmit: e => {
    e.preventDefault();
    DataResource.Auth.authenticate(e.target[0].value, e.target[1].value);
}}).add(
    InputX({label: "email", placeholder: "Enter your Email.", oninput: e => {
        const preValue = e.target.preValue ??  "";
        if (preValue.includes("@") && preValue.indexOf("@") == preValue.length - 1) {
            switch (e.data) {
                case "g":
                    e.target.value += "mail.com";
                    break;
                case "n":
                    e.target.value += "aver.com";
                    break;
                case "d":
                    e.target.value += "aum.net";
                    break;
            }
        }
        e.target.preValue = e.target.value;
    }}),
    InputX({label: "password", type:"password", placeholder: "Enter your Password."}),
    ButtonX({label: "login / register", type: "submit", value: "로그인 / 회원가입"}),
    ButtonX({label: "find password", type: "button", value: "비밀번호 초기화", onclick: () => DataResource.Auth.changePassword(Dynamic.scan("form")[0].value)})
)
const MemoForm = Dynamic.$("form", {class: "memo-create-form", onsubmit: async e => {
    e.preventDefault();
    const memo = e.target[0];
    const value = memo.value.trim();
    if (!value) return;

    const nextMemo = DataResource.Data.basic.memo;
    nextMemo.unshift(value);
    if (!await DataResource.Data.commitBasicData("memo", nextMemo)) return;

    Dynamic.FragMutation.refresh();
    memo.value = "";
}}).add(
    Dynamic.$("textarea", {required: null, class: "memo-create-input", placeholder: "메모 내용"}),
    Dynamic.$("button", {type: "submit", class: "formApplyButton", text: "작성"})
)
const LinkForm = Dynamic.$("form", {class: "link-create-form", onsubmit: async e => {
    e.preventDefault();
    const [titleInput, urlInput] = [e.target[0], e.target[1]];
    const title = titleInput.value.trim();
    const url = urlInput.value.trim();
    if (!title || !url) return;

    const nextLink = DataResource.Data.basic.link;
    nextLink[title] = url;
    if (!await DataResource.Data.commitBasicData("link", nextLink)) return;

    Dynamic.FragMutation.refresh();
    titleInput.value = "";
    urlInput.value = "";
}}).add(
    Dynamic.$("div", {class: "link-create-row"}).add(
        Dynamic.$("input", {required: "", placeholder: "링크 타이틀 · 예: 구글"}),
        Dynamic.$("input", {required: "", placeholder: "링크 주소 · 예: https://www.google.com/"})
    ),
    Dynamic.$("button", {type: "submit", class: "formApplyButton", text: "링크 주소 반영"})
)
const PlaylistForm = Dynamic.$("form", {class: "playlist-create-form", onsubmit: async e => {
    e.preventDefault();
    const [categoryInput, nameInput, urlInput] = e.currentTarget.elements;
    const category = categoryInput.value.trim();
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();

    if (!category || !name || !url) return;

    const nextPlaylistMap = DataResource.Data.basic.playlist;
    nextPlaylistMap[category] ||= {};
    if (nextPlaylistMap[category][name]) return;

    nextPlaylistMap[category][name] = url;
    if (!await DataResource.Data.commitBasicData("playlist", nextPlaylistMap)) return;

    nameInput.value = "";
    urlInput.value = "";
}}).add(
    InputX({label: "분류", value: "기본"}),
    InputX({label: "표시 이름", placeholder: "예: 출근길 음악"}),
    InputX({label: "영상 / 재생목록 주소", placeholder: "https://www.youtube.com/watch?v=..."}),
    ButtonX({type: "submit", value: "목록 저장"})
)

export { LoginForm, MemoForm, LinkForm, PlaylistForm }
