import { Dynamic } from "../../init/module.js";
import { ButtonX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";

const Userinfo = new Dynamic.Fragment("setting",
    Dynamic.$("div", { class: "screenX", style: "justify-content: center; align-items: center; padding: clamp(18px, 4vw, 42px);" }).add(
        Dynamic.$("h1", { text: "계정 설정" }),
        Dynamic.$("p", { style: "margin: 10px 0 22px; color: var(--text-soft); text-align: center;", text: "로그인 상태와 계정 보안 작업을 관리합니다." }),
        Dynamic.$("div", { style: "display: grid; gap: 10px; width: min(420px, 100%);" }).add(
            ButtonX({ type: "button", value: "로그아웃", onclick: () => DataResource.Auth.logout() }),
            ButtonX({ type: "button", value: "비밀번호 변경", onclick: () => DataResource.Auth.changePassword(firebase.auth().currentUser.email) }),
            ButtonX({ type: "button", value: "회원 탈퇴", onclick: () => DataResource.Auth.deleteUser() })
        )
    )
).registAnimation("fade", 500)

export default Userinfo;
