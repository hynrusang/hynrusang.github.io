import { Dynamic } from "../init/module.js";
import DataResource from "../util/DataResource.js";
import { ButtonX, InputX } from "./XBox.js";

// ==========================================
// 1. Authentication form
// ==========================================

const LoginForm = Dynamic.$("form", { class: "formBox", autocomplete: "off", onsubmit: event => {
    event.preventDefault();
    const email = event.currentTarget.querySelector('[data-field="loginEmail"]').value;
    const password = event.currentTarget.querySelector('[data-field="loginPassword"]').value;
    DataResource.Auth.authenticate(email, password);
}}).add(
    InputX({ label: "email", field: "loginEmail", placeholder: "Enter your Email.", oninput: event => {
        const preValue = event.target.preValue ?? "";
        if (preValue.includes("@") && preValue.indexOf("@") === preValue.length - 1) {
            switch (event.data) {
                case "g":
                    event.target.value += "mail.com";
                    break;
                case "n":
                    event.target.value += "aver.com";
                    break;
                case "d":
                    event.target.value += "aum.net";
                    break;
            }
        }
        event.target.preValue = event.target.value;
    } }),
    InputX({ label: "password", field: "loginPassword", type: "password", placeholder: "Enter your Password." }),
    ButtonX({ label: "login / register", type: "submit", value: "로그인 / 회원가입" }),
    ButtonX({ label: "find password", type: "button", value: "비밀번호 초기화", onclick: event => DataResource.Auth.changePassword(event.currentTarget.closest("form").querySelector('[data-field="loginEmail"]').value) })
);

export { LoginForm };
