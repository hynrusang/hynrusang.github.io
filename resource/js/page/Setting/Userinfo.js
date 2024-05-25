import { Dynamic } from "../../init/module.js";
import { ButtonX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";

const Userinfo = new Dynamic.Fragment("setting",
    Dynamic.$("div", {class: "screenX", style: "padding-top: 15vh;"}).add(
    Dynamic.$("h1", {text: "계정 설정"}),
        ButtonX({type: "button", value: "로그아웃", onclick: () => DataResource.Auth.logout()}),
        ButtonX({type: "button", value: "비밀번호 변경", onclick: () => DataResource.Auth.changePassword(firebase.auth().currentUser.email)}),
        ButtonX({type: "button", value: "회원 탈퇴", onclick: () => DataResource.Auth.deleteUser()})
    )
).registAnimation(Dynamic.FragAnimation.fade, 0.5)

export default Userinfo;
