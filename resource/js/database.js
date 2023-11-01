let targetUID = "";
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
    }),
    chatroom: new LiveData([], {
        type: Array
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
    chat: new LiveData("", {
        type: String,
        observer: function () {
            if (this.unsubscribe) this.unsubscribe();
            if (this.value) {
                this.unsubscribe = firebase.firestore().collection("chat").doc(this.value).collection("enroll").onSnapshot(snapshot => {
                    snapshot.forEach(data => {
                        console.log(data.data())
                    })
                })
            }
        }
    }),
    tab: new LiveData("main", {
        type: String,
        observer: function () {
            if (this.value == "chatroom") {
                mainFragment[this.value].launch();
            } else {
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
                current.value("chat", "")
            }
        }
    })
})