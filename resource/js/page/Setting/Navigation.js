import { Dynamic } from "../../init/module.js";
import { resolveIconUrl } from "../../component/XBox.js";
import { MAIN_PAGES } from "../PageCatalog.js";
import Userinfo from "./Userinfo.js";

const PRIVATE_SECTIONS = Object.freeze({
    surface: Object.freeze({
        title: "개인 확장",
        description: "개인 설정과 특수 페이지를 관리합니다."
    }),
    center: Object.freeze({
        title: "공용 데이터 관리",
        description: "권한이 있는 공용 저장 데이터와 관리자 도구를 관리합니다."
    })
});

const privateNavigation = Object.fromEntries(
    Object.keys(PRIVATE_SECTIONS).map(group => [group, []])
);

let activeTab = "main";

/**
 * 확장 모듈의 개인/관리 화면을 Navigation의 Private 탭에 등록합니다.
 * 동일한 group과 id가 다시 등록되면 기존 항목을 교체합니다.
 */
const registerPrivateNavigation = ({
    group = "surface",
    id,
    label,
    description,
    icon = "database",
    page
}) => {
    const entries = privateNavigation[group];
    if (!entries || !label || !page) return false;

    const entryId = id || label;
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
        style: `background-image: url(${resolveIconUrl(item.icon)})`
    }),
    Dynamic.$("span", { class: "navigationCardText" }).add(
        Dynamic.$("strong", { text: item.label }),
        Dynamic.$("small", { text: item.description || "관리 화면으로 이동합니다." })
    )
);

const createNavigationGrid = entries => Dynamic.$("div", { class: "navigationGrid" })
    .add(entries.map(createNavigationCard));

const createMainContent = () => Dynamic.$("div", {
    id: "navigation_main_panel",
    class: "navigationMainContent",
    role: "tabpanel",
    "aria-labelledby": "navigation_tab_main"
}).add(
    createNavigationGrid(MAIN_PAGES),
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

const createPrivateContent = () => Dynamic.$("div", {
    id: "navigation_private_panel",
    class: "navigationPrivateContent",
    role: "tabpanel",
    "aria-labelledby": "navigation_tab_private"
}).add(
    Object.entries(PRIVATE_SECTIONS).flatMap(([group, section]) => {
        const entries = privateNavigation[group];
        if (entries.length === 0) return [];

        return Dynamic.$("section", { class: "navigationSection" }).add(
            Dynamic.$("div", { class: "navigationSectionHeader" }).add(
                Dynamic.$("h2", { text: section.title }),
                Dynamic.$("p", { text: section.description })
            ),
            createNavigationGrid(entries)
        );
    })
);

const hasPrivateEntries = () => Object.values(privateNavigation)
    .some(entries => entries.length > 0);

const Navigation = new Dynamic.Fragment(
    "setting",
    Dynamic.$("div", { id: "dynamic_navigation", class: "screenX" })
).registAction(() => {
    const privateAvailable = hasPrivateEntries();
    if (!privateAvailable) activeTab = "main";

    const contentHost = Dynamic.$("div", { class: "navigationContentHost" });
    const panels = {
        main: createMainContent()
    };
    const tabButtons = {};
    let renderedTab = null;

    if (privateAvailable) panels.private = createPrivateContent();
    contentHost.add(Object.values(panels));

    const renderTab = tab => {
        if (tab === "private" && !privateAvailable) tab = "main";
        if (renderedTab === tab) return;

        activeTab = tab;
        renderedTab = tab;

        Object.entries(tabButtons).forEach(([name, button]) => {
            const selected = name === activeTab;
            button.node.classList.toggle("is-active", selected);
            button.node.setAttribute("aria-selected", selected ? "true" : "false");
            button.node.setAttribute("tabindex", selected ? "0" : "-1");
        });

        Object.entries(panels).forEach(([name, panel]) => {
            const selected = name === activeTab;
            panel.node.hidden = !selected;
            panel.node.setAttribute("aria-hidden", selected ? "false" : "true");
        });
    };

    const pageContent = [
        Dynamic.$("div", { class: "navigationHero" }).add(
            Dynamic.$("h1", { text: "Necronomicon" }),
            Dynamic.$("p", { text: "기본 기능과 개인 확장 화면을 하나의 메뉴에서 전환합니다." })
        )
    ];

    if (privateAvailable) {
        tabButtons.main = Dynamic.$("button", {
            id: "navigation_tab_main",
            class: "navigationTab",
            type: "button",
            role: "tab",
            "aria-controls": "navigation_main_panel",
            onclick: () => renderTab("main"),
            text: "메인"
        });
        tabButtons.private = Dynamic.$("button", {
            id: "navigation_tab_private",
            class: "navigationTab",
            type: "button",
            role: "tab",
            "aria-controls": "navigation_private_panel",
            onclick: () => renderTab("private"),
            text: "Private"
        });

        pageContent.push(
            Dynamic.$("div", {
                class: "navigationTabs",
                role: "tablist",
                "aria-label": "메뉴 분류"
            }).add(tabButtons.main, tabButtons.private)
        );
    }

    pageContent.push(contentHost);
    Dynamic.snipe("#dynamic_navigation").reset(pageContent);
    renderTab(activeTab);
}).registAnimation("fade", 500);

export { registerPrivateNavigation };
export default Navigation;
