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
                const target = {
                    link: subFragment.main.링크.fragment[0].reset(),
                    memo: subFragment.main.메모.fragment[0].reset(),
                    info: subFragment.main.설정.fragment[0].reset(),
                    video: menuFragment.video.fragment[1].reset()
                }
                template.link.forEach((link, index) => target.link.add(
                    $("div", {
                        class: "chat",
                        idx: `a${index}`
                    }).add(
                        $("a", {
                            href: link.data[0],
                            text: link.data[0],
                            target: "_blank()"
                        }),
                        $("hr"),
                        $("input", {
                            style: "width: 100%; height: 40px",
                            value: link.data[1]
                        }),
                        $("div", {
                            class: "chatGroup"
                        }).add(
                            $("input", {
                                type: "button",
                                class: "chatButton",
                                style: "background-image: url(resource/img/icon/edit.png)",
                                onclick: async e => {
                                    template.link[index].data[1] = scan(`[idx=a${index}] input`).value;
                                    DB.value("link", template.link);
                                    await notifyDataChange();
                                    makeToast("해당 링크의 설명을 성공적으로 변경하였습니다.");
                                }
                            }),
                            $("input", {
                                type: "button",
                                class: "chatButton",
                                style: "background-image: url(resource/img/icon/del.png)",
                                onclick: async e => {
                                    if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) {
                                        template.link.splice(index, 1);
                                        DB.value("link", template.link);
                                        await notifyDataChange();
                                        makeToast("해당 링크를 성공적으로 삭제하였습니다.");
                                    }
                                }
                            })
                        )
                    ))
                )
                template.memo.forEach((memo, index) => target.memo.add(
                    $("div", {
                        class: "chat",
                        idx: `a${index}`
                    }).add(
                        $("textarea", {
                            style: "width: 100%; height: 120px",
                            spellcheck: "false",
                            value: memo
                        }),
                        $("div", {
                            class: "chatGroup"
                        }).add(
                            $("input", {
                                type: "button",
                                class: "chatButton",
                                style: "background-image: url(resource/img/icon/edit.png)",
                                onclick: async e => {
                                    template.memo[index] = scan(`[idx=a${index}] textarea`).value;
                                    DB.value("memo", template.memo);
                                    await notifyDataChange();
                                    makeToast("해당 기억할 것을 성공적으로 변경하였습니다.");
                                }
                            }),
                            $("input", {
                                type: "button",
                                class: "chatButton",
                                style: "background-image: url(resource/img/icon/del.png)",
                                onclick: async e => {
                                    if (confirm("정말로 해당 기억할 것을 삭제하시겠습니까?")) {
                                        template.memo.splice(index, 1);
                                        DB.value("memo", template.memo);
                                        await notifyDataChange(db);
                                        makeToast("해당 기억할 것을 성공적으로 삭제하였습니다.");
                                    }
                                }
                            })
                        )
                    ))
                )
                for (let key of Object.keys(template.playlist).sort()) {
                    const listcase = $("fieldset", {
                        style: "width: 100%; margin-left: 0px;"
                    }).add(
                        $("legend", {
                            text: key
                        }),
                        $("form", {
                            onsubmit: e => {
                                e.preventDefault();
                                if (Object.values(template.playlist[e.target.parentElement.children[0].innerText]).includes(e.target[0].value)) makeToast("해당 재생목록은 이미 재생목록 바구니 내에 존재합니다.");
                                else if (e.target[0].value) {
                                    template.playlist[key][e.target[0].value] = e.target[0].value;
                                    DB.value("playlist", template.playlist);
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
                                if (confirm("정말 해당 재생목록 바구니를 삭제하시겠습니까?")) {
                                    delete template.playlist[key];
                                    DB.value("playlist", template.playlist);
                                    notifyDataChange();
                                }
                            }
                        }),
                        $("ul")
                    );
                    for (let value of Object.keys(template.playlist[key]).sort()) {
                        listcase.children(3).add(
                            $("li").add(
                                $("a", {
                                    text: value,
                                    style: "width: 100%; display: inline-block;",
                                    href: template.playlist[key][value],
                                    onclick: e => {
                                        e.preventDefault();
                                        const href = e.target.href.includes("list=") ? `${e.target.href.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1` : e.target.href.replace("m.", "www.").replace("watch?v=", "embed/").split("&")[0];
                                        scan("main iframe").src = href;
                                        scan("main span").innerText = `${key}: ${value}`;
                                        scan("[rid=menu]").removeAttribute("open");
                                    }
                                }),
                                $("input", {
                                    type: "button",
                                    class: "inputWidget",
                                    value: "이름 수정",
                                    onclick: () => {
                                        const name = prompt("재생목록의 이름을 뭘로 변경하시겠습니까?");
                                        if (template.playlist[key][name]) makeToast("해당 이름은 이미 재생목록 바구니 내에 존재합니다.");
                                        else if (name) {
                                            template.playlist[key][name] = template.playlist[key][value];
                                            delete template.playlist[key][value];
                                            DB.value("playlist", template.playlist);
                                            notifyDataChange(data);
                                        }
                                    }
                                }),
                                $("input", {
                                    type: "button",
                                    class: "inputWidget",
                                    value: "재생목록 삭제",
                                    onclick: () => {
                                        if (confirm("정말 해당 재생목록을 삭제하시겠습니까?\n(해당 결정은 되돌릴 수 없습니다.)")) {
                                            delete template.playlist[key][value];
                                            DB.value("playlist", template.playlist);
                                            notifyDataChange(data);
                                        }
                                    }
                                })
                            )
                        )
                    }
                    target.video.add(listcase)
                }
                target.info.add(
                    $("img", {
                        style: "width: 60px; height: 60px"
                    }),
                    $("input", {
                        style: "height: 60px; position: absolute; padding-left: 10px",
                        spellcheck: "false",
                        value: template.name
                    }),
                    $("div").add(
                        $("span", {
                            html: `당신의 uid는 <span style="color: red; font-weight: bold;">${firebase.auth().currentUser.uid}</span>입니다.<br><span style="color: red">절대 가볍게 다른 사람들에게 알려주지 마세요.</span>`
                        })
                    ),
                    $("hr"),
                    $("input", { 
                        type: "button",
                        class: "inputWidget",
                        style: "display: block; background-image: url('/resource/img/icon/lock.png')", 
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
                        style: "display: block; background-image: url('/resource/img/icon/setting.png')", 
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
                        style: "display: block; background-image: url('/resource/img/icon/del.png')", 
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
                for (let key of Object.keys(template)) DB.value(key, template[key]);
            }),
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
                })
                .catch(e => null);
            menuFragment.main.launch();
            mainFragment.main.launch();
            scan("!footer div input").forEach(obj => obj.onclick = e => current.value("tab", e.target.attributes.target.value));
        } else firebase.auth().signOut();
    }
});