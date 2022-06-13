let statisticsList = {}
function returnStatisticsData(want) {
    return statisticsList[want];
}
function reloadStatistics() {
    $reload("#statisticslist", [])
    let keys = Object.keys(statisticsList);
    let values = Object.values(statisticsList);
    for (var i = 0; i < keys.length; i++) {
        let obj = $(`fieldset#statistics_${keys[i]}`, [
            `legend$통계 ${keys[i]}`,
            $("form", ["input$text&&placeholder<<저장할 통계량(실수만 입력)&&style<<background-image: url(Effect/img/icon-plus.png)"]).$(),
            "ul",
            "input$button&&value<<이 통계 지우기&&onclick<<deleteStatistics(this)"
        ]).$()
        obj.children[1].onsubmit = (e => {
            e.preventDefault();
            let parent = e.target.parentElement;
            statisticsList[parent.id.split("_")[1]].push(e.target[0].value);
            localStorage.setItem("statistics", JSON.stringify(statisticsList));
            reloadStatistics();
        })
        obj.children[3].onclick = (e => {
            delete statisticsList[`${e.target.parentElement.id.split("_")[1]}`]
            localStorage.setItem("statistics", JSON.stringify(statisticsList));
            reloadStatistics();
        })
        $scan("#statisticslist").appendChild(obj)
    };
    for (var i = 0; i < values.length; i++) {
        let target = $scan(`#statistics_${keys[i]}`);
        for (var j = 0; j < values[i].length; j++) {
            let obj = $("li", [`span$${values[i][j]}&&style<<cursor:pointer`, "input$button&&value<< / 제거"]).$()
            obj.children[1].onclick = (e => {
                let keys = e.target.parentElement.parentElement.parentElement.id.split("_")[1]
                statisticsList[keys] = statisticsList[keys].filter(inner => {
                    return getIndex(statisticsList[keys], inner) !== getIndex(e.target.parentElement.parentElement, e.target.parentElement)
                })
                localStorage.setItem("statistics", JSON.stringify(statisticsList));
                e.target.parentElement.remove()
            })
            target.children[2].appendChild(obj)
        }
    }
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