import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDnztb3RrvmPmo1h1bUFtDFgFdOaztmVss",
  authDomain: "jysalesvisittest.firebaseapp.com",
  databaseURL: "https://jysalesvisittest-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jysalesvisittest",
  storageBucket: "jysalesvisittest.appspot.com",
  messagingSenderId: "377657946416",
  appId: "1:377657946416:web:1021531f847e30ddc118f5",
  measurementId: "G-TWR4WVN812"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);