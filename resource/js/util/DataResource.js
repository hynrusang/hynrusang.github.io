import {
    auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    sendEmailVerification, sendPasswordResetEmail, signOut, deleteFirebaseUser,
    doc, getDoc, getDocFromServer, setDoc, deleteDoc
} from "./Firebase.js";

import { Dynamic, LiveData } from "../init/module.js";
import { MainRouter } from "../page/Router.js";
import { pushProgressSnackbar, pushSnackbar } from "./Tools.js";
import { restoreYConfig } from "../page/Player.js";
import Navigation from "../page/Setting/Navigation.js";
import { MAIN_ROUTER_RIDS } from "../page/PageCatalog.js";
import Working from "../page/Prepare/Working.js";

export default class DataResource {
    static #initialIdentity = false;
    static #auth;
    static #db;
    static #authenticatedSessionOpen = false;
    static #selector;
    static #icon;

    /**
     * @description 인증 사용자가 사라졌을 때 브라우저에 남은 사용자 전용 상태를 모두 폐기합니다.
     * 로그아웃 이후에는 이전 localStorage를 다시 복원하지 않고 서버 데이터만 새로 불러옵니다.
     * @type {() => void}
     */
    static #clearLocalSession = () => localStorage.clear();

    /**
     * @description firebase 관련 에러를 대신 처리해주는 핸들러.
     * @type {(e: Error) => void}
     */
    static #firebaseAuthHandler = e => {
        const errorMessages = {
            "auth/invalid-email": "잘못된 이메일 형식입니다.",
            "auth/admin-restricted-operation": "죄송합니다. 회원가입이 거부되었습니다.",
            "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다.",
            "auth/wrong-password": "비밀번호가 잘못되었습니다. 기억이 안나신다면 비밀번호 초기화를 시도해주세요.",
            "auth/user-not-found": "해당 계정은 존재하지 않습니다.",
            "auth/too-many-requests": "너무 짧은 시간동안 동일한 유형의 요청을 보냈습니다. 잠시 후 시도해주세요.",
            "auth/weak-password": "비밀번호는 최소 6자리 이상이여야만 합니다.",
            "auth/requires-recent-login": "이 작업은 중요하므로 재 로그인 작업이 필요합니다."
        }
        pushSnackbar({ message: errorMessages[e.code] ?? e.code, type: "error" });
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
            const progressSnackbar = pushProgressSnackbar({ message: "로그인 정보를 확인하는 중입니다." });

            // 1. Firebase observer가 로그인 Promise보다 먼저 실행될 수 있으므로 만료 검사 시각을 먼저 기록합니다.
            localStorage.setItem("timestamp", new Date().toISOString());

            try {
                await signInWithEmailAndPassword(DataResource.#auth, email, password);
                progressSnackbar.close("로그인 완료. 사용자 데이터를 불러옵니다.", "normal");
            } catch (e) {
                // 2. 인증에 실패한 시도는 유효한 로그인 세션이 아니므로 선기록한 시각을 제거합니다.
                localStorage.removeItem("timestamp");

                if (e.code == "auth/user-not-found") {
                    progressSnackbar.close("등록된 계정을 찾지 못했습니다.", "error");
                    if (confirm("해당 계정은 존재하지 않습니다.\n해당 계정으로 새롭게 회원가입을 시도할까요?")) {
                        const registerProgress = pushProgressSnackbar({ message: "회원가입을 시도하는 중입니다." });
                        try {
                            const { user } = await createUserWithEmailAndPassword(DataResource.#auth, email, password);
                            registerProgress.update("회원가입 인증 메일을 발송하는 중입니다.");
                            await sendEmailVerification(user);
                            registerProgress.close("인증용 메일을 보냈습니다.", "normal");
                        } catch (err) {
                            registerProgress.close("회원가입 처리에 실패했습니다.", "error");
                            DataResource.#firebaseAuthHandler(err);
                        }
                    }
                } else {
                    progressSnackbar.close("로그인 처리에 실패했습니다.", "error");
                    DataResource.#firebaseAuthHandler(e);
                }
            }
        }

        /**
         * @description 사용자 계정 정보를 삭제.
         * @type {() => Promise<void>}
         */
        static deleteUser = async () => {
            if (!confirm("정말로 이 계정을 삭제하시겠습니까?\n(이 결정은 번복되지 않습니다.)\n(추가로 다시 한 번 물어보는 절차도 없습니다.)")) return;
            
            pushSnackbar({message: "잠시만 기다려 주십시오. 정보가 곧 삭제됩니다.", type: "normal"});
            try {
                await deleteDoc(doc(DataResource.#db, "user", DataResource.#auth.currentUser.uid));
                pushSnackbar({message: "사용자의 데이터를 모두 삭제하는데 성공하였습니다.", type: "normal"});
                await deleteFirebaseUser(DataResource.#auth.currentUser);

                // 계정 삭제가 완료되면 서버 데이터와 별개로 브라우저의 사용자 상태도 남기지 않습니다.
                DataResource.#clearLocalSession();
                location.reload();
            } catch (e) { DataResource.#firebaseAuthHandler(e); };
        }

        /**
         * @description 사용자 비밀번호를 초기화 할 수 있는 메일을 전송.
         * @type {(email: String) => Promise<void>}
         */
        static changePassword = async email => {
            // 계정 설정에서는 현재 사용자 이메일을 사용하고, 로그인 폼에서는 입력된 이메일을 사용합니다.
            email ??= DataResource.#auth.currentUser?.email;
            if (!email) return;
            pushSnackbar({message: "이메일 주소로 비밀번호 초기화 메일을 보내고 있습니다.", type: "normal"});
            try {
                await sendPasswordResetEmail(DataResource.#auth, email);
                pushSnackbar({message: "이메일 주소로 초기화 메일을 보냈습니다.", type: "normal"})
            } catch (e) { DataResource.#firebaseAuthHandler(e); }
        }

        /**
         * @description 사용자를 로그아웃 시키는 함수.
         * @type {() => Promise<void>}
         */
        static logout = async () => {
            try {
                await signOut(DataResource.#auth);

                // 인증 observer도 같은 정리를 수행하지만, 명시적 로그아웃 operation에서도 로컬 폐기를 보장합니다.
                DataResource.#clearLocalSession();
            } catch (e) {
                DataResource.#firebaseAuthHandler(e);
            }
        }
    }

    /**
     * @description 사용자의 데이터와 관련된 기능을 처리.
     */
    static Data = class Data {
        static #theme;
        static #basic = new LiveData.LiveManager({
            memo: LiveData.$([], { type: Array }),
            link: LiveData.$({}, { type: Object }),
            playlist: LiveData.$({}, { type: Object }),
            secret: LiveData.$({}, { type: Object })
        });
        static #security =  new LiveData.LiveManager({
            surface: LiveData.$({}, { type: Object }),
            center: LiveData.$({}, { type: Object })
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

            const selected = themeList[this.#theme]; 
            DataResource.#icon.style.backgroundImage = `url(/resource/img/icon/${selected}.png)`;

            Object.entries(DataResource.#selector).forEach(([key, el]) => {
                el.href = `/resource/css/${selected}/${key}.css`
            })
            localStorage.setItem("theme", this.#theme);
        } 

        /**
         * @description 사이트의 테마 인덱스를 가져오는 함수.
         * @returns {Number}
         */
        static get theme() {
            return this.#theme;
        }

        /**
         * @description 기본 데이터 한 항목을 메모리와 Firestore에 하나의 저장 작업으로 반영합니다.
         * 서버 저장이 실패하면 해당 항목만 이전 값으로 되돌립니다.
         * @type {(key: string, value: any) => Promise<boolean>}
         */
        static commitBasicData = async (key, value) => {
            let previous;
            let changed;

            // 1. rollback 기준을 보존한 뒤 메모리 LiveData에 저장 후보를 적용합니다.
            try {
                previous = this.#basic.value(key);
                changed = this.updateData(key, value);
            } catch (error) {
                console.error(error);
                pushSnackbar({ message: "저장할 데이터 형식이 올바르지 않습니다.", type: "error" });
                return false;
            }

            // 2. 값이 동일하면 외부 저장을 생략하고 성공으로 처리합니다.
            if (!changed) return true;

            // 3. Firestore 저장에 성공한 경우에만 메모리 변경을 확정합니다.
            try {
                await setDoc(doc(DataResource.#db, "user", DataResource.#auth.currentUser.uid), this.#basic.toObject());
                pushSnackbar({ message: "데이터가 성공적으로 저장되었습니다.", type: "normal" });
                return true;
            } catch (error) {
                // 4. 외부 저장 실패 시 이 operation이 변경한 항목만 이전 값으로 복원합니다.
                this.updateData(key, previous);
                console.error(error);
                pushSnackbar({ message: "서버 저장에 실패하여 변경 내용을 되돌렸습니다.", type: "error" });
                return false;
            }
        }

        /**
         * @description 현재 기본 데이터 전체를 Firestore에 저장합니다.
         * @type {() => Promise<boolean>}
         */
        static synchronize = async () => {
            try {
                await setDoc(doc(DataResource.#db, "user", DataResource.#auth.currentUser.uid), this.#basic.toObject());
                pushSnackbar({ message: "데이터가 성공적으로 저장되었습니다.", type: "normal" });
                return true;
            } catch (error) {
                console.error(error);
                pushSnackbar({ message: "데이터를 서버에 저장하지 못했습니다.", type: "error" });
                return false;
            }
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
         const [color, ytv_color] = Dynamic.scan("!.theme");

        this.#initialIdentity = true;
        this.#selector = { color, ytv_color };
        this.#icon = Dynamic.scan("#theme_icon");
        this.#icon.onclick = () => this.Data.theme++;
        this.Data.theme = localStorage.theme;

        // Auth와 Firestore는 공통 Firebase 모듈의 동일한 인스턴스를 사용합니다.
        this.#auth = auth;
        this.#db = db;

        onAuthStateChanged(this.#auth, async user => {
            if (!user) {
                const shouldReload = this.#authenticatedSessionOpen;
                this.#authenticatedSessionOpen = false;

                // 1. 명시적 로그아웃, 토큰 만료, 계정 삭제 등 원인과 관계없이 사용자 상태를 모두 폐기합니다.
                this.#clearLocalSession();

                // 2. 실행 중이던 사용자 화면과 메모리 상태는 reload로 함께 종료합니다.
                // 최초부터 비로그인 상태였던 경우에는 반복 reload를 만들지 않습니다.
                if (shouldReload) location.reload();
                return;
            }

            if (!user.emailVerified) {
                pushSnackbar({ message: "이메일 인증이 완료되지 않아 로그아웃합니다.", type: "error" });
                this.#clearLocalSession();
                return signOut(this.#auth);
            }

            this.#authenticatedSessionOpen = true;

            const authProgress = pushProgressSnackbar({ message: "자동 로그인 상태를 확인하는 중입니다." });
            const authenticatedAt = Date.parse(localStorage.getItem("timestamp"));
            const isExpired = !Number.isFinite(authenticatedAt) || Date.now() - authenticatedAt >= 2592000000;

            if (isExpired) {
                authProgress.close("로그인 유지 시간이 만료되었습니다.", "error");
                this.#clearLocalSession();
                await signOut(this.#auth);
                return;
            }
            
            authProgress.update("사용자 데이터를 불러오는 중입니다.");
            Dynamic.FragMutation.mutate(Working, "데이터들을 불러오는 중...");
            let loadTimeout;
            let basic, securitySurface, securityCenter;
            try {
                // 1. 캐시가 남아 있어도 서버에 연결되지 않는 세션을 정상 로그인으로 처리하지 않습니다.
                // Firestore의 기본 get()은 오프라인에서 캐시를 반환할 수 있으므로 사용자 문서는 서버에서 읽습니다.
                [basic, securitySurface, securityCenter] = await Promise.race([
                    Promise.all([
                        getDocFromServer(doc(this.#db, "user", user.uid)),
                        getDoc(doc(this.#db, "dat", "surface")).catch(e => null),
                        getDoc(doc(this.#db, "dat", "center")).catch(e => null)
                    ]),
                    new Promise((_, reject) => {
                        loadTimeout = setTimeout(() => {
                            const error = new Error("Firestore 초기 데이터 로드 응답 시간 초과");
                            error.code = "deadline-exceeded";
                            reject(error);
                        }, 20000);
                    })
                ]);
            } catch (error) {
                // 2. 이전 계정의 늦은 실패가 새로 로그인한 계정까지 로그아웃시키지 않도록 검사합니다.
                if (this.#auth.currentUser?.uid !== user.uid) return;

                // 3. 서버 연결이 끊기거나 제한 시간 내에 데이터를 읽지 못하면 사용자 세션을 종료합니다.
                // 로그아웃은 Firestore 응답이 아닌 Firebase Auth의 브라우저 인증 상태를 변경합니다.
                console.error("Firestore 사용자 데이터 로드 실패:", error);
                const disconnected = error.code === "unavailable" || error.code === "deadline-exceeded";
                authProgress.close(disconnected
                    ? "Firebase 서버가 응답하지 않아 로그아웃합니다."
                    : "사용자 데이터를 불러오지 못하여 로그아웃합니다.", "error");
                await this.Auth.logout();

                // Auth 자체의 로그아웃이 실패하더라도 이전 사용자의 로컬 데이터는 남기지 않습니다.
                if (this.#auth.currentUser) {
                    this.#clearLocalSession();
                    Dynamic.FragMutation.mutate(Working, "로그아웃에 실패했습니다. 페이지를 닫고 다시 접속해 주세요.");
                }
                return;
            } finally {
                clearTimeout(loadTimeout);
            }

            // 4. 읽는 도중 인증 계정이 바뀌었다면 이전 계정의 데이터를 화면에 적용하지 않습니다.
            if (this.#auth.currentUser?.uid !== user.uid) return;
            const basicData = basic.data() ?? this.Data.basic;

            Dynamic.FragMutation.mutate(Working, "데이터들을 동기화하는 중...");
            Object.keys(basicData).forEach(key => {
                try { this.Data.updateData(key, basicData[key]); } catch { }
            })
            if (securitySurface) {
                const keyString = `https://${securitySurface.data().key.join("")}`;
                this.Data.updateData("surface", securitySurface.data());
                if (securityCenter) this.Data.updateData("center", securityCenter.data());

                try {
                    await Promise.all([
                        import(`${keyString}/init.js`),
                        ...this.Data.basic.secret.key.map(key => import(`${keyString}/dependency/${key}/init.js`).then(extension => extension.default()))
                    ]);
                } catch { }
            }

            // 외부 모듈을 가져오는 동안에도 로그아웃될 수 있으므로 최종 화면 변경 전에 다시 확인합니다.
            if (this.#auth.currentUser?.uid !== user.uid) return;
            Dynamic.scan("#navigator_icon").onclick = () => Dynamic.FragMutation.mutate(Navigation);
            Dynamic.scan("fragment[rid=rander]").remove();
            // Player, Link, Memo는 서로 다른 Fragment로 유지하지만 동일한 하단 라우터를 공유합니다.
            // 화면을 전환해도 숨겨진 Fragment DOM이 보존되어 재생과 편집 상태가 초기화되지 않습니다.
            MAIN_ROUTER_RIDS.forEach(rid => Dynamic.FragMutation.setRouter(rid, MainRouter));
            authProgress.update("화면 구성을 복원하는 중입니다.");

            const savedPlayerInstance = localStorage.getItem("YConfig");
            if (savedPlayerInstance) {
                try {
                    restoreYConfig(JSON.parse(savedPlayerInstance));
                } catch (error) {
                    console.warn("Invalid saved player state", error);
                    localStorage.removeItem("YConfig");
                }
            }

            // 저장된 재생 상태는 복원하되, 최초 진입 화면은 항상 전체 메뉴로 유지합니다.
            Dynamic.FragMutation.mutate(Navigation);
            authProgress.close("로그인 동기화 완료", "normal");
        })
    }
}
