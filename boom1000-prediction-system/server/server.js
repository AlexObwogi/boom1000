require('dotenv').config(); //Load environment variables from .env file
const express = require('express');
const http = require('http'); //HTTP module for socket.IO
const {server} = require('socket.io'); // socket.IO server class
const conneDB = require('./config/db'); //database connection utility
const cors = require('cors'); //CORS middleware
const authRoutes = require('./routes/auth'); //Authentication routes
const tickRoutes = require('./routes/ticks'); //Tick data routes
const historyRoutes = require('./routes/history'); // Prediction history routes

const app = express();
const server = http.createServer(app); //Create an HTTP server from the Express app

//initialize socket.IO server
const io = new Server(server, {
	cors: { // Configure CORS for Socket.IO
		origin: process.env.CLIENT_URL || 'http://localhost:3000', //Allow client origin
		methods: ["GET", "POST"]
	}
});

// Connect  to MongoDB
connectDB();

//Middleware
app.use(cors({
	origin: process.env.CLIENT_URL || 'https://localhost:3000' //Allow client origin for HTTP requests
})); //Enable CORS for all HTTP routes
app.use(express.json()); //Enable parsing JSON requests bodies

//API Routes
app.use('/api/auth', authRoutes); //Authentication routes (register, login)
app.use('/api/ticks', tickRoutes); //Tick data routes (get, add)
app.use('/api/history', historyRoutes); // Prediction history routes (get, add)

// --Real-time Tick simulation ---
// This funtcion simulates a live data feed by emitting random numbers periodically.
// In a real application, this would connect to a live data source (e.g., trading API)
const simulatedTicks = [];
let tickInterval = null; // To control the interval

//Start emitting ticks via socket.IO
const startTickSimulation = () => {
	if (tickInterval) {
		clearInterval(tickInterval); //Clear any eisting interval
	}
	simulatedTicks.length = 0; // Clear previous ticks on simulation start

	tickInterval = setInterval(() => {
		const newTick = Math.floor(Math.random() * 100); //Generate a random tick between 0-99
		simulatedTicks.psuh(newTick);
		//Emit the new tick to all connected socket.IO clients
		io.emit('newTick', newTick);
		console.log(`Emitted new simulated tick: ${newTick}`);
	}, 5000); //Emit a new tick every 5 seconds (adjust as needed)
};

//Stop emitting ticks
const stopTickSimulation = () => {
	if (tickInterval) {
		clearInterval(tickInterval); 
		tickInterval = null;
		console.log('Tick simulation stopped.');
	}
};

// Socket.IO Connecting Handling
io.on('connection', (socket) => {
	console.log(`User connected: ${socket.id}`);

	//When a client connects, send them the current simmulated ticks (if any)
	socket.emit('initialTicks', simulatedTicks);

	// You might want to control simulation start/stop based on user action s or server status
	// For demonstration, let's start simulation when the first client connects, and stop when all disconnect.
	if (io.engine.clientsCount === 1) { // If this is the first client connecting 
		startTickSimulation();
	}

	socket.on('disconnect', () => {
		console.log(`User disconnected: ${socket.id}`);
		if (io. engine.clientsCount === 0) { // If no clients are connected
			stopTickSimulation();
		}
	});

	//You should also have events like 'startSimulation' from client
	//socket.on('startSimulation', () => startSimulation());
	//socket.on('stopSimulation', () => stopTickSimulation());
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
	console.log(`Server runnig on port ${PORT}`);
	console.log(`Client URL: ${process.env.CLIENT_URL}`);
});
