import { Dynamic } from "../../init/module.js";
import { LinkForm } from "../../component/FormBox.js";
import { HandlerX, ScreenX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";
import { pushSnackbar } from "../../util/Tools.js";

const Link = new Dynamic.Fragment("main", 
    ScreenX("dynamic_link").add(LinkForm)
).registAction(() => {
    const temp = DataResource.Data.basic.link;
    Dynamic.snipe("#dynamic_link").reset(Object.keys(temp).sort().map(key => HandlerX({
        element: Dynamic.$("a", { class: "link-item-anchor", text: key, href: temp[key], title: temp[key], target: "_blank" }),
        onedit: e => {
            e.preventDefault();
            const nextKey = e.target[0].value.trim();
            if (!nextKey) {
                pushSnackbar({ message: "링크 이름을 입력해 주세요.", type: "error" });
                return;
            }
            if (nextKey === key) {
                pushSnackbar({ message: "수정된 링크의 이름이 기존과 동일합니다.", type: "error" });
                return;
            }
            if (temp[nextKey]) {
                pushSnackbar({ message: "해당 링크의 이름은 이미 존재합니다.", type: "error" });
                return;
            }
            temp[nextKey] = temp[key];
            delete temp[key];
            DataResource.Data.updateData("link", temp);
            DataResource.Data.synchronize();
            Dynamic.FragMutation.refresh();
        },
        ondelete: () => {
            if (!confirm("정말로 해당 링크를 삭제하시겠습니까?")) return;
            delete temp[key];
            DataResource.Data.updateData("link", temp);
            DataResource.Data.synchronize();
            Dynamic.FragMutation.refresh();
        }
    })));
})

export default Link;
