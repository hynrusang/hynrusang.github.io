import { Dynamic } from "../../init/module.js";
import { MemoForm } from "../../component/FormBox.js";
import { HandlerX, ScreenX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";

const Memo = new Dynamic.Fragment("main", 
    ScreenX("dynamic_memo").add(MemoForm)
).registAction(() => {
    Dynamic.snipe("#dynamic_memo").reset();
    const temp = DataResource.Data.basic.memo
    temp.forEach((memo, index) => {
        Dynamic.snipe("#dynamic_memo").add(
            HandlerX({
                element: Dynamic.$("pre", {style: "width: 100%; max-height: 300px; white-space: pre-wrap; word-break: break-all; overflow-y: scroll", text: memo}),
                onedit: e => {
                    e.preventDefault();
                    temp[index] = e.target[0].value;
                    if (DataResource.Data.updateData({key: "memo", value: temp})) DataResource.Data.synchronize();
                    Dynamic.FragMutation.refresh();
                },
                ondelete: () => {
                    if (confirm("정말로 해당 메모를 삭제하시겠습니까?")) {
                        temp.splice(index, 1);
                        if (DataResource.Data.updateData({key: "memo", value: temp})) DataResource.Data.synchronize();
                        Dynamic.FragMutation.refresh();
                    }
                }
            })
        )
    })
})

export default Memo;