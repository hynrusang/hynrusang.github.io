const Randering = new Fragment("main", 
    $("div", {style: "display: flex; flex-direction: column; height: 100%; justify-content: center; align-items: center;"}).add(
        $("div", {id: "loading_icon"}),
        $("h1", {id: "loading_text"})
    )
).registAction(message => scan("#loading_text").innerText = message);

export default Randering;
