let targetUID = "";
const settingDefaultFieldset = {
    version: "3.0",
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
            if (firebase.auth().currentUser) localStorage.setItem("setting", JSON.stringify(this.value));
        }
    }
})
const DB = new LiveDataManager({
    link: new LiveData([], {
        type: Array
    }),
    memo: new LiveData([], {
        type: Array
    }),
    name: new LiveData("anonymous", {
        type: String
    }),
    playlist: new LiveData({}, {
        type: Object,
    }),
    setting : new LiveData({
        theme: "right"
    }, {
        type: Object,
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
const current = new LiveDataManager({
    main: new LiveData("링크", {
        type: String,
        observer: function () {
            scan("#current-main .current").classList.remove("current");
            scan(`#current-main [value=${this.value}]`).classList.add("current")
            subFragment.main[this.value].launch();
        }
    }),
    tab: new LiveData("main", {
        type: String,
        observer: function () {
            scan("footer .current").classList.remove("current");
            scan(`footer [target=${this.value}]`).classList.add("current");
            if (this.value == "video") {
                scan("main[player]").style.display = "block";
                scan("fragment[rid=page]").style.display = "none";
            } else {
                scan("main[player]").style = scan("fragment[rid=page]").style = null;
                mainFragment[this.value].launch();
            }
            menuFragment[this.value].launch();
        }
    })
})