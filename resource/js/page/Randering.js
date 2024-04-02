const Randering = new Fragment("main", 
    $("div", {style: "display: flex; height: 100%; justify-content: center; align-items: center;"}).add(
        $("div", {class: "loading_icon"}),
        $("h1", {text: "데이터를 로드중입니다...", class: "loading_text"})
    )
)

export default Randering;