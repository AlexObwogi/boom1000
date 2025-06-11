import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the Auth Context
export const useAuth = () => {
	return useContext(AuthContext);
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
	const [token, setToken] = useState(localStorage.getItem('token')); // Load token from localStorage
	const [isAuthenticated, setIsAuthenticated] = useState(!!token); // Check if token exists
	const [user, setUser] = useState(null); // Store user data (e.g., username)

	const [loading, setLoading] = useState(true); // Loading state for initial user check

	const serveUrl = process.env.REACT_APP_SERVER_URL; // Get server URL from environment

	//Function to set authentication state after login/register
	const setAuthToken = (newToken) => {
		setToken(newToken);
		if (newToken) {
			localStorage.setItem('token', newToken); // Store token in localStorage
			setIsAuthenticated(true);
		} else {
			localStorage.removeItem('token'); // Remove token on logout
			setIsAuthenticated(false);
			setUser(null);
		}
	};

	//Function to load user data from the backend
	const loadUser = async () => {
		if (token) {
			axios.defaults.headers.common['x-auth-token'] = token; // set default token header for all requests
		} else {
			delete axios.defaults.headers.common['x-auth-token']; // Remove header if no token
			setLoading(false);
			return;
		}

		try {
			const res = await axios.get(`${serverUrl}/api/auth/user`); //Fetch user data
			setUser(res.data); //set user state
			setIsAuthenticated(true);
		} catch (err) {
			console.error('Error loading user:', err.response?.data?.msg || err.message);
			setAuthToken(null); // Invalid  token, log out user
		} finally {
			setLoading(false); // Finished loading
		}
	};

	//Effect to load user on initial component mount or when token changes
	useEffect(() => {
		loadUser();
	}, [token]); // Rerun when token state changes

	//Content Value to be provided to children components
	const contextValue = {
		token,
		isAuthenticated,
		user,
		loading,
		setAuthToken,
		loadUser
	};

	return (
		<AuthContext.Provider value={contextValue}>
		{children}
		</AuthContext.Provider>
	);
};

export default AuthProvider;
