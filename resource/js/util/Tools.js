import { Dynamic } from "../init/module.js";

/**
 * @description snackbar 상태를 단일 객체로 관리합니다.
 * 일반 토스트와 장시간 진행 토스트가 같은 DOM을 공유하므로, animation race와 z-index 잔상을 막기 위해 현재 animation을 항상 취소한 뒤 새 상태를 적용합니다.
 */
const SnackbarState = {
    animation: null,
    persistentToken: 0
};

/**
 * @description 앱 전역 snackbar 노드를 안전하게 가져옵니다.
 * @returns {HTMLElement}
 */
const getSnackbar = () => Dynamic.scan("snackbar");

/**
 * @description snackbar 색상을 메시지 유형에 맞게 적용합니다.
 * @param {HTMLElement} snackbar - 실제 snackbar DOM 노드
 * @param {string} type - normal/error/loading 중 하나
 */
const paintSnackbar = (snackbar, type = "normal") => {
    const colorCode = {
        error: "rgba(220, 38, 38, 0.95)",
        loading: "rgba(37, 99, 235, 0.95)",
        normal: "rgba(22, 163, 74, 0.95)"
    };

    snackbar.style.background = colorCode[type] || colorCode.normal;
    snackbar.style.boxShadow = "0 18px 42px rgba(0, 0, 0, 0.24)";
}

/**
 * @description snackbar를 즉시 보이는 상태로 고정합니다.
 * @param {string} message - 표시할 메시지
 * @param {string} type - normal/error/loading 중 하나
 */
const setSnackbarVisible = (message, type = "normal") => {
    const snackbar = getSnackbar();

    SnackbarState.animation?.cancel?.();
    paintSnackbar(snackbar, type);
    snackbar.innerText = message;
    snackbar.style.opacity = "1";
    snackbar.style.zIndex = "100";
    snackbar.style.transform = "translateX(-50%) translateY(0) scale(1)";
}

/**
 * @description 진행 중인 작업용 snackbar를 생성합니다.
 * 반환된 handle은 같은 token을 가진 작업만 갱신/종료할 수 있어, 이전 로드 작업의 늦은 완료 콜백이 새 snackbar를 닫는 문제를 방지합니다.
 * @param {{message: string, type?: string}} props - snackbar 초기 메시지와 유형
 * @returns {{update: (message: string, type?: string) => void, close: (message?: string, type?: string) => void, token: number}}
 */
const pushProgressSnackbar = ({ message, type = "loading" }) => {
    const token = ++SnackbarState.persistentToken;
    setSnackbarVisible(message, type);

    return {
        token,
        update: (nextMessage, nextType = type) => {
            if (SnackbarState.persistentToken === token) setSnackbarVisible(nextMessage, nextType);
        },
        close: (finalMessage = "", finalType = "normal") => {
            if (SnackbarState.persistentToken !== token) return;
            if (finalMessage) pushSnackbar({ message: finalMessage, type: finalType });
            else {
                const snackbar = getSnackbar();
                snackbar.style.opacity = "0";
                snackbar.style.zIndex = "-1";
                snackbar.style.transform = "translateX(-50%) translateY(14px) scale(0.98)";
            }
        }
    };
}

/**
 * @type {(props: {message: string, type: string}) => Promise<void>}
 * @description 앱 전역 토스트 메시지를 표시합니다.
 * 기존 snackbar DOM을 재사용하고 Web Animations API만 사용하므로 추가 노드 누적이나 타이머 누수가 발생하지 않습니다.
 */
const pushSnackbar = async ({ message, type = "normal" }) => {
    const snackbar = getSnackbar();

    ++SnackbarState.persistentToken;
    SnackbarState.animation?.cancel?.();
    paintSnackbar(snackbar, type);
    snackbar.innerText = message;
    SnackbarState.animation = snackbar.animate([
        { opacity: 0, zIndex: -1, transform: "translateX(-50%) translateY(14px) scale(0.98)" },
        { opacity: 1, zIndex: 100, transform: "translateX(-50%) translateY(0) scale(1)", offset: 0.16 },
        { opacity: 1, zIndex: 100, transform: "translateX(-50%) translateY(0) scale(1)", offset: 0.84 },
        { opacity: 0, zIndex: -1, transform: "translateX(-50%) translateY(14px) scale(0.98)" }
    ], { duration: 1800, easing: "cubic-bezier(.2,.8,.2,1)" });

    try { await SnackbarState.animation.finished; } catch { }
}

export { pushSnackbar, pushProgressSnackbar }
