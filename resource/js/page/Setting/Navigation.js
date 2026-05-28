import { Dynamic } from "../../init/module.js";
import Userinfo from "./Userinfo.js";
import Link from "../Note/Link.js";
import Memo from "../Note/Memo.js";
import Player from "../Player.js";

const navigator = [{
    label: "YouTube Player",
    description: "재생목록과 단일 영상을 6개 윈도우 재생 구조로 실행합니다.",
    icon: "player",
    page: Player
}, {
    label: "링크 라이브러리",
    description: "자주 쓰는 외부 링크를 한 줄 카드로 정리합니다.",
    icon: "link",
    page: Link
}, {
    label: "메모 보관함",
    description: "짧은 텍스트와 작업 메모를 빠르게 저장합니다.",
    icon: "memo",
    page: Memo
}]

const Navigation = new Dynamic.Fragment("setting", 
    Dynamic.$("div", { id: "dynamic_navigation", class: "screenX" })
).registAction(() => {
    Dynamic.snipe("#dynamic_navigation").reset(
        Dynamic.$("div", { class: "navigationHero" }).add(
            Dynamic.$("h1", { text: "Necronomicon" }),
            Dynamic.$("p", { text: "플레이어, 링크, 메모를 하나의 작업 메뉴에서 전환합니다." })
        ),
        Dynamic.$("div", { class: "navigationGrid" }).add(navigator.map(item => Dynamic.$("button", {
            class: "navigationCard",
            type: "button",
            onclick: () => Dynamic.FragMutation.mutate(item.page, null, true)
        }).add(
            Dynamic.$("span", { class: "navigationCardIcon", style: `background-image: url(/resource/img/icon/${item.icon}.png)` }),
            Dynamic.$("span", { class: "navigationCardText" }).add(
                Dynamic.$("strong", { text: item.label }),
                Dynamic.$("small", { text: item.description })
            )
        ))),
        Dynamic.$("div", { class: "navigationAccount" }).add(
            Dynamic.$("button", { class: "navigationAccountButton", type: "button", onclick: () => Dynamic.FragMutation.mutate(Userinfo) }).add(
                Dynamic.$("strong", { text: "계정 설정" }),
                Dynamic.$("span", { text: "로그아웃, 비밀번호 변경, 계정 삭제" })
            )
        )
    );
}).registAnimation("fade", 500)

export default Navigation;
