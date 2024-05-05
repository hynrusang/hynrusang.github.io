import { Dynamic } from "../init/module.js";
import { LoginForm } from "../component/FormBox.js";

const Login = new Dynamic.Fragment("main", 
    Dynamic.$("div", {class: "screenX", style: "padding-top: 15vh;"}).add(
        Dynamic.$("h1", {text: "WELCOME TO HBOX"}),
        Dynamic.$("p", {text: "이메일과 비밀번호를 입력해주세요."}),
        LoginForm
    )
).registAnimation(Dynamic.FragAnimation.fade, 0.5)

export default Login;
