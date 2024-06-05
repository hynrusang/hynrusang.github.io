import { Dynamic } from "../init/module.js";

/**
 * @type {(props: {message: string, type: string}) => Promise<void>}
 */
const pushSnackbar = async ({message, type}) => {
    const colorCode = {
        error: "#880000",
        normal: "#008800"
    };
    const snackbar = Dynamic.scan("snackbar");

    snackbar.style.backgroundColor = colorCode[type];
    snackbar.style.boxShadow = `${colorCode[type]}88`;
    snackbar.innerText = message;
    await snackbar.animate([
        {opacity: 0, zIndex: -1},
        {opacity: 1, zIndex: 1},
        {opacity: 0, zIndex: -1}
    ], {duration: 1000}).finished;
}

export { pushSnackbar }