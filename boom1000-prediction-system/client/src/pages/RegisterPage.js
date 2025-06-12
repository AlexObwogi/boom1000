// client/src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm'; // Reusable auth form
import { registerUser } from '../api/auth'; // Auth API functions
import { useAuth } from '../context/AuthContext'; // Auth Context

const RegisterPage = () => {
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { setAuthToken } = useAuth(); // Get setAuthToken from context

    // Handle registration form submission
    const handleRegister = async (username, password) => {
        setIsLoading(true);
        setErrorMessage(''); // Clear previous errors
        try {
            const data = await registerUser(username, password);
            setAuthToken(data.token); // Store token in state and localStorage
            navigate('/system'); // Redirect to the main system page on successful registration
        } catch (err) {
            setErrorMessage(err); // Set error message from API
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center min-h-screen p-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-8">
                Create Your Account
            </h1>
            <AuthForm 
                type="register" 
                onSubmit={handleRegister} 
                errorMessage={errorMessage} 
                isLoading={isLoading} 
            />
            <p className="mt-6 text-slate-300">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-400 hover:underline">
                    Login here
                </Link>
            </p>
        </div>
    );
};

export default RegisterPage;
