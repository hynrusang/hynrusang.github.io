const settingDefaultFieldset = {
    version: "2.12",
    auto: {
        menuSwitch: true,
        closeOnClick: true,
        rememberTapInfo: {
            activate: true,
            destination: "main"
        }
    }
}
const setting = new LiveData({auto: settingDefaultFieldset.auto}, {
    type: Object,
    observer: function () {
        if (this.value) {
            reloadSetting();
            if (firebase.auth().currentUser) localStorage.setItem("setting", JSON.stringify(this.value));
        }
    }
})
const current = new LiveDataManager({
    video: new LiveData([null, null, null], {
        type: Array,
        observer: function () {
            scan("main iframe").src = this.value[2];
            scan("main span").innerText = `${this.value[0]}: ${this.value[1]}`;
            if (setting.value.auto.closeOnClick) scan("[rid=menu]").removeAttribute("open"); 
        }
    }),
    tab: new LiveData("main", {
        type: String,
        observer: function () {
            scan(".current").classList.remove("current");
            scan(`input[target=${this.value}]`).classList.add("current");
            if (this.value == "video") {
                scan("main[player]").style.display = "block";
                scan("fragment[rid=page]").style.display = "none";
            } else {
                scan("main[player]").style = scan("fragment[rid=page]").style = null;
                mainFragment[this.value].launch();
            }
            menuFragment[this.value].launch();
            if (setting.value.auto.menuSwitch) {
                if (["video", "secret"].includes(this.value)) scan("[rid=menu]").setAttribute("open", null); 
                else scan("[rid=menu]").removeAttribute("open"); 
            }
            if (setting.value.auto.rememberTapInfo.activate) {
                const temp = setting.value;
                temp.auto.rememberTapInfo.destination = this.value;
                setting.value = temp;
            }
        }
    })
}, false)
const DB = new LiveDataManager({
    main: new LiveData({
        link: {},
        memo: {}
    }, {
        type: Object,
        observer: function () {
            const target = [subFragment.main.link.fragment[0].children(3).reset(), subFragment.main.memo.fragment[0].reset()];
            for (let key of Object.keys(this.value.link).sort()) target[0].add(
                $("li").add(
                    $("img", {
                        src: `https://www.google.com/s2/favicons?domain=${this.value.link[key]}`
                    }),
                    $("a", {
                        text: key, 
                        href: this.value.link[key], 
                        style: "cursor:pointer",
                        target: "_blank"
                    }),
                    $("br"),
                    $("input", {
                        type: "button",
                        class: "inputWidget",
                        style: "padding-left: 8px; padding-right: 8px",
                        value: "이름변경",
                        onclick: () => {
                            const name = prompt("링크의 이름을 뭘로 변경하시겠습니까?\n추천양식) 분류: 이름");
                            if (this.value.link[name]) makeToast("해당 이름은 이미 링크목록 내에 존재합니다.");
                            else if (name) {
                                const temp = this.value;
                                temp.link[name] = temp.link[key];
                                delete temp.link[key];
                                this.value = temp;
                                notifyDataChange();
                            }
                        }
                    }),
                    $("input", {
                        type: "button",
                        class: "inputWidget",
                        style: "padding-left: 8px; padding-right: 8px",
                        value: "제거",
                        onclick: () => {
                            if (confirm("정말로 해당 링크를 삭제하시겠습니까?")) {
                                const temp = this.value
                                delete temp.link[key];
                                this.value = temp;
                                notifyDataChange();
                            }
                        }
                    })
                )
            )
            for (let memo of Object.keys(this.value.memo).sort()) {
                target[1].add(
                    $("option", {
                        text: memo
                    })
                )
            }
        }
    }),
    playlist: new LiveData({}, {
        type: Object,
        observer: function () {
            const target = menuFragment.video.fragment[1].reset();
            for (let key of Object.keys(this.value).sort()) {
                const listcase = $("fieldset", {
                    style: "width: 100%; margin-left: 0px;"
                }).add(
                    $("legend", {
                        text: key
                    }),
                    $("form", {
                        onsubmit: e => {
                            e.preventDefault();
                            if (Object.values(this.value[e.target.parentElement.children[0].innerText]).includes(e.target[0].value)) makeToast("해당 재생목록은 이미 재생목록 바구니 내에 존재합니다.");
                            else if (e.target[0].value) {
                                const temp = this.value;
                                temp[key][e.target[0].value] = e.target[0].value;
                                this.value = temp;
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
                                const temp = this.value;
                                delete temp[key];
                                this.value = temp;
                                notifyDataChange();
                            }
                        }
                    }),
                    $("ul")
                );
                for (let value of Object.keys(this.value[key]).sort()) {
                    listcase.children(3).add(
                        $("li").add(
                            $("a", {
                                text: value,
                                style: "width: 100%; display: inline-block;",
                                href: this.value[key][value],
                                onclick: e => {
                                    e.preventDefault();
                                    const href = e.target.href.includes("list=") ? `${e.target.href.replace("m.", "www.").replace("playlist", "embed/videoseries/").replace("watch", "embed/videoseries/")}&amp;loop=1&autoplay=1` : e.target.href.replace("m.", "www.").replace("watch?v=", "embed/").split("&")[0];
                                    current.value("video", [key, value, href]);
                                }
                            }),
                            $("input", {
                                type: "button",
                                class: "inputWidget",
                                value: "이름 수정",
                                onclick: () => {
                                    const name = prompt("재생목록의 이름을 뭘로 변경하시겠습니까?");
                                    if (this.value[key][name]) makeToast("해당 이름은 이미 재생목록 바구니 내에 존재합니다.");
                                    else if (name) {
                                        const temp = this.value;
                                        temp[key][name] = temp[key][value];
                                        delete temp[key][value];
                                        this.value = temp;
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
                                        const temp = this.value;
                                        delete temp[key][value];
                                        this.value = temp;
                                        notifyDataChange();
                                    }
                                }
                            })
                        )
                    )
                }
                target.add(listcase)
            }
        }
    }),
    setting : new LiveData({
        theme: "right"
    }, {
        type: Object,
        observer: function() {
            reloadSetting();
            scan("#theme").href = `/resource/css/theme/${this.value.theme}.css`;
        }
    }),
    secret: new LiveData({
        key: ""
    }, {
        type: Object
    })
}, false);
const SDB = new LiveData({})
Binder.define("loginWidget", "로그인");