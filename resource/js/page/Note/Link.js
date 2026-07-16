import { Dynamic } from "../../init/module.js";
import { LinkForm } from "../../component/FormBox.js";
import { ScreenX, IconX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";
import { pushSnackbar } from "../../util/Tools.js";

// ==========================================
// 1. Link item rendering
// ==========================================

/**
 * @description 링크 편집 필드를 한 줄짜리 압축 입력으로 만들지 않고,
 * 이름과 주소를 각각 독립된 행으로 표시해 긴 URL도 정상적으로 수정할 수 있게 합니다.
 */
const createEditField = (label, name, value, placeholder) => Dynamic.$("label", { class: "inlineEditField" }).add(
    Dynamic.$("span", { text: label }),
    Dynamic.$("input", {
        name,
        value,
        required: "",
        autocomplete: "off",
        spellcheck: "false",
        placeholder
    })
);

/**
 * @description 단일 링크 카드의 읽기/편집 상태를 관리합니다.
 * 저장 성공 전에는 원본 데이터와 정적 링크 화면을 변경하지 않습니다.
 */
const createLinkItem = (key, url, linkMap) => {
    let isEditing = false;
    let item = null;
    const frame = Dynamic.$("div", { class: "handlerContent" });

    const renderStatic = () => {
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

    const renderEditor = () => {
        isEditing = true;
        const editor = Dynamic.$("form", {
            class: "inlineEditForm link-inline-editor",
            autocomplete: "off",
            onsubmit: async event => {
                event.preventDefault();
                const nextKey = event.currentTarget.elements.name.value.trim();
                const nextUrl = event.currentTarget.elements.url.value.trim();

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

                const nextLink = { ...linkMap };
                if (nextKey !== key) delete nextLink[key];
                nextLink[nextKey] = nextUrl;
                await DataResource.Data.commitBasicData("link", nextLink);
            }
        }).add(
            Dynamic.$("div", { class: "inlineEditRow" }).add(
                createEditField("링크 이름", "name", key, "예: 구글"),
                createEditField("링크 주소", "url", url, "https://example.com/")
            ),
            Dynamic.$("div", { class: "inlineEditActions" }).add(
                Dynamic.$("button", { type: "button", class: "inlineEditCancel", text: "취소", onclick: renderStatic }),
                Dynamic.$("button", { type: "submit", class: "inlineEditSubmit", text: "수정 반영" })
            )
        );

        frame.reset(editor);
        requestAnimationFrame(() => {
            editor.node.elements.name.focus();
            item?.node.scrollIntoView({ block: "nearest" });
        });
    };

    renderStatic();
    item = Dynamic.$("div", { class: "handlerX link-handler" }).add(
        frame,
        Dynamic.$("div", { class: "handlerActions" }).add(
            IconX({ icon: "edit", title: "링크 수정", onclick: () => isEditing ? renderStatic() : renderEditor() }),
            IconX({ icon: "delete", title: "링크 삭제", onclick: async () => {
                if (!confirm("정말로 해당 링크를 삭제하시겠습니까?")) return;

                const nextLink = { ...linkMap };
                delete nextLink[key];
                await DataResource.Data.commitBasicData("link", nextLink);
            } })
        )
    );
    return item;
};

// ==========================================
// 2. Link list refresh
// ==========================================

/**
 * @description 링크 목록 영역만 다시 그립니다.
 * Fragment 전체를 refresh하지 않으므로 하단 라우터, 다른 탭, Player iframe에 영향을 주지 않습니다.
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

// ==========================================
// 3. Link page
// ==========================================

const Link = new Dynamic.Fragment("link",
    ScreenX("dynamic_link").add(LinkForm)
).registAction(renderLinkList);

window.addEventListener("basic-data-committed", event => {
    if (event.detail?.key === "link") renderLinkList();
});

export default Link;
