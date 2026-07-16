import { Dynamic } from "../../init/module.js";
import { ScreenX, IconX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";
import { pushSnackbar } from "../../util/Tools.js";

// ==========================================
// 1. Link input policy
// ==========================================

/**
 * @description Chrome과 비밀번호 관리 확장 프로그램의 자동완성 제안이 편집 UI를 덮지 않도록
 * 링크 페이지의 텍스트 입력에 동일한 비자동완성 정책을 적용합니다.
 */
const createLinkInput = ({ name, value = "", placeholder, label }) => Dynamic.$("input", {
    name,
    value,
    placeholder,
    required: "",
    autocomplete: "new-password",
    autocapitalize: "off",
    spellcheck: "false",
    "aria-label": label,
    "aria-autocomplete": "none",
    "data-lpignore": "true",
    "data-1p-ignore": "true"
});

// ==========================================
// 2. Link list operations
// ==========================================

/**
 * @description 현재 LiveData의 링크 목록만 다시 그립니다.
 * Fragment 전체를 refresh하지 않으므로 다른 화면과 YouTube iframe 상태는 변경되지 않습니다.
 */
const renderLinkList = () => {
    const target = Dynamic.scan("#dynamic_link");
    if (!target) return;

    const linkMap = DataResource.Data.basic.link || {};
    Dynamic.snipe(target).reset(
        Object.keys(linkMap)
            .sort((a, b) => a.localeCompare(b, "ko"))
            .map(key => createLinkItem(key, linkMap[key], linkMap))
    );
};

/**
 * @description 링크 하나의 읽기 화면과 인라인 편집 화면을 만듭니다.
 * 편집 중에는 해당 카드만 교체하며 저장 성공 후에만 목록을 다시 그립니다.
 */
const createLinkItem = (key, url, linkMap) => {
    let isEditing = false;
    const frame = Dynamic.$("div", { class: "handlerContent" });

    /** 읽기 화면에는 실제 anchor를 사용해 브라우저의 새 탭/시크릿 창 메뉴를 그대로 제공합니다. */
    const showLink = () => {
        isEditing = false;
        frame.reset(Dynamic.$("a", {
            class: "link-item-anchor",
            text: key,
            href: url,
            title: url,
            target: "_blank",
            rel: "noopener noreferrer"
        }));
    };

    /** 링크 이름과 주소를 서로 다른 행에서 수정할 수 있는 편집 화면을 엽니다. */
    const showEditor = () => {
        isEditing = true;

        const form = Dynamic.$("form", {
            class: "inlineEditForm link-inline-editor",
            autocomplete: "off",
            onsubmit: async event => {
                event.preventDefault();

                // 1. 편집값을 검증하되 현재 LiveData는 아직 변경하지 않습니다.
                const nextKey = event.currentTarget.elements.linkName.value.trim();
                const nextUrl = event.currentTarget.elements.linkUrl.value.trim();
                if (!nextKey || !nextUrl) {
                    pushSnackbar({ message: "링크 이름과 주소를 모두 입력해 주세요.", type: "error" });
                    return;
                }
                if (nextKey !== key && linkMap[nextKey]) {
                    pushSnackbar({ message: "해당 링크의 이름은 이미 존재합니다.", type: "error" });
                    return;
                }
                if (nextKey === key && nextUrl === url) {
                    pushSnackbar({ message: "수정된 링크가 기존과 동일합니다.", type: "error" });
                    return;
                }

                // 2. 별도 저장본을 만든 뒤 Firestore 저장을 하나의 transaction으로 수행합니다.
                const nextLinkMap = { ...linkMap };
                if (nextKey !== key) delete nextLinkMap[key];
                nextLinkMap[nextKey] = nextUrl;
                if (!await DataResource.Data.commitBasicData("link", nextLinkMap)) return;

                // 3. 저장 성공 후에만 링크 목록 DOM을 갱신합니다.
                renderLinkList();
            }
        }).add(
            Dynamic.$("label", { class: "inlineEditField" }).add(
                Dynamic.$("span", { text: "링크 이름" }),
                createLinkInput({ name: "linkName", value: key, placeholder: "예: 구글", label: "링크 이름" })
            ),
            Dynamic.$("label", { class: "inlineEditField" }).add(
                Dynamic.$("span", { text: "링크 주소" }),
                createLinkInput({ name: "linkUrl", value: url, placeholder: "https://example.com/", label: "링크 주소" })
            ),
            Dynamic.$("div", { class: "inlineEditActions" }).add(
                Dynamic.$("button", { type: "button", class: "inlineEditCancel", text: "취소", onclick: showLink }),
                Dynamic.$("button", { type: "submit", class: "inlineEditSubmit", text: "수정 반영" })
            )
        );

        frame.reset(form);
        requestAnimationFrame(() => form.node.elements.linkName.focus());
    };

    showLink();
    return Dynamic.$("div", { class: "handlerX link-handler" }).add(
        frame,
        Dynamic.$("div", { class: "handlerActions" }).add(
            IconX({ icon: "edit", title: "링크 수정", onclick: () => isEditing ? showLink() : showEditor() }),
            IconX({ icon: "delete", title: "링크 삭제", onclick: async () => {
                if (!confirm("정말로 해당 링크를 삭제하시겠습니까?")) return;

                // 1. 삭제본을 별도 객체로 구성합니다.
                const nextLinkMap = { ...linkMap };
                delete nextLinkMap[key];

                // 2. 저장 성공 후에만 목록에서 항목을 제거합니다.
                if (!await DataResource.Data.commitBasicData("link", nextLinkMap)) return;
                renderLinkList();
            } })
        )
    );
};

// ==========================================
// 3. Link creation form
// ==========================================

/**
 * @description 새 링크를 추가하는 하단 고정 폼입니다.
 * 목록 갱신은 저장 transaction과 분리하여 저장 성공 뒤에 명시적으로 실행합니다.
 */
const LinkForm = Dynamic.$("form", {
    class: "link-create-form",
    autocomplete: "off",
    onsubmit: async event => {
        event.preventDefault();

        // 1. 입력값과 중복 이름을 확인합니다.
        const titleInput = event.currentTarget.elements.linkTitle;
        const urlInput = event.currentTarget.elements.linkAddress;
        const title = titleInput.value.trim();
        const url = urlInput.value.trim();
        const currentLinkMap = DataResource.Data.basic.link || {};
        if (!title || !url) return;
        if (currentLinkMap[title]) {
            pushSnackbar({ message: "해당 링크의 이름은 이미 존재합니다.", type: "error" });
            return;
        }

        // 2. 새 객체를 저장하고 성공한 경우에만 UI와 입력란을 갱신합니다.
        const nextLinkMap = { ...currentLinkMap, [title]: url };
        if (!await DataResource.Data.commitBasicData("link", nextLinkMap)) return;

        renderLinkList();
        titleInput.value = "";
        urlInput.value = "";
    }
}).add(
    Dynamic.$("div", { class: "link-create-row" }).add(
        createLinkInput({ name: "linkTitle", placeholder: "링크 타이틀 · 예: 구글", label: "링크 타이틀" }),
        createLinkInput({ name: "linkAddress", placeholder: "링크 주소 · 예: https://www.google.com/", label: "링크 주소" })
    ),
    Dynamic.$("button", { type: "submit", class: "formApplyButton", text: "링크 주소 반영" })
);

// ==========================================
// 4. Link page
// ==========================================

const Link = new Dynamic.Fragment("link",
    ScreenX("dynamic_link").add(LinkForm)
).registAction(renderLinkList);

export default Link;
