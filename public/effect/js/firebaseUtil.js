const firebaseUtil = class {
    /**
    * @type {(target: string) => Promise<void>}
    */
    static sync = async () => {
        localStorage.removeItem("hyperlink");
        localStorage.removeItem("youtube");
        localStorage.removeItem("statistics");
        await firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).update(db);
    }

    /**
     * * @type {(target: string) => Promise<null | object>}
     */
    static get = async target => {
        let info = null;
        if (target == "system") await firebase.firestore().collection("system").doc("dat").get().then(data => { info = data; }).catch(e => { });
        else if (target == "user") await firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).get().then(data => { info = data; }).catch(e => { });
        return info;
    }
}

/**
* @type {() => void}
*/
const signInWithGoogle = () => {
    if (!firebase.auth().currentUser) firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
    else firebase.auth().signOut().then(() => { location.reload(); })
}

/**
* @type {() => Promise<true>}
*/
const waitFirebaseAuthInfo = async () => {
    while (firebase.auth().currentUser == null) await wait(100);
    return true;
}

firebase.initializeApp({
    apiKey: "AIzaSyAglJGn84cPu_YvRUdigYQFCBml-s6kcuo",
    authDomain: "necronomicon-7ba57.firebaseapp.com",
    projectId: "necronomicon-7ba57",
    storageBucket: "necronomicon-7ba57.appspot.com",
    messagingSenderId: "582853710136",
    appId: "1:582853710136:web:c237b2926e7736c707f1cd",
    measurementId: "G-QL8R6QQHGF"
});