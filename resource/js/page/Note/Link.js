import { Dynamic } from "../../init/module.js";
import { LinkForm } from "../../component/FormBox.js";
import { HandlerContainerX, HandlerX, ScreenX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";
import { pushSnackbar } from "../../util/Tools.js";

const Link = new Dynamic.Fragment("main", 
    ScreenX("dynamic_link").add(LinkForm)
).registAction(() => {
    const temp = DataResource.Data.basic.link;
    Dynamic.snipe("#dynamic_link").reset(Object.keys(temp).sort().map(key => HandlerContainerX(
        HandlerX({
            element: Dynamic.$("h4", {text: key}),
            onedit: e => {
                e.preventDefault();
                if (temp[e.target[0].value]) {
                    pushSnackbar({message: "해당 링크의 이름은 이미 존재합니다.", type: "error"})
                    return;
                }
                temp[e.target[0].value] = temp[key];
                delete temp[key];
                DataResource.Data.updateData("link", temp);
                DataResource.Data.synchronize();
                Dynamic.FragMutation.refresh();
            },
            ondelete: () => {
                if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) {
                    delete temp[key];
                    DataResource.Data.updateData("link", temp);
                    DataResource.Data.synchronize();
                    Dynamic.FragMutation.refresh();
                }
            }
        }),
        HandlerX({
            element: Dynamic.$("a", {text: key, href: temp[key], target: "_blank"}),
            onedit: e => {
                e.preventDefault();
                if (temp[key] == e.target[0].value) {
                    pushSnackbar({message: "수정된 링크의 주소가 기존과 동일합니다.", type: "error"})
                    return;
                }
                temp[key] = e.target[0].value
                DataResource.Data.updateData("link", temp);
                DataResource.Data.synchronize();
                Dynamic.FragMutation.refresh();
            },
            ondelete: () => {
                if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) {
                    delete temp[key];
                    DataResource.Data.updateData("link", temp);
                    DataResource.Data.synchronize();
                    Dynamic.FragMutation.refresh();
                }
            },
            editFrom: "href"
        })
    )));
})

export default Link;
