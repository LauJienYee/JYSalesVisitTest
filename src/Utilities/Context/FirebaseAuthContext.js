import React, { createContext, useEffect, useState } from 'react'
import { 
    createUserWithEmailAndPassword, onAuthStateChanged, 
    signInWithEmailAndPassword, signOut
} from 'firebase/auth';
import { auth } from '../../firebase-config';

export const FirebaseAuthContext = createContext();

const FirebaseAuthProvider = ({ children }) => {
    // get logged in user info
    const [currentUser, setCurrentUser] = useState();

    // firebase login logic
    const userLogin = async(email, password) => {
        return await signInWithEmailAndPassword(auth, email, password);
    }

    // firebase logout logic
    const userLogout = async() => {
        return await signOut(auth);
    }

    // firebase register logic
    const userRegister = async(email, password) => {
        return await createUserWithEmailAndPassword(auth, email, password);
    }

    // firebase get logged in user logic
    const getCurrentUser = () => {
        return auth.currentUser;
    }

    useEffect(() => {
        const updateUser = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user)
        })

        return updateUser
    }, [])

    const methods = { currentUser, getCurrentUser, userLogin, userLogout, userRegister };

    return (
        <FirebaseAuthContext.Provider value={ methods }>
            { children }
        </FirebaseAuthContext.Provider>
    )
}

export default FirebaseAuthProvider