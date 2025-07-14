import { Dynamic } from "../../init/module.js";

const Randering = new Dynamic.Fragment("rander", 
    Dynamic.$("div", {style: "display: flex; flex-direction: column; height: 100%; justify-content: center; align-items: center;"}).add(
        Dynamic.$("div", {id: "loading_icon"}),
        Dynamic.$("h1", {id: "loading_text"})
    )
).registAction(message => Dynamic.scan("#loading_text").innerText = message);

export default Randering;
