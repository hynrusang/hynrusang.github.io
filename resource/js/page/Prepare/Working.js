import { Dynamic } from "../../init/module.js";

const messageText = Dynamic.$("h1", { id: "loading_text" });

const Randering = new Dynamic.Fragment("rander", 
    Dynamic.$("div", {style: "display: flex; flex-direction: column; height: 100%; justify-content: center; align-items: center;"}).add(
        Dynamic.$("div", {id: "loading_icon"}),
        messageText
    )
).registAction(message => messageText.innerText = message);

export default Randering;
