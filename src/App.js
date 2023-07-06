import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './Pages/LoginPage';
import HomePage from './Pages/HomePage';
import ThanksPage from './Pages/ThanksPage';
import FeedbackPage from './Pages/FeedbackPage';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/thankyou" element={<ThanksPage />} />
                </Routes>
            </div>  
        </Router>
    );
}

export default App;
