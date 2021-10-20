function equl(e) {
    var URL = document.getElementById("check").value + ".html";
    if (e.key == "Enter") {
        window.open(URL, "viewer", "width=650, height=950, location=0, manubar=0, status=0, toolbar=0")
    }
}