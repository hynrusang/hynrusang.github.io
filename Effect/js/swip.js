function versGet(num) {
    localStorage.setItem("vers", num)
    try {
        $scan("head").removeChild($scan(".version"))
    } catch (e) { }
    if (num != 0) $scan("head").appendChild($(`link$Effect/css/version/Version%20-%20${num}/all%20v-additional.css&&rel<<stylesheet&&type<<text/css::version`).$())
}
function getIndex(parent, child) {
    try {
        for (var i = 0; i < parent.children.length; i++) {
            if (parent.children[i] === child) {
                return i;
                break;
            }
        }
    } catch (e) {
        for (var i = 0; i < parent.length; i++) {
            if (parent[i] === child) {
                return i;
                break;
            }
        }
    }
}
function widgetChange(e) {
    const PARENT = e.target.parentElement.parentElement
    if (PARENT.classList[0] == "top-1") localStorage.setItem("currenttop", getIndex(PARENT, e.target.parentElement))
    $scan(`.${PARENT.classList[0]}-nowselect`).classList.replace(`${PARENT.classList[0]}-nowselect`, "hide")
    $scan(`#${PARENT.classList[0]}`).children[getIndex(PARENT, e.target.parentElement)].classList.replace("hide", `${PARENT.classList[0]}-nowselect`)
}

try {
    if (localStorage.getItem("currenttop") != null && localStorage.getItem("currenttop") != 0) {
        $scan(".top-1-nowselect").classList.replace("top-1-nowselect", "hide")
        $scan("#top-1").children[localStorage.getItem("currenttop")].classList.replace("hide", "top-1-nowselect")
    }
} catch { }
for (i = 0; i < $scan([".widget div"]).length; i++) {
    $scan([".widget div", i]).onclick = widgetChange
}
$scan([".top-1.widget div"])[5].onclick = (function () {
    window.open("https://github.com/hynrusang/hynrusang.github.io/tree/release#readme")
})