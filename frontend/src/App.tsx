import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './components/Landing';
import { Login } from './components/Login';
import { Register } from './components/Register'; // 🎯 New Import
import { Dashboard } from './components/Dashboard';
import  Verify  from './components/Verify';
import { HSStaticMethods } from 'preline/non-auto';

function App() {
    const [token, setToken] = useState<string | null>(localStorage.getItem('worksync_token'));

    useEffect(() => {
        HSStaticMethods.autoInit();
    }, []);

    const updateAuth = () => {
        setToken(localStorage.getItem('worksync_token'));
    };

    const isAuthenticated = !!token;

    return (
        <BrowserRouter>
            <Routes>
                {/* Isolated Landing View */}
                <Route path="/" element={<Landing />} />

                {/* Dedicated Forms */}
                <Route path="/login" element={<Login onLoginSuccess={updateAuth} />} />
                <Route path="/register" element={ <Register />} />
                <Route path="/verify" element={<Verify />} />

                {/* Secure Workspace */}
                <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;