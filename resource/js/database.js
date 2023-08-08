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