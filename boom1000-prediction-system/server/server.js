// server/server.js
const dotenv = require('dotenv');
const express = require('express');
const http = require('http'); // HTTP module for Socket.IO
const { Server } = require('socket.io'); // Socket.IO server class
const cors = require('cors'); // CORS middleware
const path = require)('path');
// Load environment variables as early as possible
dotenv.config({ path; path.resolve(--dirname, '.env') });

// Correctly import the database connection utility
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const tickRoutes = require('./routes/ticks');
const historyRoutes = require('./routes/history');

const app = express();
const server = http.createServer(app); // Create an HTTP server from the Express app

// IMPORTANT: Put app.use(express.json()) and app.use(cors()) early
// Middleware for parsing JSON request bodies
app.use(express.json());

// CORS Middleware for HTTP requests (API routes)
// Ensure origin matches your frontend URL exactly (http vs https, port)
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // Use http, not https
    credentials: true // Allow sending cookies/authorization headers
}));

// Initialize Socket.IO server
const io = new Server(server, {
    cors: { // Configure CORS specifically for Socket.IO (WebSockets)
        origin: process.env.CLIENT_URL || 'http://localhost:3000', // Allow client origin
        methods: ["GET", "POST"], // Necessary methods for Socket.IO's HTTP polling fallback
        credentials: true // Crucial for passing auth headers or cookies for Socket.IO
    }
});

// Connect to MongoDB
connectDB(); // Call the connectDB function

// API Routes
app.use('/api/auth', authRoutes); // Authentication routes (register, login)
app.use('/api/ticks', tickRoutes); // Tick data routes (get, add)
app.use('/api/history', historyRoutes); // Prediction history routes (get, add)

// --- Real-time Tick simulation ---
// This function simulates a live data feed by emitting random numbers periodically.
const simulatedTicks = [];
let tickInterval = null; // To control the interval

// Start emitting ticks via Socket.IO
const startTickSimulation = () => {
    if (tickInterval) {
        clearInterval(tickInterval); // Clear any existing interval
    }
    simulatedTicks.length = 0; // Clear previous ticks on simulation start

    tickInterval = setInterval(() => {
        const newTick = Math.floor(Math.random() * 100); // Generate a random tick between 0-99
        simulatedTicks.push(newTick);
        // Emit the new tick to all connected Socket.IO clients
        io.emit('newTick', newTick);
        console.log(`Emitted new simulated tick: ${newTick}`);
    }, 5000); // Emit a new tick every 5 seconds (adjust as needed)
};

// Stop emitting ticks
const stopTickSimulation = () => {
    if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
        console.log('Tick simulation stopped.');
    }
};

// Socket.IO Connection Handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // When a client connects, send them the current simulated ticks (if any)
    socket.emit('initialTicks', simulatedTicks);

    // Start simulation when the first client connects
    if (io.engine.clientsCount === 1) {
        startTickSimulation();
    }

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Stop simulation when no clients are connected
        if (io.engine.clientsCount === 0) {
            stopTickSimulation();
        }
    });
});

// Start the HTTP server (which Socket.IO is attached to)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Client URL: ${process.env.CLIENT_URL}`); // Confirm CLIENT_URL is loaded
});
