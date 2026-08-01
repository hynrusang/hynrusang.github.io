import Link from "./Note/Link.js";
import Memo from "./Note/Memo.js";
import Player from "./Player.js";

/**
 * 메인 화면과 하단 라우터가 공유하는 기본 페이지 목록입니다.
 * 페이지 제목, 설명, 아이콘과 Fragment 참조를 한곳에서 관리합니다.
 */
const MAIN_PAGES = Object.freeze([
    Object.freeze({
        id: "player",
        label: "YouTube Player",
        description: "재생목록과 단일 영상을 재생합니다.",
        icon: "player",
        page: Player
    }),
    Object.freeze({
        id: "link",
        label: "링크 라이브러리",
        description: "자주 쓰는 외부 링크를 한 줄 카드로 정리합니다.",
        icon: "link",
        page: Link
    }),
    Object.freeze({
        id: "memo",
        label: "메모 보관함",
        description: "짧은 텍스트와 작업 메모를 빠르게 저장합니다.",
        icon: "memo",
        page: Memo
    })
]);

const MAIN_ROUTER_RIDS = Object.freeze([
    "main",
    "setting",
    ...MAIN_PAGES.map(({ id }) => id)
]);

export { MAIN_PAGES, MAIN_ROUTER_RIDS };
