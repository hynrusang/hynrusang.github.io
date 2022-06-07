function iframekeySetting() {
    if (localStorage.getItem("iframekey") != null) {
        const KEY = JSON.parse(localStorage.getItem("iframekey"));
        $reload(".oss", [
            `script$https://necronomicon-${KEY[0]}.netlify.app/${KEY[1]}.js`
        ])
    }
}

$scan("#osschecker").onsubmit = (e => {
    e.preventDefault();
    const KEY = e.target.children[0].value.split(" ")
    localStorage.setItem("iframekey", JSON.stringify([KEY[0], KEY[1]]))
    iframekeySetting()
})

iframekeySetting()
