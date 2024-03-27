import { LoginForm } from "../component/FormBox.js";

const Login = new Fragment("main", 
    $("div", {class: "form"}).add(
        $("h1", {text: "WELCOME BACK"}),
        $("p", {text: "HBox에 오신 것을 환영합니다."}),
        LoginForm
    )
)

export default Login;