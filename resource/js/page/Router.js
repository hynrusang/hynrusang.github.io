import { Dynamic } from "../init/module.js";
import { IconX } from "../component/XBox.js";
import Link from "./Note/Link.js";
import Memo from "./Note/Memo.js";
import Player from "./Player.js";
import Navigation from "./Setting/Navigation.js";

// ==========================================
// 1. Main page router
// ==========================================

/**
 * @description Player, Link, Memo를 동일한 하단 라우터 그룹에서 직접 전환합니다.
 * 각 페이지는 서로 다른 Fragment rid를 사용하므로 페이지 전환 중에도 기존 DOM과 스크롤,
 * 특히 YouTube iframe 인스턴스가 파괴되지 않습니다.
 */
const MainRouter = [
    IconX({ icon: "navigator", title: "전체 메뉴", onclick: () => Dynamic.FragMutation.mutate(Navigation) }),
    IconX({ icon: "link", title: "링크 라이브러리", onclick: () => Dynamic.FragMutation.mutate(Link) }),
    IconX({ icon: "memo", title: "메모 보관함", onclick: () => Dynamic.FragMutation.mutate(Memo) })
];

export { MainRouter };
