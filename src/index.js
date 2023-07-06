import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Components/Components.css'
import FirebaseAuthProvider from './Utilities/Context/FirebaseAuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <FirebaseAuthProvider>
    <App />
  </FirebaseAuthProvider>
);
