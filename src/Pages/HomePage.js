import React, { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import HomeForm from '../Components/HomeForm';
import { FirebaseAuthContext } from '../Utilities/Context/FirebaseAuthContext';
import './Pages.css'

const HomePage = () => {
    // get logged in user info
    const { getCurrentUser } = useContext(FirebaseAuthContext);
    // navigation
    const navigate = useNavigate();

    useEffect(() => {
        // navigate user to login page if not logged in
        if (getCurrentUser() === null) {
            navigate('/');
        }
    }, [getCurrentUser, navigate])

    return (
        <div className='home-page-container'>
            <HomeForm />
        </div>
    )
}

export default HomePage