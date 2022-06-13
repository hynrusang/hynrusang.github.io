let statisticsList = {}
function reloadStatistics() {
    $reload("#statisticsList", [])
    let keys = Object.keys(statisticsList);
    let values = Object.values(statisticsList);
    for (var i = 0; i < keys.length; i++) {
        $scan("#statisticsList").appendChild($(`fieldset#statistics_${keys[i]}`, [
            `legend$통계량 ${keys[i]}`,
            "input$button&&value<<이 통계량 지우기&&onclick<<deleteStatistics(this)"
        ]).$())
    };
}
function addStatistics(e) {
    e.preventDefault()
    statisticsList[e.target.id.split("_")[1]].push(obj.value);
    reloadStatistics();
}
function deleteStatistics(obj) {
    delete statisticsList[`${obj.parentElement.id.split("_")[1]}`]
    localStorage.setItem("statistics", JSON.stringify(statisticsList));
    reloadStatistics();
}

$scan("#statisticssave").onsubmit = (e => {
    e.preventDefault();
    (Object.keys(statisticsList).indexOf(e.target[1].value) == -1) ? statisticsList[e.target[1].value] = [] : null;
    localStorage.setItem("statistics", JSON.stringify(statisticsList));
    reloadStatistics();
    e.target[1].value = "";
})

try {
    if (localStorage.getItem("statistics") != null) {
        statisticsList = JSON.parse(localStorage.getItem("statistics"));
        reloadStatistics();
    }
} catch (e) {}