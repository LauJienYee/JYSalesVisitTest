import React, { useContext, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import FeedbackForm from '../Components/FeedbackForm'
import { FirebaseAuthContext } from '../Utilities/Context/FirebaseAuthContext';
import './Pages.css'

const FeedbackPage = () => {
    // get logged in user info
    const { getCurrentUser } = useContext(FirebaseAuthContext);
    // navigation
    const navigate = useNavigate();
    // query string for parentDealId
    const [searchParams] = useSearchParams();
    const params = Object.fromEntries([...searchParams]);

    useEffect(() => {
        // navigate user to login page if not logged in
        if (getCurrentUser() === null) {
            if (params['parentDealId']) {
                navigate(`/?parentDealId=${params['parentDealId']}`);
            } else {
                navigate('/');
            }   
        }
    }, [getCurrentUser, navigate, params])

    return (
        <div className='feedback-page-container'>
            <FeedbackForm parentDealId={params['parentDealId']} />
        </div>
    )
}

export default FeedbackPage