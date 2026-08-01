import { Dynamic } from "../../init/module.js";
import { ButtonX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";

const Userinfo = new Dynamic.Fragment("setting",
    Dynamic.$("div", { class: "screenX centeredScreen" }).add(
        Dynamic.$("h1", { text: "계정 설정" }),
        Dynamic.$("p", { class: "screenIntro", text: "로그인 상태와 계정 보안 작업을 관리합니다." }),
        Dynamic.$("div", { class: "accountActions" }).add(
            ButtonX({ type: "button", value: "로그아웃", onclick: () => DataResource.Auth.logout() }),
            ButtonX({ type: "button", value: "비밀번호 변경", onclick: () => DataResource.Auth.changePassword(firebase.auth().currentUser.email) }),
            ButtonX({ type: "button", value: "회원 탈퇴", onclick: () => DataResource.Auth.deleteUser() })
        )
    )
).registAnimation("fade", 500);

export default Userinfo;
