import { Dynamic } from "../init/module.js";

/**
 * @type {(props: {message: string, type: string}) => Promise<void>}
 * @description 앱 전역 토스트 메시지를 표시합니다.
 * 기존 snackbar DOM을 재사용하고 Web Animations API만 사용하므로 추가 노드 누적이나 타이머 누수가 발생하지 않습니다.
 */
const pushSnackbar = async ({ message, type = "normal" }) => {
    const colorCode = {
        error: "rgba(220, 38, 38, 0.95)",
        normal: "rgba(22, 163, 74, 0.95)"
    };
    const snackbar = Dynamic.scan("snackbar");

    snackbar.style.background = colorCode[type] || colorCode.normal;
    snackbar.style.boxShadow = "0 18px 42px rgba(0, 0, 0, 0.24)";
    snackbar.innerText = message;
    await snackbar.animate([
        { opacity: 0, zIndex: -1, transform: "translateX(-50%) translateY(14px) scale(0.98)" },
        { opacity: 1, zIndex: 100, transform: "translateX(-50%) translateY(0) scale(1)", offset: 0.16 },
        { opacity: 1, zIndex: 100, transform: "translateX(-50%) translateY(0) scale(1)", offset: 0.84 },
        { opacity: 0, zIndex: -1, transform: "translateX(-50%) translateY(14px) scale(0.98)" }
    ], { duration: 1800, easing: "cubic-bezier(.2,.8,.2,1)" }).finished;
}

export { pushSnackbar }
