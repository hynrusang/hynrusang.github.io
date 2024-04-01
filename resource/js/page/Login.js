import { LoginForm } from "../component/FormBox.js";

const Login = new Fragment("main", 
    $("div", {class: "relative_full"}).add(
        $("h1", {text: "WELCOME BACK"}),
        $("p", {text: "HBox에 오신 것을 환영합니다."}),
        LoginForm
    )
).registAnimation(FragAnimation.fade, 0.5)

export default Login;