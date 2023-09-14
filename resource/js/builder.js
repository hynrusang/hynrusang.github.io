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
const makeToast = message => {
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
    }], 1000)
}
const notifyDataChange = async () => firebase.auth().currentUser ? firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).update(DB.toObject()) : makeToast("로그인을 하시지 않으면, 변경 사항이 저장되지 않습니다.");
const reloadPart = partname => {
    let target;
    switch (partname) {
        case "main":
            target = [subFragment.main.link.fragment[0].children(3).reset(), subFragment.main.memo.fragment[0].reset()];
            for (let link of DB.value("main").link) target[0].add(
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
                                const temp = DB.value("main")
                                temp.link.remove(link);
                                DB.value("main", temp);
                                notifyDataChange();
                            }
                        }
                    })
                )
            )
            for (let memo of Object.keys(DB.value("main").memo).sort()) {
                target[1].add(
                    $("option", {
                        text: memo
                    })
                )
            }
            break;
        case "playlist":
            target = menuFragment.video.fragment[1].reset();
            for (let key of Object.keys(DB.value("playlist")).sort()) {
                const listcase = $("fieldset", {
                    style: "width: 100%; margin-left: 0px;"
                }).add(
                    $("legend", {
                        text: key
                    }),
                    $("form", {
                        onsubmit: e => {
                            e.preventDefault();
                            if (Object.values(DB.value("playlist")[e.target.parentElement.children[0].innerText]).includes(e.target[0].value)) makeToast("해당 재생목록은 이미 재생목록 바구니 내에 존재합니다.");
                            else {
                                const temp = DB.value("playlist");
                                temp[key][e.target[0].value] = e.target[0].value;
                                DB.value("playlist", temp);
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
                                const temp = DB.value("playlist");
                                delete temp[key];
                                DB.value("playlist", temp);
                                notifyDataChange();
                            }
                        }
                    }),
                    $("ul")
                );
                for (let value of Object.keys(DB.value("playlist")[key]).sort()) {
                    listcase.children(3).add(
                        $("li").add(
                            $("a", {
                                text: value,
                                style: "width: 100%; display: inline-block;",
                                href: DB.value("playlist")[key][value],
                                onclick: e => {
                                    e.preventDefault();
                                    const href = e.target.href.includes("list=") ? `${e.target.href.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1` : e.target.href.replace("m.", "www.").replace("watch?v=", "embed/").split("&")[0];
                                    currentVideo.value = [key, value, href];
                                }
                            }),
                            $("input", {
                                type: "button",
                                class: "inputWidget",
                                value: "이름 수정",
                                onclick: () => {
                                    const newName = prompt("재생목록의 이름을 뭘로 변경하시겠습니까?\n(만약, 공백으로 넘어가시면, 이름 변경은 취소됩니다.)");
                                    if (DB.value("playlist")[key][newName]) makeToast("해당 이름은 이미 재생목록 바구니 내에 존재합니다.");
                                    else if (newName && !newName.isEmpty()) {
                                        const temp = DB.value("playlist");
                                        temp[key][newName] = temp[key][value];
                                        delete temp[key][value];
                                        DB.value("playlist", temp);
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
                                        const temp = DB.value("playlist");
                                        delete temp[key][value];
                                        DB.value("playlist", temp);
                                        notifyDataChange();
                                    }
                                }
                            })
                        )
                    )
                }
                target.add(listcase)
            }
            break;
        case "setting":
            target = mainFragment.setting.fragment[0];
            target.reset(
                $("fieldset").add(
                    $("legend", {
                        text: "브라우저/기기 종속 설정"
                    }),
                    $("span", {
                        text: "이 필드의 설정들은 브라우저/기기의 종류에 따라 독립적으로 적용됩니다."
                    }),
                    $("br"),
                    $("input", {
                        type: "button",
                        class: "inputWidget",
                        value: `메뉴 자동 닫기: ${setting.value.auto.closeOnClick ? "활성화" : "비활성화"}`,
                        onclick: () => {
                            const temp = setting.value;
                            temp.auto.closeOnClick = !temp.auto.closeOnClick;
                            setting.value = temp;
                        }
                    }),
                    $("span", {
                        style: "width: 100%;",
                        text: `현재 설정: 메뉴를 연 상태에서, 특정 액션을 ${setting.value.auto.closeOnClick ? "취하면 자동으로 메뉴창이 닫힙니다." : "취해도 메뉴창이 닫히지 않습니다."}`
                    }),
                    $("input", {
                        type: "button",
                        class: "inputWidget",
                        value: `메뉴 자동 전환: ${setting.value.auto.menuSwitch ? "활성화" : "비활성화"}`,
                        onclick: () => {
                            const temp = setting.value;
                            temp.auto.menuSwitch = !temp.auto.menuSwitch;
                            setting.value = temp;
                        }
                    }),
                    $("span", {
                        style: "width: 100%;",
                        html: `현재 설정: ${setting.value.auto.menuSwitch ? "특정 탭에서 자동으로 메뉴가 열리고, 그 외의 탭에서 메뉴가 자동으로 닫힙니다." : "어떤 탭에 있는지에 관계없이 자동으로 메뉴가 열리고 닫히지 않습니다."}`
                    }),
                    $("input", {
                        type: "button",
                        class: "inputWidget",
                        value: `이전 탭 기억: ${setting.value.auto.rememberTapInfo.activate ? "활성화" : "비활성화"}`,
                        onclick: () => {
                            const temp = setting.value;
                            temp.auto.rememberTapInfo.activate = !temp.auto.rememberTapInfo.activate;
                            setting.value = temp;
                        }
                    }),
                    $("span", {
                        style: "width: 100%;",
                        text: `현재 설정: 이전에 있었던 탭 위치를 기억${setting.value.auto.rememberTapInfo.activate ? "합니다." : "하지 않습니다."}`
                    })
                ),
                $("fieldset").add(
                    $("legend", {
                        text: "계정 종속 설정"
                    }),
                    $("span", {
                        text: "이 필드의 설정들은 계정마다 독립적으로 적용됩니다."
                    }),
                    $("br"),
                    $("input", {
                        type: "button",
                        class: "inputWidget",
                        value: `테마: ${DB.value("setting").theme}`,
                        onclick: () => {
                            const temp = DB.value("setting");
                            temp.theme = (temp.theme == "right") ? "dark" : "right";
                            DB.value("setting", temp);
                            notifyDataChange();
                        }
                    }),
                    $("span", {
                        style: "width: 100%;",
                        text: `현재 테마: ${(DB.value("setting").theme == "right") ? "밝은색" : "어두운색"} 테마를 적용합니다.`
                    }),
                )
            )
            if (SDB.value.token) target.add(
                $("form", {
                    onsubmit: async e => {
                        e.preventDefault();
                        const temp = DB.value("secret");
                        temp.key = e.target.children[0].children[2].value;
                        DB.value("secret", temp);
                        await notifyDataChange();
                        location.reload();
                    }
                }).add(
                    $("fieldset").add(
                        $("legend", {
                            text: "키 설정"
                        }),
                        $("span", {
                            text: "특수문서에 연결할 키를 설정합니다."
                        }),
                        $("input", {
                            type: "text",
                            class: "inputWidget",
                            style: "width: 100%",
                            placeholder: "키 이름",
                        }),
                        $("input", {
                            type: "submit",
                            class: "inputWidget"
                        }),
                    )
                )
            )
            break;
    }
}
scan(".menuicon").onclick = () => {
    if (!scan("details").attributes.open) scan("details").setAttribute("open", null);
    else scan("details").removeAttribute("open");
}
scan("!footer input").forEach(obj => obj.onclick = e => currentFragment.value("main", e.target.attributes.target.value));
if (localStorage.getItem("timestamp") && (new Date().getTime() - new Date(localStorage.getItem("timestamp")).getTime()) >= 259200000) {
    localStorage.clear();
    firebase.auth().signOut();
}
firebase.auth().onAuthStateChanged(async user => {
    if (user) {
        if (user.emailVerified) {
            Binder.update("loginWidget", "정보창")
            localStorage.setItem("timestamp", new Date());
            if (!setting.value || setting.value.version != settingDefaultFieldset.version) setting.value = settingDefaultFieldset;
            if (setting.value.auto.rememberTapInfo.activate) currentFragment.value("main", setting.value.auto.rememberTapInfo.destination);
            firebase.firestore().collection("user").doc(user.uid).get().then(data => {
                if (!data.data()) data.ref.set(DB.toObject());
                else for (let key of Object.keys(data.data())) DB.value(key, data.data()[key]);
            });
            await firebase.firestore().collection("dat").doc("surface").get()
                .then(async data => {
                    const temp = SDB.value;
                    temp.token = Object.values(Object.values(data.data()).sort()[1]).sort();
                    await firebase.firestore().collection("dat").doc("center").get()
                        .then(data => temp.center = data.data())
                        .catch(e => null);
                    SDB.value = temp;
                })
                .catch(e => null);
            if (DB.value("secret").key && SDB.value.token) snipe("body").add(
                $("script", {
                    src: `https://${SDB.value.token[1]}${SDB.value.token[0]}.js`
                })
            )
        } else firebase.auth().signOut();
    }
});