import { Dynamic } from "../../init/module.js";
import Userinfo from "./Userinfo.js";
import Link from "../Note/Link.js";
import Memo from "../Note/Memo.js";
import Player from "../Player.js";

// ==========================================
// 1. Navigation entries
// ==========================================

const mainNavigation = [{
    label: "YouTube Player",
    description: "재생목록과 단일 영상을 재생합니다.",
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
}];

const privateNavigation = {
    surface: [],
    center: []
};

let activeTab = "main";

const iconUrl = icon => icon?.includes("http")
    ? `https://www.google.com/s2/favicons?domain=${icon}`
    : `/resource/img/icon/${icon || "database"}.png`;

/**
 * @description 확장 모듈의 개인/관리 화면을 메인 Navigation의 Private 탭에 등록합니다.
 * 같은 group과 id로 다시 등록하면 중복 추가하지 않고 기존 항목을 교체합니다.
 */
const registerPrivateNavigation = ({ group = "surface", id, label, description, icon = "database", page }) => {
    if (!privateNavigation[group] || !label || !page) return false;

    const entryId = id || label;
    const entries = privateNavigation[group];
    const nextEntry = { id: entryId, label, description, icon, page };
    const previousIndex = entries.findIndex(entry => entry.id === entryId);

    if (previousIndex < 0) entries.push(nextEntry);
    else entries[previousIndex] = nextEntry;

    return true;
};

const createNavigationCard = item => Dynamic.$("button", {
    class: "navigationCard",
    type: "button",
    onclick: () => Dynamic.FragMutation.mutate(item.page)
}).add(
    Dynamic.$("span", {
        class: "navigationCardIcon",
        style: `background-image: url(${iconUrl(item.icon)})`
    }),
    Dynamic.$("span", { class: "navigationCardText" }).add(
        Dynamic.$("strong", { text: item.label }),
        Dynamic.$("small", { text: item.description || "관리 화면으로 이동합니다." })
    )
);

const createNavigationGrid = entries => Dynamic.$("div", { class: "navigationGrid" })
    .add(entries.map(createNavigationCard));

const createPrivateSection = ({ title, description, entries }) => {
    if (entries.length === 0) return null;

    return Dynamic.$("section", { class: "navigationSection" }).add(
        Dynamic.$("div", { class: "navigationSectionHeader" }).add(
            Dynamic.$("h2", { text: title }),
            Dynamic.$("p", { text: description })
        ),
        createNavigationGrid(entries)
    );
};

const selectTab = tab => {
    if (activeTab === tab) return;
    activeTab = tab;
    Dynamic.FragMutation.refresh();
};

// ==========================================
// 2. Unified navigation page
// ==========================================

const Navigation = new Dynamic.Fragment("setting",
    Dynamic.$("div", { id: "dynamic_navigation", class: "screenX" })
).registAction(() => {
    const hasPrivateNavigation = privateNavigation.surface.length > 0 || privateNavigation.center.length > 0;
    if (!hasPrivateNavigation) activeTab = "main";

    const privateSections = [{
        title: "개인 확장",
        description: "개인 설정과 특수 페이지를 관리합니다.",
        entries: privateNavigation.surface
    }, {
        title: "공용 데이터 관리",
        description: "권한이 있는 공용 저장 데이터와 관리자 도구를 관리합니다.",
        entries: privateNavigation.center
    }].map(createPrivateSection).filter(Boolean);

    const content = activeTab === "private"
        ? Dynamic.$("div", { class: "navigationPrivateContent" }).add(privateSections)
        : Dynamic.$("div", { class: "navigationMainContent" }).add(
            createNavigationGrid(mainNavigation),
            Dynamic.$("div", { class: "navigationAccount" }).add(
                Dynamic.$("button", {
                    class: "navigationAccountButton",
                    type: "button",
                    onclick: () => Dynamic.FragMutation.mutate(Userinfo)
                }).add(
                    Dynamic.$("strong", { text: "계정 설정" }),
                    Dynamic.$("span", { text: "로그아웃, 비밀번호 변경, 계정 삭제" })
                )
            )
        );

    const pageContent = [
        Dynamic.$("div", { class: "navigationHero" }).add(
            Dynamic.$("h1", { text: "Necronomicon" }),
            Dynamic.$("p", { text: "기본 기능과 개인 확장 화면을 하나의 메뉴에서 전환합니다." })
        )
    ];

    if (hasPrivateNavigation) pageContent.push(
        Dynamic.$("div", { class: "navigationTabs", role: "tablist", "aria-label": "메뉴 분류" }).add(
            Dynamic.$("button", {
                class: `navigationTab${activeTab === "main" ? " is-active" : ""}`,
                type: "button",
                role: "tab",
                "aria-selected": activeTab === "main" ? "true" : "false",
                onclick: () => selectTab("main"),
                text: "메인"
            }),
            Dynamic.$("button", {
                class: `navigationTab${activeTab === "private" ? " is-active" : ""}`,
                type: "button",
                role: "tab",
                "aria-selected": activeTab === "private" ? "true" : "false",
                onclick: () => selectTab("private"),
                text: "Private"
            })
        )
    );

    pageContent.push(content);
    Dynamic.snipe("#dynamic_navigation").reset(pageContent);
}).registAnimation("fade", 500);

export { registerPrivateNavigation };
export default Navigation;
