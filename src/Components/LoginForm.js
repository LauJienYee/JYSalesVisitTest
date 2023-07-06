import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { FirebaseAuthContext } from '../Utilities/Context/FirebaseAuthContext';
import './Components.css'
import { Navbar } from 'react-bootstrap';
import logo from '../Assets/Logo/Interflour_logo.png'

const LoginForm = ({ parentDealId }) => {
    // firebase login function
    const { userLogin } = useContext(FirebaseAuthContext);
    // user email input state
    const [email, setEmail] = useState("");
    // user password input state
    const [password, setPassword] = useState("");
    // navigtation
    const navigate = useNavigate();

    // login logic
    const Login = async(event) => {
        event.preventDefault();

        // login user with email and password
        const user = await userLogin(email, password);

        if (user) {
            // navigate user to the form if logged in
            // console.log(user);

            if (parentDealId) {
                // navigate to feedback form if parentDealId exists
                navigate(`/feedback?parentDealId=${parentDealId}`);
            } else {
                // navigate to data entry form if parentDealId exists
                navigate('/home');
            }
        }
    }

    return (
        <Container>
            <Row className='justify-content-center'>
                <Col sm={12} md={9} lg={7} xl={6} xxl={5}>
                    <Container className='login-box'>
                        <Navbar className='justify-content-center mb-2'>
                            <img src={logo} alt="logo" className='brand-logo' />
                        </Navbar>

                        <div className='login-hr-line'>
                        </div>

                        <h1 className='login-header'>Please sign in here</h1>
                        
                        <Row className='justify-content-center mb-2 login-form'>
                            <Col xs={11} sm={10} md={11} lg={11} xl={11}>
                                <form onSubmit={Login}>
                                    <input
                                        className='login-field'
                                        placeholder='Email'
                                        type="email"
                                        value={email}
                                        onChange={event => setEmail(event.target.value)} />

                                    <input
                                        className='login-field'
                                        placeholder='Password'
                                        type="password"
                                        value={password}
                                        onChange={event => setPassword(event.target.value)} />

                                    <button className='login-button-box' type='submit'>
                                        <span className='login-button-text'>
                                            Sign In
                                        </span>
                                    </button>
                                </form>
                            </Col>
                        </Row>
                    </Container>
                </Col>
            </Row>
        </Container>
    )
}

export default LoginForm