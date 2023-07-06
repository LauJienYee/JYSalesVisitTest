import React, { useContext } from 'react'
import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { FirebaseAuthContext } from '../Utilities/Context/FirebaseAuthContext';
import './Components.css'
import logo from '../Assets/Logo/Interflour_logo.png'

const Header = ({ username }) => {
    // navigation
    const navigate = useNavigate();
    // user logout function
    const { userLogout } = useContext(FirebaseAuthContext); 

    // logout logic
    const logout = async () => {
        await userLogout();

        navigate('/');
    }

    return (
        <Container className='header-container'>
            <div className='header-logo-container'>
                <img src={logo} alt="logo" className='header-logo' />
            </div>

            <div className='header-logout-container'>
                <div className='header-username'>
                    {username}
                </div>

                <Button className='header-logout-button' variant='dark' onClick={logout}>Logout</Button>
            </div>
        </Container>
    )
}

export default Header