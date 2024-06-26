import { Dynamic } from "../../init/module.js";
import { ButtonX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";

const Navigation = new Dynamic.Fragment("setting", 
    Dynamic.$("div", {id: "dynamic_navigation", class: "screenX", style: "padding-top: 15vh;"})
).registAction(() => {
    Dynamic.snipe("#dynamic_navigation").reset(Dynamic.$("h1", {text: "페이지 이동"}),);
    for (let navigation of Object.values(DataResource.Data.navigator)) {
        Dynamic.snipe("#dynamic_navigation").add(
            ButtonX({value: navigation.label, onclick: () => Dynamic.FragMutation.mutate(navigation.page)})
        )
    }
}).registAnimation(Dynamic.FragAnimation.fade, 500)

export default Navigation;
