import { Dynamic } from "../init/module.js";

const pushSnackbar = async ({message, type}) => {
    const snackbar = Dynamic.scan("snackbar");
    let color;
    switch (type) {
        case "error":
            color = "#880000"
            break;
        case "normal":
            color = "#008800"
            break;
    }
    snackbar.style.backgroundColor = color;
    snackbar.style.boxShadow = `${color}88`;
    snackbar.innerText = message;
    snackbar.animate([
        {opacity: 0, zIndex: -1},
        {opacity: 1, zIndex: 1},
        {opacity: 0, zIndex: -1}
    ], {duration: 1000});
}

export { pushSnackbar }