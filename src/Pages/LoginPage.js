import React, { useContext, useEffect } from 'react'
import LoginForm from '../Components/LoginForm';
import { FirebaseAuthContext } from '../Utilities/Context/FirebaseAuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Pages.css'

const LoginPage = () => {
    // get logged in user info
    const { getCurrentUser } = useContext(FirebaseAuthContext);
    // navigation
    const navigate = useNavigate();
    // query string for parentDealId
    const [searchParams] = useSearchParams();
    const params = Object.fromEntries([...searchParams]);

    useEffect(() => {
        // navigate user to form page if logged in
        if (getCurrentUser() !== null) {
            if (params['parentDealId']) {
                // navigate to feedback form if parentDealId exists
                navigate(`/feedback?parentDealId=${params['parentDealId']}`);
            } else {
                // navigate to data entry form if parentDealId exists
                navigate('/home');
            }   
        }
    }, [getCurrentUser, navigate, params])

    return (
        <div className='login-page-container'>
            <LoginForm parentDealId={params['parentDealId']} />
        </div>
    )
}

export default LoginPage