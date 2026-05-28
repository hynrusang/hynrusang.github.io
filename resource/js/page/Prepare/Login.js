import { Dynamic } from "../../init/module.js";
import { LoginForm } from "../../component/FormBox.js";

const Login = new Dynamic.Fragment("rander", 
    Dynamic.$("div", { class: "screenX", style: "justify-content: center; align-items: center; padding: clamp(18px, 4vw, 42px);" }).add(
        Dynamic.$("h1", { text: "Necronomicon" }),
        Dynamic.$("p", { style: "margin: 10px 0 22px; color: var(--text-soft); text-align: center;", text: "계정 인증 후 개인 데이터와 플레이어 설정을 동기화합니다." }),
        LoginForm
    )
)

export default Login;
