import { LinkForm } from "../../component/FormBox.js";
import { HandlerX, ScreenX } from "../../component/XBox.js";
import { DBManagement } from "../../util/Management.js";

const Link = new Fragment("main", 
    ScreenX("dynamic_link").add(LinkForm)
).registAction(() => {
    snipe("#dynamic_link").reset();
    const temp = DBManagement.DB.basic.value("link");
    Object.keys(temp).sort().forEach(key => {
        snipe("#dynamic_link").add(
            HandlerX({
                element: $("a", {text: key, href: temp[key], target: "_blank"}),
                onedit: e => {
                    e.preventDefault();
                    temp[e.target[0].value] = temp[key];
                    if (e.target[0].value != key) delete temp[key];
                    if (DBManagement.DB.basic.value("link", temp)) DBManagement.synchronize();
                    FragmentBox.refresh();
                },
                ondelete: () => {
                    if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) {
                        delete temp[key];
                        DBManagement.DB.basic.value("link", temp);
                        DBManagement.synchronize();
                        FragmentBox.refresh();
                    }
                }
            })
        )
    })
})

export default Link;
