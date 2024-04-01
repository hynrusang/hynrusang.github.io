import Login from "../page/Login.js";
import Navigation from "../page/Navigation.js";
import { formParser, pushSnackbar } from "./Tools.js";

const AuthManagement = class {
    static #logined = false;

    static #register = async (email, password) => {
        if (confirm("해당 계정은 존재하지 않습니다.\n해당 계정으로 새롭게 회원가입을 시도할까요?")) {
            pushSnackbar({message: "회원가입을 시도하는 중입니다.", type: "normal"});
            try {
                pushSnackbar({message: "회원가입 인증을 위한 메일을 발송하는 중입니다.", type: "normal"});
                const { user } = await firebase.auth().createUserWithEmailAndPassword(email, password);
                await user.sendEmailVerification();
                pushSnackbar({message: "인증용 메일을 보냈습니다.", type: "normal"});
            } catch (e) {
                if (e.code == "auth/weak-password") pushSnackbar({message: "비밀번호는 최소 6자리 이상이여야만 합니다.", type: "error"});
                else console.log(e);
            }
        }
    }

    static login = async (email, password) => {
        await firebase.auth().signInWithEmailAndPassword(email, password).then(({user}) => {
            if (!user.emailVerified) {
                pushSnackbar({message: "인증되지 않은 계정입니다. 해당 이메일로 가서 인증해주세요.", type: "error"})
                user.sendEmailVerification()
                    .then(() => pushSnackbar({message: "인증용 메일을 다시 보냈습니다.", type: "normal"}))
                    .catch(e => { 
                        if (e.code == "auth/too-many-requests") pushSnackbar({message: "현재 요청이 너무 많아 요청을 보류중입니다. 잠시 후 다시 시도해주세요.", type: "error"});
                    });
            }
        }).catch(e => {
            if (e.code == "auth/user-not-found") this.#register(email, password)
            else if (e.code == "auth/wrong-password") pushSnackbar({message: "비밀번호가 잘못되었습니다.", type: "error"});
            else if (e.code == "auth/invalid-email") pushSnackbar({message: "잘못된 이메일 양식입니다.", type: "error"});
            else if (e.code == "auth/internal-error") pushSnackbar({message: "이 사이트에서는 로그인 API를 호출하실 수 없습니다.", type: "error"});
            else console.log(e);
        });
    }
    static logout = async () => {
        await firebase.auth().signOut();
        location.reload();
    }
    static deleteUser = async () => {
        if (confirm("정말로 이 계정을 삭제하시겠습니까?\n(이 결정은 번복되지 않습니다.)\n(추가로 다시 한 번 물어보는 절차도 없습니다.)")) {
            pushSnackbar({message: "잠시만 기다려 주십시오. 정보가 곧 삭제됩니다.", type: "normal"});
            await firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).delete().then(() => pushSnackbar({message: "사용자의 데이터를 모두 삭제하는데 성공하였습니다.", type: "normal"}));
            firebase.auth().currentUser.delete().then(() => location.reload())
            .catch(e => {
                if (e.code == "auth/requires-recent-login") pushSnackbar({message: "계정 삭제 작업은 중요하므로 재 로그인 작업이 필요합니다.", type: "error"});
                else console.log(e);
            });
        }
    }
    static changePassword = email => {
        pushSnackbar({message: "이메일 주소로 비밀번호 초기화 메일을 보내고 있습니다.", type: "normal"});
        firebase.auth().sendPasswordResetEmail(email).then(() => pushSnackbar({message: "이메일 주소로 초기화 메일을 보냈습니다.", type: "normal"}))
        .catch(e => {
            if (e.code == "auth/invalid-email") pushSnackbar({message: "잘못된 이메일 주소입니다.", type: "error"});
            else if (e.code == "auth/user-not-found") pushSnackbar({message: "해당 계정은 존재하지 않습니다.", type: "error"});
        })
    }
    static init = () => {
        firebase.initializeApp({
            apiKey: "AIzaSyAglJGn84cPu_YvRUdigYQFCBml-s6kcuo",
            authDomain: "necronomicon-7ba57.firebaseapp.com",
            projectId: "necronomicon-7ba57",
            storageBucket: "necronomicon-7ba57.appspot.com",
            messagingSenderId: "582853710136",
            appId: "1:582853710136:web:c237b2926e7736c707f1cd",
            measurementId: "G-QL8R6QQHGF"
        });
        firebase.auth().onAuthStateChanged(async user => {
            if (user && user.emailVerified) {
                localStorage.setItem("timestamp", new Date());
                await firebase.firestore().collection("user").doc(user.uid).get().then(data => {
                    let temp = data.data() ? data.data() : DBManagement.DB.basic.toObject();
                    for (let key of Object.keys(temp)) try {
                        DBManagement.DB.basic.value(key, temp[key]);
                    } catch (e) { }
                });
                await firebase.firestore().collection("dat").doc("surface").get().then(async data => {
                    DBManagement.DB.security.value("surface", data.data());
                    firebase.firestore().collection("dat").doc("center").get().then(data => {
                        DBManagement.DB.security.value("center", data.data());
                    }).catch(e => null);
                    const extension = await import(`https://${DBManagement.DB.security.value("surface").key.join("")}/init.js`);
                    extension.default()
                }).catch(e => console.log(e));
                scan("#navigator_icon").onclick = () => DBManagement.delegatePageMove({
                    page: Navigation
                });
                Navigation.launch();
            } else firebase.auth().signOut();
        });
    }

    static get isLogined() {
        return this.#logined;
    }
}

const ThemeManagement = class {
    static #list = ["dark", "right"];
    static #selected;
    static #icon;
    static #selector;

    static init = () => {
        this.#icon = scan("#theme_icon");
        this.#icon.onclick = () => this.theme++;
        this.#selector = scan("#theme_selector");
        this.theme = parseInt(localStorage.getItem("theme"));
    }

    /**
     * @param {number} index
     */
    static set theme(index) {
        this.#selected = index < this.#list.length ? index : 0;
        this.#icon.style.backgroundImage = `url(/resource/img/icon/${this.#list[this.theme]}.png)`;
        this.#selector.href = `/resource/css/${this.#list[this.theme]}/init.css`;
        localStorage.setItem("theme", this.theme);
    }
    static get theme() {
        return this.#selected;
    }
}

const DBManagement = class {
    static #currentPage = "main";
    static #pagelist = {
        main: snipe("fragment[rid=main]"),
        player: snipe("fragment[rid=player]")
    };
    static #pageLaunched = {
        main: null,
        player: null
    }

    static navigator = {};
    static DB = {
        basic: new LiveDataManager({
            memo: new LiveData([], {
                type: Array
            }),
            link: new LiveData({}, {
                type: Object
            }),
            playlist: new LiveData({}, {
                type: Object
            }),
            secret: new LiveData({}, {
                type: Object
            })
        }),
        security: new LiveDataManager({
            surface: new LiveData({}, {
                type: Object
            }),
            center: new LiveData({}, {
                type: Object
            })
        })
    }

    static #refreshMutiFragment = ({page, router}) => {
        Object.values(this.#pagelist).forEach(page => page.node.style.display = "none");
        this.#pagelist[page.rid].node.style.display = null;
        snipe("#router").reset(router);
    }

    static registPage = pageRid => {
        this.#pagelist[pageRid] = $("fragment", {rid: pageRid, style: "display: none;"});
        this.#pageLaunched[pageRid] = null;
        snipe("main").reset(Object.values(this.#pagelist));
    }
    static delegatePageMove = ({page, router}) => {
        const isRidChanged = page.rid != "main" ? this.#currentPage != page.rid : false;
        this.#refreshMutiFragment({page: page, router: router});
        if (!isRidChanged || !this.#pageLaunched[page.rid]) {
            this.#pageLaunched[page.rid] = page;
            page.launch();
        }
        Fragment.launchedFragment = this.#pageLaunched[page.rid];
    }
    static synchronize = () => firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).set(this.DB.basic.toObject());
}

export { AuthManagement, ThemeManagement, DBManagement }