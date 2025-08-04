import { Dynamic } from "../../init/module.js";

const message = Dynamic.$("h1", { id: "loading_text" });

const Randering = new Dynamic.Fragment("rander", 
    Dynamic.$("div", {style: "display: flex; flex-direction: column; height: 100%; justify-content: center; align-items: center;"}).add(
        Dynamic.$("div", {id: "loading_icon"}),
        message
    )
).registAction(message => message.innerText = message);

export default Randering;
