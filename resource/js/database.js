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
    secret: new LiveData({
        key: ""
    }, {
        type: Object
    })
}, false);
const SDB = new LiveData(null, {
    type: Object
})
const currentVideo = new LiveData([null, null, null], {
    type: Array,
    observer: function () {
        scan("#player").src = this.value[2];
        scan("#playlistname").innerText = `${this.value[0]}: ${this.value[1]}`;
        if (settingInfo.value.auto.closeOnClick) scan("details").removeAttribute("open"); 
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
            if (settingInfo.value.auto.menuSwitch) {
                if (["video", "secret"].includes(this.value)) scan("details").setAttribute("open", null); 
                else scan("details").removeAttribute("open"); 
            }
            if (settingInfo.value.auto.rememberTapInfo.activate) {
                const newSetting = settingInfo.value;
                newSetting.auto.rememberTapInfo.destination = this.value;
                settingInfo.value = newSetting;
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
const isLoggedIn = new LiveData(false, {
    type: Boolean,
    observer: () => Binder.update("loginWidget", "정보창")
})
Binder.define("loginWidget", "로그인");
const settingInfo = new LiveData(null, {
    type: Object,
    observer: function () {
        if (isCorrectAccess("setting")) reloadPart("setting");
        localStorage.setItem("setting", JSON.stringify(this.value));
    }
})