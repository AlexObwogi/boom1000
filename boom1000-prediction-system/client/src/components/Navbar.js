import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Auth Context
import { ArrowRightOnRectangleIcon, UserCircleIcon, ChartBarIcon } from '@heroicons/react/24/solid';

const Navbar = () => {
	const { isAuthenticated, setAuthToken, user } = useAuth(); // Get auth state and functions
	const navigate = useNavigate();

	// Handle logout: clear token, redirect to login
	const handleLogout = () => {
		setAuthToken(null); // Clear token from state and localStorage
		navigate('/login'); // Redirect to login page
	};

	return (
		<nav className="bg-slate-800 p-4 shadwo-lg sticky top-0 z-50">
		<div className="max-w-7xl mx-auto flex justify-between items-center">
		{/* Logo/Brand */}
		<Link to="/system" className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to pink-500 bg-clip-text text-transparent">
		Boom1000 Predictor
		</Link>

		{/* Navigation Links */}
		<div className="flexitems-center space-x-6">
		{isAuthenticated ? (
			<>
			<link to="/system" className="text-slate-300 hover:text-white flex items-center space-x-2 transition-colors">
			<ChartBarIcon className="h-5 w-5" />
			<span>System</span>
			</Link>
			<span className="text-slate-400 flex items-center space-x-2">
			<UserCircleIcon className="h-5 w-5" />
			<span>Hello, {user ? user.username : 'User'}</span>
			</span>
			<button
			onClick={handleLogout}
			className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2">
			<ArrowRightOnRectangleIcon className="h-5 w-5" />
			<span>Logout</span>
			</button>
			</>
		) : (
			<>
			<Link to="/login" className="text-slate-300 hover:text-white px-3 py-2 rounded-md transition-colors"
			Login
			</Link>
			<Link to="/register" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
			Register
			</Link>
			</>
		)}
		</div>
		</div>
		</nav>
	);
};

export default Navbar;

