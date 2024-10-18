import { Dynamic } from "../../init/module.js";
import { MemoForm } from "../../component/FormBox.js";
import { HandlerX, ScreenX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";
import { pushSnackbar } from "../../util/Tools.js";

const Memo = new Dynamic.Fragment("main", 
    ScreenX("dynamic_memo").add(MemoForm)
).registAction(() => {
    const temp = DataResource.Data.basic.memo;
    Dynamic.snipe("#dynamic_memo").reset(temp.map((memo, index) => HandlerX({
        element: Dynamic.$("pre", {style: "width: 100%; max-height: 300px; white-space: pre-wrap; word-break: break-all; overflow-y: scroll", text: memo}),
        onedit: e => {
            e.preventDefault();
            if (temp[index] == e.target[0].value) {
                pushSnackbar({message: "수정된 메모가 기존과 동일합니다.", type: "error"});
                return;
            }
            temp[index] = e.target[0].value;
            DataResource.Data.updateData("memo", temp);
            DataResource.Data.synchronize();
            Dynamic.FragMutation.refresh();
        },
        ondelete: () => {
            if (confirm("정말로 해당 메모를 삭제하시겠습니까?")) {
                temp.splice(index, 1);
                DataResource.Data.updateData("memo", temp);
                DataResource.Data.synchronize();
                Dynamic.FragMutation.refresh();
            }
        }
    })));
})

export default Memo;