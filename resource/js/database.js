const DB = new LiveDataManager({
    uname : new LiveData("anonymous", {
        type: String,
        observer: function () {
            Binder.update("uname", this.value)
        }
    }),
    mlink: new LiveData([], {
        type: Array,
        observer: function () {
            if (isCorrectAccess("mlink")) reloadPart("mlink");
        }
    }),
    memo: new LiveData({}, {
        type: Object,
        observer: function () {
            if (isCorrectAccess("memo")) reloadPart("memo");
        }
    }),
    ylist: new LiveData({}, {
        type: Object,
        observer: function () {
            if (isCorrectAccess("ylist")) reloadPart("ylist");
        }
    }),
    setinfo: new LiveData({
        auto: {
            menuSwitch: true,
            closeOnClick: true,
            rememberTapInfo: true
        },
    }, {
        type: Object,
        observer: function () {
            if (isCorrectAccess("setting")) reloadPart("setting")
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
Binder.define("uname", DB.value("uname"));
if (!localStorage.getItem("setting")) localStorage.setItem("setting", JSON.stringify({
    menuSwitch: true,
    closeOnClick: true,
    rememberTapInfo: true
}));
const notifyDataChange = () => firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).update(DB.toObject());