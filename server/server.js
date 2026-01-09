require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', // Vite default port
    credentials: true
}));
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/shipments', require('./routes/shipmentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handling Middleware (Basic)
app.use((err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Make io accessible to our router
app.set('io', io);

io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    // Join a room for a specific user (for notifications)
    socket.on('join_user_room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their personal room`);
    });

    // Join a room for a specific shipment
    socket.on('join_tracking', (trackingId) => {
        socket.join(trackingId);
        console.log(`User with ID: ${socket.id} joined room: ${trackingId}`);
    });

    // Driver sends location updates
    socket.on('update_location', async (data) => {
        const { trackingId, location } = data;
        // console.log(`Location update for ${trackingId}:`, location);

        // Broadcast to everyone in the room (including the sender? no, usually to others)
        // socket.to(trackingId).emit("receive_location", location);
        // actually let's emit to the room so everyone sees it
        io.to(trackingId).emit("receive_location", location);

        // Optional: Update DB (debounce this in real app, but for now update on every hit or simple check)
        // For simplicity in this demo, we might want to update it in the DB asynchronously
        try {
            const Shipment = require('./models/Shipment');
            await Shipment.findOneAndUpdate(
                { trackingId: trackingId },
                {
                    currentLocation: {
                        lat: location.lat,
                        lng: location.lng,
                        updatedAt: new Date()
                    }
                }
            );
        } catch (err) {
            console.error("Error updating location in DB:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
