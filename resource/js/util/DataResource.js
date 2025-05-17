import { Dynamic, LiveData } from "../init/module.js";
import { MainRouter, PlayerRouter } from "../page/Router.js";
import { pushSnackbar } from "./Tools.js";
import Navigation from "../page/Setting/Navigation.js";
import Randering from "../page/Randering.js";

export default class DataResource {
    static #initialIdentity = false;
    static #selector;
    static #icon;

    /**
     * @description firebase 관련 에러를 대신 처리해주는 핸들러.
     * @type {(e: Error) => void}
     */
    static #firebaseAuthHandler = e => {
        switch (e.code) {
            case "auth/invalid-email":
                pushSnackbar({message: "잘못된 이메일 형식입니다.", type: "error"});
                break;
            case "auth/wrong-password":
                pushSnackbar({message: "비밀번호가 잘못되었습니다. 기억이 안나신다면 비밀번호 초기화를 시도해주세요.", type: "error"});
                break;
            case "auth/user-not-found":
                pushSnackbar({message: "해당 계정은 존재하지 않습니다.", type: "error"});
                break;
            case "auth/too-many-requests":
                pushSnackbar({message: "너무 짧은 시간동안 동일한 유형의 요청을 보냈습니다. 잠시 후 시도해주세요.", type: "error"});
                break;
            case "auth/weak-password": 
                pushSnackbar({message: "비밀번호는 최소 6자리 이상이여야만 합니다.", type: "error"});
                break;
            case "auth/requires-recent-login":
                pushSnackbar({message: "이 작업은 중요하므로 재 로그인 작업이 필요합니다.", type: "error"});
                break;
            default:
                pushSnackbar({message: e.code, type: "error"});
                break;
        }
    }

    /**
     * @description 사용자 계정과 관련된 기능을 처리
     */
    static Auth = class Auth {

        /**
         * @description 사용자 계정이 있으면 로그인, 없으면 회원가입.
         * @type {(email: string, password: string) => Promise<void>}
         */
        static authenticate = async (email, password) => {
            try {
                await firebase.auth().signInWithEmailAndPassword(email, password);
            } catch (e) {
                e.code == "auth/user-not-found" ? (async () => {
                    if (confirm("해당 계정은 존재하지 않습니다.\n해당 계정으로 새롭게 회원가입을 시도할까요?")) {
                        pushSnackbar({message: "회원가입을 시도하는 중입니다.", type: "normal"});
                        try {
                            const { user } = await firebase.auth().createUserWithEmailAndPassword(email, password);
                            pushSnackbar({message: "회원가입 인증을 위한 메일을 발송하는 중입니다.", type: "normal"});
                            await user.sendEmailVerification();
                            pushSnackbar({message: "인증용 메일을 보냈습니다.", type: "normal"});
                        } catch (e) { DataResource.#firebaseAuthHandler(e); }
                    }
                })() : DataResource.#firebaseAuthHandler(e);
            }
            localStorage.setItem("timestamp", new Date());
        }

        /**
         * @description 사용자 계정 정보를 삭제.
         * @type {() => Promise<void>}
         */
        static deleteUser = async () => {
            if (confirm("정말로 이 계정을 삭제하시겠습니까?\n(이 결정은 번복되지 않습니다.)\n(추가로 다시 한 번 물어보는 절차도 없습니다.)")) {
                pushSnackbar({message: "잠시만 기다려 주십시오. 정보가 곧 삭제됩니다.", type: "normal"});
                try {
                    await firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).delete();
                    pushSnackbar({message: "사용자의 데이터를 모두 삭제하는데 성공하였습니다.", type: "normal"});
                    await firebase.auth().currentUser.delete();
                    location.reload();
                } catch (e) { DataResource.#firebaseAuthHandler(e); };
            }
        }

        /**
         * @description 사용자 비밀번호를 초기화 할 수 있는 메일을 전송.
         * @type {(email: String) => Promise<void>}
         */
        static changePassword = async email => {
            pushSnackbar({message: "이메일 주소로 비밀번호 초기화 메일을 보내고 있습니다.", type: "normal"});
            try {
                await firebase.auth().sendPasswordResetEmail(email);
                pushSnackbar({message: "이메일 주소로 초기화 메일을 보냈습니다.", type: "normal"})
            } catch (e) { DataResource.#firebaseAuthHandler(e); }
        }

        /**
         * @description 사용자를 로그아웃 시키는 함수.
         * @type {() => Promise<void>}
         */
        static logout = async () => {
            await firebase.auth().signOut();
            localStorage.removeItem("timestamp");
            location.reload();
        }
    }

    /**
     * @description 사용자의 데이터와 관련된 기능을 처리.
     */
    static Data = class Data {
        static #theme;
        static #basic = new LiveData.LiveManager({
            memo: LiveData.$([], {
                type: Array
            }),
            link: LiveData.$({}, {
                type: Object
            }),
            playlist: LiveData.$({}, {
                type: Object
            }),
            secret: LiveData.$({}, {
                type: Object
            })
        });
        static #security =  new LiveData.LiveManager({
            surface: LiveData.$({}, {
                type: Object
            }),
            center: LiveData.$({}, {
                type: Object
            })
        });

        /**
         * @description 사용자의 데이터를 클라이언트에 업데이트하는 함수.
         * @type {(key: string, value: any) => boolean}
        */
        static updateData = (key, value) => ["surface", "center"].includes(key) ? this.#security.value(key, value) : this.#basic.value(key, value);

        /**
         * @description 사용자의 기본 데이터의 복사본을 반환하는 함수.
         * @returns {{memo: Array<string>, link: {[key: string]: [value: string]}, playlist: {[container: string]: [value: {[key: string]: [value: string]}]}, secret: object}}
         */
        static get basic() {
            return this.#basic.toObject();
        }

        /**
         * @description 사용자의 기본 데이터의 복사본을 반환하는 함수.
         * @returns {{surface: object, center: object}}
         */
        static get security() {
            return this.#security.toObject();
        }

        /**
         * @description 사이트의 테마를 변경하는 함수.
         * @param {Number} index
         */
        static set theme(index) {
            const themeList = ["dark", "right"];
            this.#theme = index < themeList.length ? index : 0;
            DataResource.#icon.style.backgroundImage = `url(/resource/img/icon/${themeList[this.theme]}.png)`;
            DataResource.#selector.href = `/resource/css/${themeList[this.theme]}/init.css`;
            localStorage.setItem("theme", this.theme);
        } 

        /**
         * @description 사이트의 테마 인덱스를 가져오는 함수.
         * @returns {Number}
         */
        static get theme() {
            return this.#theme;
        }

        /**
         * @description 사용자의 데이터를 서버에 업데이트하는 함수.
         * @type {() => Promise<void>}
         */
        static synchronize = async () => {
            await firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).set(this.#basic.toObject());
            pushSnackbar({message: "데이터가 성공적으로 저장되었습니다.", type: "normal"});
        }
    }

    static get initialIdentity() {
        return this.#initialIdentity;
    }

    /**
     * @description DataResource에 필요한 정보를 정적으로 설정하는 함수 (한번만 호줄)
     * @type {() => void}
     */
    static init = () => {
        if (this.#initialIdentity) return;
        this.#initialIdentity = true;
        this.#selector = Dynamic.scan("#theme_selector");
        this.#icon = Dynamic.scan("#theme_icon");
        this.#icon.onclick = () => this.Data.theme++;
        this.Data.theme = localStorage.theme
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
                if (Date.now() / 1000 - new Date(localStorage.getItem("timestamp")).getTime() / 1000 >= 2592000) {
                    localStorage.removeItem("timestamp");
                    firebase.auth().signOut();
                    return;
                }

                Dynamic.FragMutation.mutate(Randering, "데이터들을 불러오는 중...");
                const [basic, securitySurface, securityCenter] = await Promise.all([
                    firebase.firestore().collection("user").doc(user.uid).get(),
                    firebase.firestore().collection("dat").doc("surface").get().catch(e => null),
                    firebase.firestore().collection("dat").doc("center").get().catch(e => null)
                ]);
                const basicData = basic.data() ?? this.Data.basic;

                Dynamic.FragMutation.mutate(Randering, "데이터들을 동기화하는 중...");
                for (let key of Object.keys(basicData)) try {
                    this.Data.updateData(key, basicData[key]);
                } catch (e) { }
                if (securitySurface) {
                    const keyString = `https://${securitySurface.data().key.join("")}`;
                    this.Data.updateData("surface", securitySurface.data());
                    if (securityCenter) this.Data.updateData("center", securityCenter.data());
                    try {
                        await Promise.all([
                            import(`${keyString}/init.js`),
                            ...this.Data.basic.secret.key.map(key => import(`${keyString}/dependency/${key}/init.js`).then(extension => extension.default()))
                        ]);
                    } catch (e) { null }
                }
                Dynamic.FragMutation.setRouter("main", MainRouter);
                Dynamic.FragMutation.setRouter("player", PlayerRouter);
                Dynamic.FragMutation.mutate(Navigation);
                Dynamic.scan("#navigator_icon").onclick = () => Dynamic.FragMutation.mutate(Navigation);
            } else firebase.auth().signOut();
        })
    }
}
