import { LoginForm } from "../component/FormBox.js";

const Login = new Fragment("main", 
    $("div", {class: "screenX", style: "padding-top: 15vh;"}).add(
        $("h1", {text: "WELCOME TO HBOX"}),
        $("p", {text: "이메일과 비밀번호를 입력해주세요."}),
        LoginForm
    )
).registAnimation(FragAnimation.fade, 0.5)

export default Login;
