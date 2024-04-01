import { ButtonX } from "../component/XBox.js";
import { DBManagement } from "../util/Management.js";

const Navigation = new Fragment("main", 
    $("div", {id: "dynamic_navigation", class: "relative_full"})
).registAction(() => {
    snipe("#dynamic_navigation").reset($("h1", {text: "페이지 이동"}),);
    for (let navigation of Object.values(DBManagement.navigator)) {
        snipe("#dynamic_navigation").add(
            ButtonX({value: navigation.label, onclick: () => DBManagement.delegatePageMove({
                page: navigation.page,
                router: navigation.router
            })})
        )
    }
}).registAnimation(FragAnimation.fade, 0.5)

export default Navigation;