import { io } from 'socket.io-client';

// Get server URL from environment variables
const SERVER_URL = process.env.REACT_APP_SERVER_URL;

// Initialize the socket.Io client connection 
// This Connection will be managed by the component that uses it (e.g., PredictionSystemPage)
const socket = io(SERVER_URL, {
	reconnection: true, // Enable reconnection
	reconnectionAttempts: 5, // Try to reconnect 5 times
	reconnectionDelay: 1000, // Wait 1 second before first reconnect attempt
	timeout: 20000 //Connection timeout
});

// Event Listeners for connection status (for dubbuging)
socket.on('connect', () => {
	console.log('Socket.IO connected to server!');
});
socket.on('disconnect', (reason) => {
	console.log('Socket.IO disconnected:', reason);
});

socket.on('connect_error', (error) => { 
	console.error('Socket.IO connection error:', error);
});

export default socket;
