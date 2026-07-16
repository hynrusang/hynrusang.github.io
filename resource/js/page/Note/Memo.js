import { Dynamic } from "../../init/module.js";
import { NoAutocompleteX, HandlerX, ScreenX } from "../../component/XBox.js";
import DataResource from "../../util/DataResource.js";
import { pushSnackbar } from "../../util/Tools.js";

// ==========================================
// 1. Memo list operations
// ==========================================

/**
 * @description 현재 LiveData의 메모 목록만 다시 그립니다.
 * 각 메모 카드는 본문 높이만큼 확장되며 페이지의 단일 스크롤 영역을 사용합니다.
 */
const renderMemoList = () => {
    const target = Dynamic.scan("#dynamic_memo");
    if (!target) return;

    const memoList = DataResource.Data.basic.memo || [];
    Dynamic.snipe(target).reset(memoList.map((memo, index) => HandlerX({
        element: Dynamic.$("pre", { class: "memo-item-body", text: memo }),
        onedit: async event => {
            event.preventDefault();

            // 1. 편집값을 검사하되 현재 배열은 직접 변경하지 않습니다.
            const nextValue = event.currentTarget.querySelector('[data-field="memoValue"]').value;
            if (memo === nextValue) {
                pushSnackbar({ message: "수정된 메모가 기존과 동일합니다.", type: "error" });
                return;
            }

            // 2. 복사본을 저장하고 성공한 경우에만 메모 목록을 다시 그립니다.
            const nextMemoList = [...memoList];
            nextMemoList[index] = nextValue;
            if (!await DataResource.Data.commitBasicData("memo", nextMemoList)) return;
            renderMemoList();
        },
        ondelete: async () => {
            if (!confirm("정말로 해당 메모를 삭제하시겠습니까?")) return;

            // 1. 삭제 대상만 제외한 새 배열을 만듭니다.
            const nextMemoList = [...memoList];
            nextMemoList.splice(index, 1);

            // 2. 저장 성공 후에만 메모 목록에서 항목을 제거합니다.
            if (!await DataResource.Data.commitBasicData("memo", nextMemoList)) return;
            renderMemoList();
        }
    })));
};

// ==========================================
// 2. Memo creation form
// ==========================================

/**
 * @description 새 메모를 추가하는 하단 고정 폼입니다.
 * 저장 실패 시 작성 중인 입력값을 그대로 남겨 사용자가 내용을 잃지 않게 합니다.
 */
const MemoForm = Dynamic.$("form", {
    class: "memo-create-form",
    autocomplete: "off",
    onsubmit: async event => {
        event.preventDefault();

        // 1. 입력값을 읽고 빈 메모 저장을 차단합니다.
        const memoInput = event.currentTarget.querySelector('[data-field="memoContent"]');
        const value = memoInput.value.trim();
        if (!value) return;

        // 2. 새 배열을 저장하고 성공한 경우에만 목록과 입력란을 갱신합니다.
        const nextMemoList = [value, ...(DataResource.Data.basic.memo || [])];
        if (!await DataResource.Data.commitBasicData("memo", nextMemoList)) return;

        renderMemoList();
        memoInput.value = "";
    }
}).add(
    Dynamic.$("textarea", {
        ...NoAutocompleteX,
        "data-field": "memoContent",
        required: "",
        class: "memo-create-input",
        placeholder: "메모 내용"
    }),
    Dynamic.$("button", { type: "submit", class: "formApplyButton", text: "작성" })
);

// ==========================================
// 3. Memo page
// ==========================================

const Memo = new Dynamic.Fragment("memo",
    ScreenX("dynamic_memo").add(MemoForm)
).registAction(renderMemoList);

export default Memo;
