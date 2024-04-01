import { ButtonX } from "../component/XBox.js";
import { AuthManagement } from "../util/Management.js";
import Navigation from "./Navigation.js";

const Auth = new Fragment("main", 
    $("div", {class: "relative_full"}).add(
        $("h1", {text: "계정 설정"}),
        ButtonX({type: "button", value: "로그아웃", onclick: () => AuthManagement.logout()}),
        ButtonX({type: "button", value: "비밀번호 변경", onclick: () => AuthManagement.changePassword(firebase.auth().currentUser.email)}),
        ButtonX({type: "button", value: "회원 탈퇴", onclick: () => AuthManagement.deleteUser()}),
        ButtonX({type: "button", value: "뒤로 가기", onclick: () => Navigation.launch()})
    )
).registAnimation(FragAnimation.fade, 0.5)

export default Auth;