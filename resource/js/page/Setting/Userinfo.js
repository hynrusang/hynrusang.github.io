import { ButtonX } from "../../component/XBox.js";
import { AuthManagement } from "../../util/Management.js";

const Userinfo = new Fragment("setting",
    $("div", {class: "screenX", style: "padding-top: 15vh;"}).add(
        $("h1", {text: "계정 설정"}),
        ButtonX({type: "button", value: "로그아웃", onclick: () => AuthManagement.logout()}),
        ButtonX({type: "button", value: "비밀번호 변경", onclick: () => AuthManagement.changePassword(firebase.auth().currentUser.email)}),
        ButtonX({type: "button", value: "회원 탈퇴", onclick: () => AuthManagement.deleteUser()})
    )
).registAnimation(FragAnimation.fade, 0.5)

export default Userinfo;
