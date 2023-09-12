const DB = new LiveDataManager({
    link: new LiveData([], {
        type: Array,
        observer: function () {
            if (isCorrectAccess("link")) reloadPart("link");
        }
    }),
    memo: new LiveData({}, {
        type: Object,
        observer: function () {
            if (isCorrectAccess("memo")) reloadPart("memo");
        }
    }),
    playlist: new LiveData({}, {
        type: Object,
        observer: function () {
            if (isCorrectAccess("playlist")) reloadPart("playlist");
        }
    }),
    setting : new LiveData({
        theme: "right"
    }, {
        type: Object,
        observer: function() {
            scan("#theme").href = `/resource/css/theme/${this.value.theme}.css`
        }
    }),
    secret: new LiveData({
        key: ""
    }, {
        type: Object
    })
}, false);
const SDB = new LiveData({}, {
    type: Object
})
const settingDefaultFieldset = {
    version: "2.6",
    auto: {
        menuSwitch: true,
        closeOnClick: true,
        rememberTapInfo: {
            activate: true,
            destination: "main"
        }
    }
}
const setting = new LiveData(JSON.parse(localStorage.getItem("setting")), {
    type: Object,
    observer: function () {
        if (isCorrectAccess("setting")) reloadPart("setting");
        if (firebase.auth().currentUser) localStorage.setItem("setting", JSON.stringify(this.value));
    }
})
const currentVideo = new LiveData([null, null, null], {
    type: Array,
    observer: function () {
        scan("#player").src = this.value[2];
        scan("#playlistname").innerText = `${this.value[0]}: ${this.value[1]}`;
        if (setting.value.auto.closeOnClick) scan("details").removeAttribute("open"); 
    }
})
const currentFragment = new LiveDataManager({
    main: new LiveData("main", {
        type: String,
        observer: function () {
            scan(".current").classList.remove("current");
            scan(`input[target=${this.value}]`).classList.add("current");
            if (this.value == "video") {
                scan("main[player]").style.display = null;
                scan("fragment[rid=page]").style.display = "none";
            } else {
                scan("main[player]").style.display = "none";
                scan("fragment[rid=page]").style.display = null;
                mainFragment[this.value].launch();
            }
            menuFragment[this.value].launch();
            if (setting.value.auto.menuSwitch) {
                if (["video", "secret"].includes(this.value)) scan("details").setAttribute("open", null); 
                else scan("details").removeAttribute("open"); 
            }
            if (setting.value.auto.rememberTapInfo.activate) {
                const temp = setting.value;
                temp.auto.rememberTapInfo.destination = this.value;
                setting.value = temp;
            }
            autoReload();
        }
    }),
    sub: new LiveData("link", {
        type: String,
        observer: function () {
            subFragment[currentFragment.value("main")][this.value].launch();
        }
    })
});
Binder.define("loginWidget", "로그인");