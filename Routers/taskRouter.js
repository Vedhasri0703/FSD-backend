import express from 'express';
import {
    createTask,
    getAllTasks,
    getTaskById,
    executeTask,
    getCreatorTasks,
    getExecutorTasks,
    getAvailableTasks,
    updateTask,
    getTaskDependencyGraph,
    getTasksByStatus,
    testEndpoint
} from '../controllers/taskController.js';
import { authMiddleware, creatorMiddleware, executorMiddleware } from '../Middleware/authMiddleware.js';
const taskRouter = express.Router();

// Apply authMiddleware to ALL task routes
taskRouter.use(authMiddleware);

// Creator routes
taskRouter.post("/create", creatorMiddleware, createTask);
taskRouter.get("/creator", creatorMiddleware, getCreatorTasks);
taskRouter.put("/:id", creatorMiddleware, updateTask);

// Executor routes
taskRouter.get("/executor", executorMiddleware, getExecutorTasks);
taskRouter.get("/available", executorMiddleware, getAvailableTasks);
taskRouter.put("/execute/:id", executorMiddleware, executeTask);

// Common routes (accessible to both with auth)
taskRouter.get("/", getAllTasks);
taskRouter.get("/:id", getTaskById);
taskRouter.get("/dependency/:id", getTaskDependencyGraph);
taskRouter.get("/status/:status", getTasksByStatus);

// Add this route for testing
taskRouter.get("/test", testEndpoint);

export default taskRouter;