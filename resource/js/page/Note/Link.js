import { Dynamic } from "../../init/module.js";
import { LinkForm } from "../../component/FormBox.js";
import { ScreenX, IconX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";
import { pushSnackbar } from "../../util/Tools.js";

const createLinkItem = (key, url, temp) => {
    let isEditing = false;
    const frame = Dynamic.$("div", { class: "handlerContent" });
    const renderStatic = () => frame.reset(Dynamic.$("a", {
        class: "link-item-anchor",
        text: key,
        href: url,
        title: url,
        target: "_blank"
    }));
    const renderEditor = () => frame.reset(Dynamic.$("form", { class: "inlineEditForm link-inline-editor", onsubmit: async e => {
        e.preventDefault();
        const nextKey = e.target[0].value.trim();
        const nextUrl = e.target[1].value.trim();

        if (!nextKey || !nextUrl) {
            pushSnackbar({ message: "링크 이름과 주소를 모두 입력해 주세요.", type: "error" });
            return;
        }
        if (nextKey !== key && temp[nextKey]) {
            pushSnackbar({ message: "해당 링크의 이름은 이미 존재합니다.", type: "error" });
            return;
        }
        if (nextKey === key && nextUrl === url) {
            pushSnackbar({ message: "수정된 링크가 기존과 동일합니다.", type: "error" });
            return;
        }

        const nextLink = { ...temp };
        if (nextKey !== key) delete nextLink[key];
        nextLink[nextKey] = nextUrl;
        if (await DataResource.Data.commitBasicData("link", nextLink)) Dynamic.FragMutation.refresh();
    }}).add(
        Dynamic.$("div", { class: "inlineEditRow" }).add(
            Dynamic.$("input", { required: "", value: key, placeholder: "링크 타이틀" }),
            Dynamic.$("input", { required: "", value: url, placeholder: "링크 주소" })
        ),
        Dynamic.$("button", { type: "submit", class: "inlineEditSubmit", text: "링크 주소 반영" })
    ));

    renderStatic();
    return Dynamic.$("div", { class: "handlerX link-handler" }).add(
        frame,
        Dynamic.$("div", { class: "handlerActions" }).add(
            IconX({ icon: "edit", onclick: () => {
                isEditing = !isEditing;
                isEditing ? renderEditor() : renderStatic();
            }}),
            IconX({ icon: "delete", onclick: async () => {
                if (!confirm("정말로 해당 링크를 삭제하시겠습니까?")) return;

                const nextLink = { ...temp };
                delete nextLink[key];
                if (await DataResource.Data.commitBasicData("link", nextLink)) Dynamic.FragMutation.refresh();
            }})
        )
    );
}

const Link = new Dynamic.Fragment("main", 
    ScreenX("dynamic_link").add(LinkForm)
).registAction(() => {
    const temp = DataResource.Data.basic.link;
    Dynamic.snipe("#dynamic_link").reset(Object.keys(temp).sort().map(key => createLinkItem(key, temp[key], temp)));
})

export default Link;
