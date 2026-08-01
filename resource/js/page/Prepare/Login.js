import { Dynamic } from "../../init/module.js";
import { LoginForm } from "../../component/FormBox.js";

const Login = new Dynamic.Fragment("rander",
    Dynamic.$("div", { class: "screenX centeredScreen" }).add(
        Dynamic.$("h1", { text: "Necronomicon" }),
        Dynamic.$("p", { class: "screenIntro", text: "계정 인증 후 개인 데이터와 플레이어 설정을 동기화합니다." }),
        LoginForm
    )
);

export default Login;
