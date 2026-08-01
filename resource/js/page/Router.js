import { Dynamic } from "../init/module.js";
import { IconX } from "../component/XBox.js";
import Navigation from "./Setting/Navigation.js";
import { MAIN_PAGES } from "./PageCatalog.js";

/**
 * 기본 페이지는 서로 다른 Fragment rid를 유지하면서 동일한 하단 라우터를 공유합니다.
 * 따라서 화면을 전환해도 숨겨진 Fragment DOM과 YouTube iframe 상태가 보존됩니다.
 */
const MainRouter = [
    IconX({
        icon: "navigator",
        title: "전체 메뉴",
        onclick: () => Dynamic.FragMutation.mutate(Navigation)
    }),
    ...MAIN_PAGES.map(({ icon, label, page }) => IconX({
        icon,
        title: label,
        onclick: () => Dynamic.FragMutation.mutate(page)
    }))
];

export { MainRouter };
