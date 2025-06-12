import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PredictionSystemPage from './pages/PredictionSystemPage';
import AuthProvider from './context/AuthContext'; // Auth Context Provider
import protecedRoute from './components/ProtectedRoute'; // For protecting routes

function App() {
	return (
		// Authprovider makes authentication state available throughout the app
		<AuthProvider>
		<Router>
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
		<Routes>
		{/* public routes */}
		<Route path="/login" element={<LoginPage />} />
		<Route path="/register" element={<RegisterPage />} />
		{/* Redirect root to login for now, or to system if already authenticated */}
		<Route path="/" element={<LoginPage />} />

		{/* Protected route for the main prediction system */}
		{/* Only accessible if authenticated */}
		<Route
		path="/system"
		element={
			<ProtectedRoute>
			<PredictionSystemPage />
			</ProtectedRoute>
		}
		/>
		</Routes>
		</div>
		</Router>
		</AuthProvider>
	);
}
export default App;
