let hyperlinkList = [];
function loadHyperlink(array) {
    $scan("#hyperlink").innerHTML = ""
    let obj
    const LENGTH = array.length
    for (i = 0; i < LENGTH; i++) {
        if (array[i].indexOf("http") != -1) {
            obj = $("li", [`img$https://www.google.com/s2/favicons?domain=${array[i]}`, `span$${array[i]}&&style<<cursor:pointer&&onclick<<window.open(this.innerHTML)`, "input$button&&value<< / 제거"]).$()
            obj.children[2].onclick = (e => {
                hyperlinkList = hyperlinkList.filter(inner => {
                    return getIndex(hyperlinkList, inner) !== getIndex(e.target.parentElement.parentElement, e.target.parentElement)
                })
                e.target.parentElement.remove()
                localStorage.setItem("hyperlink", JSON.stringify(hyperlinkList))
            })
        } else {
            obj = $("li", [`span$${array[i]}`, "input$button&&value<< / 제거"]).$()
            obj.children[1].onclick = (e => {
                hyperlinkList = hyperlinkList.filter(inner => {
                    return getIndex(hyperlinkList, inner) !== getIndex(e.target.parentElement.parentElement, e.target.parentElement)
                })
                e.target.parentElement.remove()
                localStorage.setItem("hyperlink", JSON.stringify(hyperlinkList))
            })
        }
        $scan("#hyperlink").appendChild(obj);
    }
}

try {
    if (localStorage.getItem("hyperlink") != null) {
        hyperlinkList = JSON.parse(localStorage.getItem("hyperlink"));
        loadHyperlink(hyperlinkList)
    }
} catch { }
$scan("#hyperlink-input").onsubmit = (e => {
    e.preventDefault();
    (hyperlinkList.indexOf(e.target[0].value) == -1) ? hyperlinkList.push(e.target[0].value) : null
    e.target[0].value = ""
    localStorage.setItem("hyperlink", JSON.stringify(hyperlinkList))
    loadHyperlink(hyperlinkList)
});