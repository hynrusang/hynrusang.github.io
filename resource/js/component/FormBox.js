import { InputX } from "./XBox.js";

const LoginForm = $("form", {}).add(
    InputX({label: "email", placeholder: "Enter your Email."}),
    InputX({label: "password", placeholder: "Enter your Password."}),
    $("input", {type: "submit", value: "로그인 / 회원가입"}),
    $("input", {type: "button", value: "비밀번호 초기화"})
)

export { LoginForm }