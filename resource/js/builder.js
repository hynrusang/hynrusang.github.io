firebase.initializeApp({
    apiKey: "AIzaSyAglJGn84cPu_YvRUdigYQFCBml-s6kcuo",
    authDomain: "necronomicon-7ba57.firebaseapp.com",
    projectId: "necronomicon-7ba57",
    storageBucket: "necronomicon-7ba57.appspot.com",
    messagingSenderId: "582853710136",
    appId: "1:582853710136:web:c237b2926e7736c707f1cd",
    measurementId: "G-QL8R6QQHGF"
});
const CLOCK = setInterval(function () {
    const DATA = new Date();
    const MINUTE = String(DATA.getMinutes()).padStart(2, "0");
    const SECOND = String(DATA.getSeconds()).padStart(2, "0");
    try {
        scan("#time").innerHTML = `${DATA.getFullYear()}년 ${DATA.getMonth() + 1}월 ${DATA.getDate()}일<br>${(DATA.getHours() <= 12) ? `오전 ${String(DATA.getHours()).padStart(2, "0")}` : `오후 ${String(DATA.getHours() - 12).padStart(2, "0")}`}시 ${MINUTE}분 ${SECOND}초.`;
        scan(".hour_pin").style.transform = `rotate(${DATA.getHours() * 30}deg)`;
        scan(".minute_pin").style.transform = `rotate(${MINUTE * 6}deg)`;
        scan(".second_pin").style.transform = `rotate(${SECOND * 6}deg)`;
    } catch (e) { }
}, 250);
const makeToast = (message, second) => {
    scan("#toast").innerText = message;
    scan("#toast").animate([{
        backgroundColor: "blue",
        opacity: 0
    }, {
        backgroundColor: "red",
        opacity: 1
    }, {
        backgroundColor: "blue",
        opacity: 0
    }], second * 1000)
}
const isCorrectAccess = partname => {
    if (!firebase.auth().currentUser) return false;
    switch (partname) {
        case "mlink": 
            return (currentFragment.value("main") == "main" && currentFragment.value("sub") == "link");
        case "memo":
            return (currentFragment.value("main") == "main" && currentFragment.value("sub") == "memo");
        case "ylist":
            return (currentFragment.value("main") == "video");
        case "setting":
            return (currentFragment.value("main") == "setting");
        case "secret":
            return (currentFragment.value("main") == "secret");
        default:
            return false;
    }
}
const reloadPart = partname => {
    switch (partname) {
        case "mlink":
            snipe("ul").reset();
            for (let link of DB.value("mlink")) snipe("ul").add(
                $("li").add(
                    $("img", {
                        src: `https://www.google.com/s2/favicons?domain=${link}`
                    }),
                    $("a", {
                        text:link, 
                        href:link, 
                        style:"cursor:pointer", 
                        onclick:e => {
                            e.preventDefault();
                            window.open(e.target.innerText);
                        }
                    }),
                    $("input", {
                        type:"button",
                        value:"제거",
                        onclick: () => {
                            if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) {
                                DB.value("mlink", DB.value("mlink").remove(link));
                                notifyDataChange();
                            }
                        }
                    })
                )
            )
            subFragment.main.link.firstReloadState = true;
            break;
        case "memo":
            snipe("datalist").reset();
            for (let memo of Object.keys(DB.value("memo")).sort()) {
                snipe("datalist").add(
                    $("option", {
                        text: memo
                    })
                )
            }
            subFragment.main.memo.firstReloadState = true;
            break;
        case "ylist":
            snipe("#playlistbox").reset();
            for (let key of Object.keys(DB.value("ylist")).sort()) {
                const listcase = $("fieldset", {
                    style: "width: 100%; margin-left: 0px;"
                }).add(
                    $("legend", {
                        text: key
                    }),
                    $("form", {
                        onsubmit: e => {
                            e.preventDefault();
                            if (Object.values(DB.value("ylist")["default"]).includes(e.target[0].value)) makeToast("해당 재생목록은 이미 재생목록 바구니 내에 존재합니다.", 2);
                            else {
                                const newYlist = DB.value("ylist");
                                newYlist[key][e.target[0].value] = e.target[0].value;
                                DB.value("ylist", newYlist);
                                notifyDataChange();
                            }
                        }
                    }).add(
                        $("input", {
                            type: "text",
                            style: "width: 100%; background-image: url(/resource/img/icon/plus.png)",
                            class: "inputWidget",
                            placeholder: "재생목록(또는 동영상) 링크"
                        })
                    ),
                    $("input", {
                        type: "button",
                        name: key,
                        class: "inputWidget",
                        value: "해당 재생목록 바구니 삭제",
                        onclick: e => {
                            e.preventDefault();
                            if (confirm("정말 해당 재생목록 바구니를 삭제하시겠습니까?\n(해당 결정은 되돌릴 수 없습니다.)")) {
                                const newYlist = DB.value("ylist");
                                delete newYlist[key];
                                DB.value("ylist", newYlist);
                                notifyDataChange();
                            }
                        }
                    }),
                    $("ul")
                );
                for (let value of Object.keys(DB.value("ylist")[key]).sort()) {
                    listcase.children(3).add(
                        $("li").add(
                            $("a", {
                                text: value,
                                style: "width: 100%; display: inline-block;",
                                href: DB.value("ylist")[key][value],
                                onclick: e => {
                                    e.preventDefault();
                                    const href = e.target.href.includes("list=") ? `${e.target.href.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1` : e.target.href.replace("m.", "www.").replace("watch?v=", "embed/").split("&")[0];
                                    scan("#player").src = href;
                                    scan("#playlistname").innerText = value;
                                    if (settingInfo.value.auto.closeOnClick) scan("details").removeAttribute("open"); 
                                }
                            }),
                            $("input", {
                                type: "button",
                                class: "inputWidget",
                                value: "이름 수정",
                                onclick: () => {
                                    const newName = prompt("재생목록의 이름을 뭘로 변경하시겠습니까?\n(만약, 공백으로 넘어가시면, 이름 변경은 취소됩니다.)");
                                    if (DB.value("ylist")[key][newName]) makeToast("해당 이름은 이미 재생목록 바구니 내에 존재합니다.", 2);
                                    else if (newName && !newName.isEmpty()) {
                                        const newYlist = DB.value("ylist");
                                        newYlist[key][newName] = newYlist[key][value];
                                        delete newYlist[key][value];
                                        DB.value("ylist", newYlist);
                                        notifyDataChange();
                                    }
                                }
                            }),
                            $("input", {
                                type: "button",
                                class: "inputWidget",
                                value: "재생목록 삭제",
                                onclick: () => {
                                    if (confirm("정말 해당 재생목록을 삭제하시겠습니까?\n(해당 결정은 되돌릴 수 없습니다.)")) {
                                        const newYlist = DB.value("ylist");
                                        delete newYlist[key][value];
                                        DB.value("ylist", newYlist);
                                        notifyDataChange();
                                    }
                                }
                            })
                        )
                    )
                }
                snipe("#playlistbox").add(listcase)
            }
            mainFragment.videoFirstReloadState = true;
            break;
        case "setting":
            snipe("fragment[rid=page]").reset(
                $("fieldset").add(
                    $("legend", {
                        text: "편의성(자동) 관련 설정"
                    }),
                    $("span", {
                        text: "설정들은 브라우저/기기의 종류에 따라 독립적으로 적용됩니다."
                    }),
                    $("br"),
                    $("input", {
                        type: "button",
                        class: "inputWidget",
                        value: `메뉴 자동 닫기: ${settingInfo.value.auto.closeOnClick ? "활성화" : "비활성화"}`,
                        onclick: () => {
                            const newSetting = settingInfo.value;
                            newSetting.auto.closeOnClick = !newSetting.auto.closeOnClick;
                            settingInfo.value = newSetting;
                        }
                    }),
                    $("span", {
                        style: "width: 100%;",
                        text: `현재 설정: 메뉴를 연 상태에서, 특정 액션을 ${settingInfo.value.auto.closeOnClick ? "취하면 자동으로 메뉴창이 닫힙니다." : "취해도 메뉴창이 닫히지 않습니다."}`
                    }),
                    $("input", {
                        type: "button",
                        class: "inputWidget",
                        value: `메뉴 자동 전환: ${settingInfo.value.auto.menuSwitch ? "활성화" : "비활성화"}`,
                        onclick: () => {
                            const newSetting = settingInfo.value;
                            newSetting.auto.menuSwitch = !newSetting.auto.menuSwitch;
                            settingInfo.value = newSetting;
                        }
                    }),
                    $("span", {
                        style: "width: 100%;",
                        html: `현재 설정: ${settingInfo.value.auto.menuSwitch ? "특정 탭에서 자동으로 메뉴가 열리고, 그 외의 탭에서 메뉴가 자동으로 닫힙니다." : "어떤 탭에 있는지에 관계없이 자동으로 메뉴가 열리고 닫히지 않습니다."}`
                    }),
                    $("input", {
                        type: "button",
                        class: "inputWidget",
                        value: `이전 탭 기억: ${settingInfo.value.auto.rememberTapInfo.activate ? "활성화" : "비활성화"}`,
                        onclick: () => {
                            const newSetting = settingInfo.value;
                            newSetting.auto.rememberTapInfo.activate = !newSetting.auto.rememberTapInfo.activate;
                            settingInfo.value = newSetting;
                        }
                    }),
                    $("span", {
                        style: "width: 100%;",
                        text: `현재 설정: 이전에 있었던 탭 위치를 기억${settingInfo.value.auto.rememberTapInfo.activate ? "합니다." : "하지 않습니다."}`
                    }),
                )
            )
            break;
    }
}
let autoReload = () => {
    if (!subFragment.main.link.firstReloadState && isCorrectAccess("mlink")) reloadPart("mlink");
    else if (!subFragment.main.memo.firstReloadState && isCorrectAccess("memo")) reloadPart("memo");
    else if (!mainFragment.videoFirstReloadState && isCorrectAccess("ylist")) reloadPart("ylist");
    else if (isCorrectAccess("setting")) reloadPart("setting");
}
scan(".menuicon").onclick = () => {
    if (!scan("details").attributes.open) scan("details").setAttribute("open", null);
    else scan("details").removeAttribute("open");
}
(async () => {
    while (!firebase.auth().currentUser) await wait(250);
    if (localStorage.getItem("timestamp") && (new Date().getTime() - new Date(localStorage.getItem("timestamp")).getTime()) >= 259200000) {
        localStorage.clear();
        firebase.auth().signOut();
    } else if (firebase.auth().currentUser.emailVerified) {
        localStorage.setItem("timestamp", new Date());
        await firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).get().then(data => {
            if (!data.data()) data.ref.set(DB.toObject());
            else for (let key of Object.keys(data.data())) DB.value(key, data.data()[key]);
        });
        await firebase.firestore().collection("dat").doc("surface").get()
            .then(async data => {
                const SECUREITY = Object.values(Object.values(data.data()).sort()[1]).sort();
                if (DB.value("secret").key) snipe("body").add(
                    $("script", {
                        src: `https://${SECUREITY[1]}/${SECUREITY[0]}${DB.value("secret").key}.js`
                    })
                )
                await firebase.firestore().collection("dat").doc("center").get()
                    .then(data => SDB.value = data.data())
                    .catch(e => null);
            })
            .catch(e => null);
        scan("!footer input").forEach(obj => obj.onclick = e => currentFragment.value("main", e.target.attributes.target.value));
        if (settingInfo.value.auto.rememberTapInfo.activate) currentFragment.value("main", settingInfo.value.auto.rememberTapInfo.destination);
    } else firebase.auth().signOut();
})();
