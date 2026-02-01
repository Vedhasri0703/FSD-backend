import express from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    getAllExecutors
} from '../controllers/authController.js';
import { authMiddleware, creatorMiddleware } from '../middleware/authMiddleware.js';

const authRouter = express.Router();

// Public routes
authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);

// Protected routes
authRouter.get("/profile", authMiddleware, getUserProfile);
authRouter.get("/logout", authMiddleware, logoutUser);
authRouter.get("/executors", authMiddleware, creatorMiddleware, getAllExecutors);

export default authRouter;