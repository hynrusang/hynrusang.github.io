import { Dynamic } from "../../init/module.js";
import { ButtonX } from "../../component/XBox.js";
import Userinfo from "./Userinfo.js";
import Link from "../Note/Link.js";
import Memo from "../Note/Memo.js";
import Player from "../Player.js";

const navigator = [{
    label: "YouTube 플레이어",
    page: Player
}, {
    label: "링크 라이브러리",
    page: Link
}, {
    label: "메모 보관함",
    page: Memo
}, {
    label: "계정 설정",
    page: Userinfo
}]

const Navigation = new Dynamic.Fragment("setting", 
    Dynamic.$("div", { id: "dynamic_navigation", class: "screenX" })
).registAction(() => {
    Dynamic.snipe("#dynamic_navigation").reset(
        Dynamic.$("h1", { text: "Necronomicon" }),
        Dynamic.$("p", { style: "text-align: center; color: var(--text-soft); margin-bottom: 14px;", text: "저장된 콘텐츠와 플레이어를 빠르게 전환합니다." }),
        navigator.map(navigation => ButtonX({ value: navigation.label, onclick: () => Dynamic.FragMutation.mutate(navigation.page) }))
    );
}).registAnimation("fade", 500)

export default Navigation;
