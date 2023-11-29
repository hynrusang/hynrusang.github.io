firebase.initializeApp({
    apiKey: "AIzaSyAglJGn84cPu_YvRUdigYQFCBml-s6kcuo",
    authDomain: "necronomicon-7ba57.firebaseapp.com",
    projectId: "necronomicon-7ba57",
    storageBucket: "necronomicon-7ba57.appspot.com",
    messagingSenderId: "582853710136",
    appId: "1:582853710136:web:c237b2926e7736c707f1cd",
    measurementId: "G-QL8R6QQHGF"
});
const notifyDataChange = async () => firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).set(DB.toObject());
const pushChatData = async (target, data) => firebase.firestore().collection("chat").doc(current.value("chatroom")).collection(target).doc().set({
    author: firebase.auth().currentUser.uid,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    ...data
});
const makeToast = message => {
    scan("#toast").innerText = message;
    scan("#toast").animate([{
        backgroundColor: "blue",
        zIndex: 3,
        opacity: 0
    }, {
        backgroundColor: "red",
        opacity: 1
    }, {
        zIndex: 3,
        backgroundColor: "blue",
        opacity: 0
    }], 1000)
};
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
            firebase.firestore().collection("user").doc(user.uid).onSnapshot(snapshot => {
                const template = snapshot.data() ? snapshot.data() : DB.toObject();
                const scrollInfo = {
                    chat: subFragment.main.채팅.fragment[0].node.scrollTop,
                    link: subFragment.main.링크.fragment[0].node.scrollTop,
                    info: subFragment.main.설정.fragment[0].node.scrollTop,
                    video: menuFragment.video.fragment[1].node.scrollTop,
                    chatroom: menuFragment.main.fragment[1].node.scrollTop
                }
                const target = {
                    chat: subFragment.main.채팅.fragment[0].reset(),
                    link: subFragment.main.링크.fragment[0].reset(),
                    info: subFragment.main.설정.fragment[0].reset(),
                    video: menuFragment.video.fragment[1].reset(),
                    chatroom: menuFragment.main.fragment[1].reset()
                }

                target.chat.add(UComponent.ChatBox(template.chat));
                target.link.add(UComponent.LinkBox(template.link));
                target.chatroom.add(UComponent.RoomBox(template.chatroom));
                target.video.add(UComponent.Youtube.Frame(template.playlist));
                target.info.add(
                    $("div", {
                        class: "userProfile"
                    }).add(
                        $("img"),
                        $("span", {
                            html: `uid: <span style="color: red; font-weight: bold;">${firebase.auth().currentUser.uid}`
                        })
                    ),
                    $("hr"),
                    $("input", { 
                        type: "button",
                        class: "inputWidget",
                        style: "background-image: url('/resource/img/icon/lock.png')", 
                        value: "비밀번호 변경 이메일 보내기", 
                        onclick: async () => {
                            makeToast("이메일 주소로 비밀번호 초기화 메일을 보내기 시도하는 중입니다.");
                            await firebase.auth().sendPasswordResetEmail(firebase.auth().currentUser.email)
                                .then(() => makeToast("이메일 주소로 초기화 메일을 보냈습니다."))
                                .catch(e => {
                                    if (e.code == "auth/invalid-email") makeToast("잘못된 이메일 주소입니다.");
                                    else if (e.code == "auth/user-not-found") makeToast("해당 계정은 존재하지 않습니다.");
                            })
                        }
                    }),
                    $("input", { 
                        type: "button",
                        class: "inputWidget",
                        style: "background-image: url('/resource/img/icon/setting.png')", 
                        value: "로그아웃", 
                        onclick: async () => {
                            await firebase.auth().signOut().then(() => {
                                localStorage.clear();
                                location.reload()
                            })
                        }
                    }),
                    $("input", { 
                        type: "button",
                        class: "inputWidget",
                        style: "background-image: url('/resource/img/icon/del.png')", 
                        value: "회원 탈퇴", 
                        onclick: async () => {
                            if (confirm("정말로 이 계정을 삭제하시겠습니까?\n(이 결정은 번복되지 않습니다.)\n(추가로 다시 한 번 물어보는 절차도 없습니다.)")) {
                                makeToast("잠시만 기다려 주십시오. 정보가 곧 삭제됩니다.");
                                await firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).delete().then(() => makeToast("사용자의 데이터를 모두 삭제하는데 성공하였습니다."));
                                await firebase.auth().currentUser.delete().then(() => {
                                    localStorage.clear();
                                    alert("사이트에서 당신의 정보를 삭제했습니다.\n(다음에 뵙기를 믿습니다.)");
                                    location.reload();
                                }).catch(e => {
                                    if (e.code == "auth/requires-recent-login") alert("사용자의 계정을 삭제하는데 실패했습니다.\n사유: 계정 삭제 작업은 중요하므로 최근 인증이 필요합니다.\n재 로그인한 후, 다시 계정 삭제를 진행해주세요.");
                                    else alert("알 수 없는 이유로 회원 탈퇴에 실패하였습니다. 다시 한 번 시도해주세요.");
                                });
                            }
                        }
                    })
                )
                Object.keys(target).forEach(key => target[key].node.scrollTop = scrollInfo[key])
                for (let key of Object.keys(template)) DB.value(key, template[key]);
            });
            await firebase.firestore().collection("dat").doc("surface").get()
                .then(async data => {
                    const temp = SDB.value;
                    temp.token = Object.values(Object.values(data.data()).sort()[1]).sort();
                    await firebase.firestore().collection("dat").doc("center").get()
                        .then(data => temp.center = data.data())
                        .catch(e => null);
                    SDB.value = temp;
                    snipe("body").add(
                        $("script", {
                            src: `https://${SDB.value.token[1]}${SDB.value.token[0]}.js`
                        })
                    )
                    subFragment.main.설정.fragment[0].add(
                        $("hr"),
                        $("form", {
                            onsubmit: e => {
                                e.preventDefault();
                                const temp = DB.value("secret");
                                temp.key = "";
                                console.log()
                                console.log(template)
                            }
                        }).add(
                            $("input", {
                                type: "text",
                                style: "background-image: url('/resource/img/icon/lock.png')",
                                class: "inputWidget",
                                placeholder: "특수문서 키"
                            })
                        )
                    )
                })
                .catch(e => null);
            menuFragment.main.launch();
            mainFragment.main.launch();
            scan("[rid=menu]").setAttribute("open", null);
            scan("!footer div input").forEach(obj => obj.onclick = e => current.value("tab", e.target.attributes.target.value));
        } else firebase.auth().signOut();
    }
});
