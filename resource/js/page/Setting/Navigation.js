import { Dynamic } from "../../init/module.js";
import { ButtonX } from "../../component/XBox.js";
import Userinfo from "./Userinfo.js";
import Link from "../Note/Link.js";
import Player from "../Player.js";

const navigator = [{
    label: "유저 데이터 관련",
    page: Userinfo
}, {
    label: "텍스트 데이터 관련",
    page: Link
}, {
    label: "유튜브 플레이어 관련",
    page: Player
}]

const Navigation = new Dynamic.Fragment("setting", 
    Dynamic.$("div", {id: "dynamic_navigation", class: "screenX", style: "padding-top: 15vh;"})
).registAction(() => {
    Dynamic.snipe("#dynamic_navigation").reset(
        Dynamic.$("h1", {text: "페이지 이동"}),
        navigator.map(navigation => ButtonX({value: navigation.label, onclick: () => Dynamic.FragMutation.mutate(navigation.page)}))
    );
}).registAnimation("fade", 500)

export default Navigation;