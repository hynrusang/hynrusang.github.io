import { Dynamic } from "../../init/module.js";
import { MemoForm } from "../../component/FormBox.js";
import { HandlerX, ScreenX } from "../../component/XBox.js";
import { DBManagement } from "../../util/Management.js";

const Memo = new Dynamic.Fragment("main", 
    ScreenX("dynamic_memo").add(MemoForm)
).registAction(() => {
    Dynamic.snipe("#dynamic_memo").reset();
    const temp = DBManagement.DB.basic.value("memo");
    temp.forEach((memo, index) => {
        Dynamic.snipe("#dynamic_memo").add(
            HandlerX({
                element: Dynamic.$("pre", {style: "width: 100%; max-height: 300px; white-space: pre-wrap; word-break: break-all; overflow-y: scroll", text: memo}),
                onedit: e => {
                    e.preventDefault();
                    temp[index] = e.target[0].value;
                    if (DBManagement.DB.basic.value("memo", temp)) DBManagement.synchronize();
                    Dynamic.FragMutation.refresh();
                },
                ondelete: () => {
                    if (confirm("정말로 해당 메모를 삭제하시겠습니까?")) {
                        temp.splice(index, 1);
                        DBManagement.DB.basic.value("memo", temp);
                        DBManagement.synchronize();
                        Dynamic.FragMutation.refresh();
                    }
                }
            })
        )
    })
})

export default Memo;