import { Dynamic } from "../../init/module.js";
import { MemoForm } from "../../component/FormBox.js";
import { HandlerX, ScreenX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";
import { pushSnackbar } from "../../util/Tools.js";

// ==========================================
// 1. Memo list rendering
// ==========================================

/**
 * @description 메모 목록 영역만 다시 그립니다.
 * 메모 본문에는 별도 내부 스크롤을 만들지 않고 페이지 스크롤 하나로 전체 내용을 확인합니다.
 */
const renderMemoList = () => {
    const target = Dynamic.scan("#dynamic_memo");
    if (!target) return;

    const memoList = DataResource.Data.basic.memo || [];
    Dynamic.snipe(target).reset(memoList.map((memo, index) => HandlerX({
        element: Dynamic.$("pre", { class: "memo-item-body", text: memo }),
        onedit: async event => {
            event.preventDefault();
            const nextValue = event.currentTarget.elements[0].value;
            if (memo === nextValue) {
                pushSnackbar({ message: "수정된 메모가 기존과 동일합니다.", type: "error" });
                return;
            }

            const nextMemo = [...memoList];
            nextMemo[index] = nextValue;
            await DataResource.Data.commitBasicData("memo", nextMemo);
        },
        ondelete: async () => {
            if (!confirm("정말로 해당 메모를 삭제하시겠습니까?")) return;

            const nextMemo = [...memoList];
            nextMemo.splice(index, 1);
            await DataResource.Data.commitBasicData("memo", nextMemo);
        }
    }).set({ class: "handlerX memo-handler" })));
};

// ==========================================
// 2. Memo page
// ==========================================

const Memo = new Dynamic.Fragment("memo",
    ScreenX("dynamic_memo").add(MemoForm)
).registAction(renderMemoList);

window.addEventListener("basic-data-committed", event => {
    if (event.detail?.key === "memo") renderMemoList();
});

export default Memo;
