function backgroundChange() {
    $set($scan("body"), `style<<background:url("Effect/img/${Math.floor(Math.random() * 5)}.jpg");background-size:cover`)
}
backgroundChange();