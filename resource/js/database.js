const settingDefaultFieldset = {
    version: "2.8",
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
            reloadPart("setting");
            if (firebase.auth().currentUser) localStorage.setItem("setting", JSON.stringify(this.value));
        }
    }
})
const DB = new LiveDataManager({
    main: new LiveData({
        link: [],
        memo: {}
    }, {
        type: Object,
        observer: function () {
            reloadPart("main");
        }
    }),
    playlist: new LiveData({}, {
        type: Object,
        observer: function () {
            reloadPart("playlist");
        }
    }),
    setting : new LiveData({
        theme: "right"
    }, {
        type: Object,
        observer: function() {
            reloadPart("setting");
            scan("#theme").href = `/resource/css/theme/${this.value.theme}.css`
        }
    }),
    secret: new LiveData({
        key: ""
    }, {
        type: Object
    })
}, false);
const SDB = new LiveData({})
const currentVideo = new LiveData([null, null, null], {
    type: Array,
    observer: function () {
        scan("main iframe").src = this.value[2];
        scan("main span").innerText = `${this.value[0]}: ${this.value[1]}`;
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