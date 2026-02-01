import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './database/connection.js';
import authRouter from './routers/authRouter.js';
import taskRouter from './routers/taskRouter.js';
import cookieParser from 'cookie-parser';
import dns from 'node:dns';
dns.setServers(['8.8.8.8','1.1.1.1']);

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Connect to database
connectDB();

// Add this before your routes in index.js
app.use((req, res, next) => {
    console.log(`\n=== ${req.method} ${req.path} ===`);
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("Cookies:", req.cookies);
    next(); // Make sure this is here
});

// Routes
app.get("/", (req, res) => {
    res.status(200).json({ message: "Dependency-Based Task Execution System API is running" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tasks", taskRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!", error: err.message });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

