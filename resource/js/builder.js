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
const arrayIsEmpty = array => array.reduce((current, obj) => obj != "" ? false : current, true)
const notifyDataChange = async () => firebase.auth().currentUser ? firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).update(DB.toObject()) : makeToast("로그인을 하시지 않으면, 변경 사항이 저장되지 않습니다.");
const makeToast = message => {
    scan("#toast").innerText = message;
    scan("#toast").animate([{
        backgroundColor: "blue",
        opacity: 0
    }, {
        zIndex: 1,
        backgroundColor: "red",
        opacity: 1
    }, {
        backgroundColor: "blue",
        opacity: 0
    }], 1000)
};
const reloadSetting = () => {
    const target = mainFragment.setting.fragment[0]
    mainFragment.setting.fragment[0].reset(
        $("fieldset").add(
            $("legend", {
                text: "브라우저/기기 종속 설정"
            }),
            $("span", {
                text: "이 필드의 설정들은 브라우저/기기의 종류에 따라 독립적으로 적용됩니다.\n또한, 로그아웃 및 버전 업데이트 시, 해당 필드의 설정들은 초기화됩니다."
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
            $("select", {
                class: "inputWidget",
                style: "background: none; color: grey",
                onchange: e => {
                    const temp = DB.value("setting");
                    temp.theme = e.target[e.target.selectedIndex].value;
                    DB.value("setting", temp);
                    notifyDataChange();
                }
            }).add(
                $("option", {
                    text: "다른 버전 테마",
                    selected: null,
                    disabled: null
                }),
                $("option", {
                    text: "v1",
                })
            ),
            $("span", {
                style: "width: 100%;",
                text: `현재 테마: ${(DB.value("setting").theme == "right") ? "밝은색" : (DB.value("setting").theme == "dark") ? "어두운색" : "다른 버전 "} 테마를 적용합니다.`
            })
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
}
scan("!footer div input").forEach(obj => obj.onclick = e => current.value("tab", e.target.attributes.target.value));
scan(".menuicon").onclick = () => {
    if (!scan("[rid=menu]").attributes.open) scan("[rid=menu]").setAttribute("open", null);
    else scan("[rid=menu]").removeAttribute("open");
}
if (localStorage.getItem("timestamp") && (new Date().getTime() - new Date(localStorage.getItem("timestamp")).getTime()) >= 259200000) {
    localStorage.clear();
    firebase.auth().signOut();
}
firebase.auth().onAuthStateChanged(async user => {
    if (user) {
        if (user.emailVerified) {
            Binder.update("loginWidget", "정보창")
            localStorage.setItem("timestamp", new Date());
            setting.value = JSON.parse(localStorage.getItem("setting"));
            if (!setting.value || setting.value.version != settingDefaultFieldset.version) setting.value = settingDefaultFieldset;
            if (setting.value.auto.rememberTapInfo.activate) current.value("tab", setting.value.auto.rememberTapInfo.destination);
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