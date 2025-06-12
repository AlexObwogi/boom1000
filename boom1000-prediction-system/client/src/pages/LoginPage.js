// client/src/pages/LoginPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm'; // Reusable auth form
import { loginUser } from '../api/auth'; // Auth API functions
import { useAuth } from '../context/AuthContext'; // Auth Context

const LoginPage = () => {
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { setAuthToken } = useAuth(); // Get setAuthToken from context

    // Handle login form submission
    const handleLogin = async (username, password) => {
        setIsLoading(true);
        setErrorMessage(''); // Clear previous errors
        try {
            const data = await loginUser(username, password);
            setAuthToken(data.token); // Store token in state and localStorage
            navigate('/system'); // Redirect to the main system page on successful login
        } catch (err) {
            setErrorMessage(err); // Set error message from API
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center min-h-screen p-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-8">
                Welcome Back!
            </h1>
            <AuthForm 
                type="login" 
                onSubmit={handleLogin} 
                errorMessage={errorMessage} 
                isLoading={isLoading} 
            />
            <p className="mt-6 text-slate-300">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-400 hover:underline">
                    Register here
                </Link>
            </p>
        </div>
    );
};

export default LoginPage;
