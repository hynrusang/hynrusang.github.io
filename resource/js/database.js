const DB = new LiveDataManager({
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
    secret: new LiveData({
        key: ""
    }, {
        type: Object
    })
}, false);
const isLoggedIn = new LiveData(false, {
    type: Boolean,
    observer: () => Binder.update("loginWidget", "정보창")
})
const SDB = new LiveData(null, {
    type: Object
})
Binder.define("loginWidget", "로그인");
const settingInfo = new LiveData(null, {
    type: Object,
    observer: function () {
        if (isCorrectAccess("setting")) reloadPart("setting");
        localStorage.setItem("setting", JSON.stringify(this.value));
    }
})
const notifyDataChange = () => firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).update(DB.toObject());