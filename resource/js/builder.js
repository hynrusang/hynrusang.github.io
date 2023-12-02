firebase.initializeApp({
    apiKey: "AIzaSyAglJGn84cPu_YvRUdigYQFCBml-s6kcuo",
    authDomain: "necronomicon-7ba57.firebaseapp.com",
    projectId: "necronomicon-7ba57",
    storageBucket: "necronomicon-7ba57.appspot.com",
    messagingSenderId: "582853710136",
    appId: "1:582853710136:web:c237b2926e7736c707f1cd",
    measurementId: "G-QL8R6QQHGF"
});
const notifyDataChange = async () => firebase.firestore().collection("user").doc(firebase.auth().currentUser.uid).set(DB.toObject());
const pushChatData = async (target, data) => firebase.firestore().collection("chat").doc(current.value("chatroom")).collection(target).doc().set({
    author: firebase.auth().currentUser.uid,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    ...data
});
const makeToast = message => {
    scan("#toast").innerText = message;
    scan("#toast").animate([{
        backgroundColor: "blue",
        zIndex: 3,
        opacity: 0
    }, {
        backgroundColor: "red",
        opacity: 1
    }, {
        zIndex: 3,
        backgroundColor: "blue",
        opacity: 0
    }], 1000)
};
const makeModal = null;
scan(".menuicon").onclick = () => {
    if (!scan("[rid=menu]").attributes.open) scan("[rid=menu]").setAttribute("open", null);
    else scan("[rid=menu]").removeAttribute("open");
}
if (localStorage.getItem("timestamp") && new Date().getTime() - new Date(localStorage.getItem("timestamp")).getTime() >= 259200000) {
    localStorage.clear();
    firebase.auth().signOut();
}
firebase.auth().onAuthStateChanged(async user => {
    if (user) {
        if (user.emailVerified) {
            localStorage.setItem("timestamp", new Date());
            let SDBstance = false;
            await firebase.firestore().collection("user").doc(user.uid).onSnapshot(async snapshot => {
                const template = snapshot.data() ? snapshot.data() : DB.toObject();
                for (let key of Object.keys(template)) DB.value(key, template[key]);
                if (!SDBstance) {
                    await firebase.firestore().collection("dat").doc("surface").get()
                    .then(async data => {
                        SDB.value = data.data();
                        await firebase.firestore().collection("dat").doc("center").get()
                            .then(data => {
                                const temp = SDB.value;
                                temp.center = data.data();
                                SDB.value = temp;
                            })
                            .catch(e => null);
                        snipe("body").add($("script", {
                            src: `https://${SDB.value.key.join("")}.js`,
                        }))
                    })
                    .catch(e => null);
                    SDBstance = true;
                }

                const scrollInfo = {
                    chat: subFragment.main.채팅.fragment[0].node.scrollTop,
                    link: subFragment.main.링크.fragment[0].node.scrollTop,
                    info: subFragment.main.설정.fragment[0].node.scrollTop,
                    video: menuFragment.video.fragment[1].node.scrollTop,
                    chatroom: menuFragment.main.fragment[1].node.scrollTop
                }
                const target = {
                    chat: subFragment.main.채팅.fragment[0].reset(),
                    link: subFragment.main.링크.fragment[0].reset(),
                    info: subFragment.main.설정.fragment[0].reset(),
                    video: menuFragment.video.fragment[1].reset(),
                    chatroom: menuFragment.main.fragment[1].reset()
                }

                target.chat.add(UComponent.ChatBox(template.chat));
                target.link.add(UComponent.LinkBox(template.link));
                target.chatroom.add(UComponent.RoomBox(template.chatroom));
                target.video.add(UComponent.Youtube.Frame(template.playlist));
                target.info.add(UComponent.InfoBox(template.secret));
                Object.keys(target).forEach(key => target[key].node.scrollTop = scrollInfo[key])
            });
            menuFragment.main.launch();
            mainFragment.main.launch();
            scan("[rid=menu]").setAttribute("open", null);
            scan("!footer div input").forEach(obj => obj.onclick = e => current.value("tab", e.target.attributes.target.value));
        } else firebase.auth().signOut();
    }
});
