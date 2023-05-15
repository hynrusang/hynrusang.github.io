const mainFragment = new Fragment("mains", $("section").add(
    $("div", { class: "login" }).add(
        $("input", { type: "button", style: "background-image: url('/resource/img/icon/setting.png')", value: firebase.auth().currentUser ? db.uname : "로그인", onclick: () => { loading('login'); } })
    ),
    $("div", { class: "clock" }).add(
        $("div", { class: "hour_pin" }),
        $("div", { class: "minute_pin" }),
        $("div", { class: "second_pin" })
    ),
    $("p", { id: "time", style: "position: relative; top: 10px; text-align: center;" }),
    $("form", { id: "mmap-tools", onsubmit: e => {
            e.preventDefault();
            if (!firebase.auth().currentUser) alert("먼저 로그인을 해 주십시오.");
            else {
                if (linkmode) {
                    if (e.target[2].value[0] == " ") e.target[2].value = e.target[2].value.split(" ").pop();
                    if (!e.target[2].value.in("http")) e.target[2].value = `https://${e.target[2].value}`;
                    (db.mmap.link.indexOf(e.target[2].value) == -1) ? db.mmap.link.push(e.target[2].value) : alert("이미 저장된 링크입니다.");
                    db.mmap.link.sort();
                    e.target[2].value = "";
                } else (scan("#mmemo").value != "") ? db.mmap.memo[e.target[2].value] = scan("#mmemo").value : delete db.mmap.memo[e.target[2].value];
                firebaseUtil.sync();
                (linkmode) ? reloadUtil.mLink() : reloadUtil.mMemo();
            }
        }
    }).add(
        $("input", { type: "button", style: "width:40%;background-image:url('/resource/img/icon/favorite.png');background-color:rgba(180, 180, 180, 0.3)", value: "링크", onclick: e => {
                linkmode = true;
                scan("!#mmap-tools input")[0].style.backgroundColor = "rgba(180, 180, 180, 0.3)";
                scan("!#mmap-tools input")[1].style.backgroundColor = null;
                scan("!#mmap-tools input")[2].style.backgroundImage = "url('/resource/img/icon/favorite.png')";
                scan("!#mmap-tools input")[2].placeholder = "주소";
                scan("!#mmap-tools input")[2].removeAttribute("list");
                scan("!#mmap-tools input")[3].style.display = "none";
                scan("!#mmap-tools input")[4].style.display = "none";
                scan("#mlink").style.display = "block";
                scan("#mmemo").style.display = "none";
            }
        }),
        $("input", {type: "button", style: "width:40%;background-image:url('/resource/img/icon/library.png');", value: "메모", onclick: e => {
                linkmode = false;
                scan("!#mmap-tools input")[0].style.backgroundColor = null;
                scan("!#mmap-tools input")[1].style.backgroundColor = "rgba(180, 180, 180, 0.3)";
                scan("!#mmap-tools input")[2].style.backgroundImage = "url('/resource/img/icon/library.png')";
                scan("!#mmap-tools input")[2].placeholder = "제목";
                scan("!#mmap-tools input")[2].setAttribute("list", "memo_list");
                scan("!#mmap-tools input")[3].style.display = "inline-block";
                scan("!#mmap-tools input")[4].style.display = "inline-block";
                scan("#mlink").style.display = "none";
                scan("#mmemo").style.display = "inline-block";
            }
        }),
        $("input", { type: "text", style: "background-image:url(/resource/img/icon/favorite.png)", placeholder: "주소", required: null, onchange: e => {
                if (!linkmode) scan("#mmemo").value = (db.mmap.memo[e.target.value]) ? db.mmap.memo[e.target.value] : "";
            }
        }),
        $("textarea", { id: "mmemo", style: "display:none", spellcheck: "false", placeholder: "공백을 저장하면, 해당 메모가 삭제됩니다." }),
        $("input", {
            type: "button", style: "width:40%;background-image:url('/resource/img/icon/del.png');display:none", value: "메모 클리어", onclick: () => {
                scan("!#mmap-tools input")[2].value = "";
                scan("#mmemo").value = "";
            }
        }),
        $("input", { type: "submit", style: "width:40%;background-image:url('/resource/img/icon/save.png');display:none", value: "저장" })
    ),
    $("ul", { id: "mlink" })
)).launch(() => {
    reloadUtil.mLink();
    reloadUtil.mMemo();
    if (navigator.userAgent.split(" ").last().split("/")[0] == "Edg") {
        scan("!nav a img")[4].src = "https://www.google.com/s2/favicons?domain=https://www.bing.com/";
        scan("!nav a")[4].href = "https://www.bing.com/search?q=Bing+AI&showconv=1&FORM=hpcodx";
        scan("!nav a span")[4].innerText = "Bing Ai"
    }
})