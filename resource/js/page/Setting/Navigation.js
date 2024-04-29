
import { ButtonX } from "../../component/XBox.js";
import { DBManagement } from "../../util/Management.js";

const Navigation = new Fragment("setting", 
    $("div", {id: "dynamic_navigation", class: "screenX", style: "padding-top: 15vh;"})
).registAction(() => {
    snipe("#dynamic_navigation").reset($("h1", {text: "페이지 이동"}),);
    for (let navigation of Object.values(DBManagement.navigator)) {
        snipe("#dynamic_navigation").add(
            ButtonX({value: navigation.label, onclick: () => FragmentBox.toggle(navigation.page)})
        )
    }
}).registAnimation(FragAnimation.fade, 0.5)

export default Navigation;
