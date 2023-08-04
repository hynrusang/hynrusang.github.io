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
            if (isCorrectPartLoadTry("mlink")) reloadPart("mlink");
        }
    }),
    memo: new LiveData({}, {
        type: Object,
        observer: function () {
            if (isCorrectPartLoadTry("memo")) reloadPart("memo");
        }
    }),
    ylist: new LiveData({}, {
        type: Object,
        observer: function () {
            if (isCorrectPartLoadTry("ylist")) reloadPart("ylist");
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
            if (isCorrectPartLoadTry("setting")) reloadPart("setting")
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
const notifyDataChange = () => firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).update(DB.toObject());