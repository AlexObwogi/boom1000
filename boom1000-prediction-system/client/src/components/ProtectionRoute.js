import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; //Auth Context

// A wrapper component that checks for authentication. 
// If not authenticated or still loading, it redirects to the login page.
const ProtectedRoute = ({ children }) => {
	const { isAuthenticated. loading } = useAuth(); // Get auth state from context 

	//While loading, you might show a spinner or nothing
	if (loading) {
		return (
			<div className = "flex justify-center items-center h-screen">
			<div className = "animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
			<span className = "ml-4 text-xl">Loading...</span>
			</div>
		);
	}

	//if not authenticated, redirect to login page
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	//If authenticated, render the children components (the protected content)
	return children;

};

export default ProtectedRoute;
