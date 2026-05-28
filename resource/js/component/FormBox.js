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
const MemoForm = Dynamic.$("form", {class: "memo-create-form", onsubmit: e => {
    e.preventDefault();
    const memo = e.target[0];
    const temp = DataResource.Data.basic.memo;
    if (!memo.value.trim()) return;
    temp.unshift(memo.value);
    if (DataResource.Data.updateData("memo", temp)) DataResource.Data.synchronize();
    Dynamic.FragMutation.refresh();
    memo.value = ""
}}).add(
    Dynamic.$("textarea", {required: null, class: "memo-create-input", placeholder: "메모 내용"}),
    Dynamic.$("button", {type: "submit", class: "formApplyButton", text: "작성"})
)
const LinkForm = Dynamic.$("form", {class: "link-create-form", onsubmit: e => {
    e.preventDefault();
    const [title, url] = [e.target[0], e.target[1]]
    const temp = DataResource.Data.basic.link;
    if (!title.value.trim() || !url.value.trim()) return;
    temp[title.value.trim()] = url.value.trim();
    if (DataResource.Data.updateData("link", temp)) DataResource.Data.synchronize();
    Dynamic.FragMutation.refresh();
    title.value = "";
    url.value = "";
}}).add(
    Dynamic.$("div", {class: "link-create-row"}).add(
        Dynamic.$("input", {required: "", placeholder: "링크 타이틀 · 예: 구글"}),
        Dynamic.$("input", {required: "", placeholder: "링크 주소 · 예: https://www.google.com/"})
    ),
    Dynamic.$("button", {type: "submit", class: "formApplyButton", text: "링크 주소 반영"})
)
const PlaylistForm = Dynamic.$("form", {style: "display: flex; width: 100%; height: 150px", onsubmit: e => {
    e.preventDefault();
    const [title, url] = [e.target[0], e.target[1]];
    const temp = DataResource.Data.basic.playlist
    if (!temp[title.value]) temp[title.value] = {};
    temp[title.value][url.value] = url.value;
    if (DataResource.Data.updateData("playlist", temp)) DataResource.Data.synchronize();
    Dynamic.FragMutation.refresh();
    url.value = "";
}}).add(
    Dynamic.$("div", {style: "display: flex; flex-direction: column; width: 100%;"}).add(
        InputX({label: "큰 타이틀", value: "기본"}),
        InputX({label: "영상 / 재생목록 주소", placeholder: "ex) https://www.youtube.com/watch?v=2S-2sGr5rLA&list=PLQzehMJO2R3UKOevs0VypnMS9iD8rwKhx"})
    ),
    ButtonX({type: "submit", value: "작성"})
)

export { LoginForm, MemoForm, LinkForm, PlaylistForm }
