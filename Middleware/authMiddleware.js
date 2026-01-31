import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }
        
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

export const creatorMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'creator') {
        next();
    } else {
        return res.status(403).json({ message: "Forbidden: Creators only" });
    }
};

export const executorMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'executor') {
        next();
    } else {
        return res.status(403).json({ message: "Forbidden: Executors only" });
    }
};