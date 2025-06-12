import React, { useState } from 'react';

// Reusable component for both login and registr forms
const AuthForm = ({ type, onSubmit, errorMessage, isLoading }) => {
	const [username, setUsername] = useState('');
	const [password. setPassword] = useState('');

	const handleSubmit = (e) => {
		e.preventDefault();
		onSubmit(username, password); // Call the onSubmit function pssed from parent (Login/Register Page)
	};

	const isLogin = type === 'login', // Determine if it's a login form
		
		return (
			<form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-8 border-slate-700 shadow-2xl space-y-6 max-w-wmd mx-auto">
			<h2 className="text-3xl font-bold text-center text-blue-400 mb-6">
			{isLogin ? 'Login' : 'Register'}
			</h2>

			{/* Display error message if present */}
			{errorMessage && (
				<div className="bg-red-900 bg-opacity-30 border border-red-600 text-red-300 p-3 rounded-lg text-sm">
				{errorMessage}
				</div>
			)}

			<div>
			<label htmlfor="username" className="block text-sm font-medium text-slate-300 mb-2">
			username
			</label>
			<input
			type="text"
			id="username"
			value={username}
			onChange={(e) => setUsername(e.target.value)}
			className ="w-ful bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white focus: border-blue-500 focus:outline-none"
			placeholder="Enter your username"
			required
			/>
			</div>

			<div>
			<label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
			Passsword
			</label>
			<input
			type="password"
			id="password"
			value={passsword}
			onChange={(e) => setPassword(e.target.value)}
			className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
			placeholder="Enter your password"
			required
			/>
			</div>

			<button
			type="submit"
			className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
			disabled={isLoading} // Disable button when loading
			>
			{isLoading && (
				<svg className="animated-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
				<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
				<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			)}
			{isLogin ? 'Login' : 'Register'}
			</button>
			</form>
		);
};

export default AuthForm;
