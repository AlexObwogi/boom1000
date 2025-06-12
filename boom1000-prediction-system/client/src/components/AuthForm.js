import React, { useState } from 'react';
import axios from 'axios';
// You might also need useNavigate or similar if doing redirects here

const AuthForm = ({ type, onAuthSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const isLogin = type === 'login'; // Determine if it's a login form

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const res = await axios.post(`<span class="math-inline">\{process\.env\.REACT\_APP\_API\_URL\}</span>{endpoint}`, { username, password });

            if (isLogin) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('username', res.data.username); // Store username
                onAuthSuccess(); // Callback to parent (e.g., redirect)
            } else {
                alert('Registration successful! Please log in.');
                // Optionally, redirect to login page or switch form type
            }
        } catch (error) {
            console.error('Authentication error:', error.response ? error.response.data : error.message);
            alert(error.response ? error.response.data.message : 'An error occurred');
        }
    };

    // The 'return' statement MUST be here, after all variable declarations and functions
    return (
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-8 border-slate-700 shadow-2xl space-y-6 max-w-wmd mx-auto">
            <h2 className="text-3xl font-bold text-center text-blue-400 mb-6">
                {isLogin ? 'Login' : 'Register'}
            </h2>
            {/* ... (rest of your form JSX) ... */}
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Username"
                    className="w-full p-3 rounded-md bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-3 rounded-md bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>
            <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
            >
                {isLogin ? 'Login' : 'Register'}
            </button>
        </form>
    );
};

export default AuthForm;
