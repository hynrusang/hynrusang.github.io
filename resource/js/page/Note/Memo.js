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
        element: Dynamic.$("pre", {class: "memo-item-body", text: memo}),
        onedit: async e => {
            e.preventDefault();
            const nextValue = e.target[0].value;
            if (temp[index] == nextValue) {
                pushSnackbar({message: "수정된 메모가 기존과 동일합니다.", type: "error"});
                return;
            }

            const nextMemo = [...temp];
            nextMemo[index] = nextValue;
            if (await DataResource.Data.commitBasicData("memo", nextMemo)) Dynamic.FragMutation.refresh();
        },
        ondelete: async () => {
            if (!confirm("정말로 해당 메모를 삭제하시겠습니까?")) return;

            const nextMemo = [...temp];
            nextMemo.splice(index, 1);
            if (await DataResource.Data.commitBasicData("memo", nextMemo)) Dynamic.FragMutation.refresh();
        }
    })));
})

export default Memo;
