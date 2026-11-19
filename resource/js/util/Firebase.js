import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import {
    getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    sendEmailVerification, sendPasswordResetEmail, signOut, deleteUser as deleteFirebaseUser
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";
import {
    getFirestore, doc, getDoc, getDocFromServer, setDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const app = initializeApp({
    apiKey: "AIzaSyAglJGn84cPu_YvRUdigYQFCBml-s6kcuo",
    authDomain: "necronomicon-7ba57.firebaseapp.com",
    projectId: "necronomicon-7ba57",
    storageBucket: "necronomicon-7ba57.appspot.com",
    messagingSenderId: "582853710136",
    appId: "1:582853710136:web:c237b2926e7736c707f1cd",
    measurementId: "G-QL8R6QQHGF"
});
const auth = getAuth(app);
const db = getFirestore(app);

export {
    auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    sendEmailVerification, sendPasswordResetEmail, signOut, deleteFirebaseUser,
    doc, getDoc, getDocFromServer, setDoc, deleteDoc
};
