import { AuthManagement, DBManagement } from "../util/Management.js";
import { ButtonX, InputX } from "./XBox.js";

const LoginForm = $("form", {class: "formBox", onsubmit: e => {
    e.preventDefault();
    const [email, password] = [e.target[0], e.target[1]];
    AuthManagement.login(email.value, password.value)
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
    ButtonX({label: "find password", type: "button", value: "비밀번호 초기화", onclick: () => AuthManagement.changePassword(scan("form")[0].value)})
)
const MemoForm = $("form", {style: "display: flex; width: 100%; height: 150px;", onsubmit: e => {
    e.preventDefault();
    const memo = e.target[0];
    const temp = DBManagement.DB.basic.value("memo");
    temp.unshift(memo.value);
    DBManagement.DB.basic.value("memo", temp);
    DBManagement.synchronize();
    FragmentBox.refresh();
    memo.value = ""
}}).add(
    $("textarea", {required: null, style: "width: 100%;"}),
    ButtonX({type: "submit", value: "작성"})
)
const LinkForm = $("form", {style: "display: flex; width: 100%; height: 150px", onsubmit: e => {
    e.preventDefault();
    const [title, url] = [e.target[0], e.target[1]]
    const temp = DBManagement.DB.basic.value("link");
    temp[title.value] = url.value;
    if (DBManagement.DB.basic.value("link", temp)) DBManagement.synchronize();
    FragmentBox.refresh();
    title.value = "";
    url.value = "";
}}).add(
    $("div", {style: "display: flex; flex-direction: column; width: 100%;"}).add(
        InputX({label: "링크 타이틀", placeholder: "ex) 구글"}),
        InputX({label: "링크 주소", placeholder: "ex) https://www.google.com/"})
    ),
    ButtonX({type: "submit", value: "작성"})
)
const PlaylistForm = $("form", {style: "display: flex; width: 100%; height: 150px", onsubmit: e => {
    e.preventDefault();
    const [title, url] = [e.target[0], e.target[1]];
    const temp = DBManagement.DB.basic.value("playlist");
    if (!temp[title.value]) temp[title.value] = {};
    temp[title.value][url.value] = url.value;
    if (DBManagement.DB.basic.value("playlist", temp)) DBManagement.synchronize();
    FragmentBox.refresh();
    url.value = "";
}}).add(
    $("div", {style: "display: flex; flex-direction: column; width: 100%;"}).add(
        InputX({label: "큰 타이틀", value: "기본"}),
        InputX({label: "영상 / 재생목록 주소", placeholder: "ex) https://www.youtube.com/watch?v=2S-2sGr5rLA&list=PLQzehMJO2R3UKOevs0VypnMS9iD8rwKhx"})
    ),
    ButtonX({type: "submit", value: "작성"})
)

export { LoginForm, MemoForm, LinkForm, PlaylistForm }
