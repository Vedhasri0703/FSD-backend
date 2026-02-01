import Task from "../models/taskModel.js";
import User from "../models/userModel.js";

export const createTask = async (req, res) => {
    try {
        console.log("=== ENTERING CREATE TASK CONTROLLER ===");
        const { title, description, dependencies, estimatedTime, priority } = req.body;

        // Ensure dependencies is an array even if not provided
        const taskDependencies = Array.isArray(dependencies) ? dependencies : [];

        const newTask = await Task.create({
            title,
            description,
            dependencies: taskDependencies,
            createdBy: req.user._id, // Set by authMiddleware
            estimatedTime,
            priority: priority || 'medium'
        });

        // Use return to ensure the function stops here
        return res.status(201).json({
            message: "Task created successfully",
            task: newTask
        });

    } catch (error) {
        console.error("Error in createTask:", error);
        return res.status(500).json({ 
            message: "Server error", 
            error: error.message 
        });
    }
};

export const getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('createdBy', 'name email')
            .populate('executedBy', 'name email')
            .populate('dependencies', 'title status')
            .populate('dependentTasks', 'title status')
            .sort({ createdAt: -1 });
        
        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTaskById = async (req, res) => {
    try {
        const taskId = req.params.id;
        const task = await Task.findById(taskId)
            .populate('createdBy', 'name email')
            .populate('executedBy', 'name email')
            .populate('dependencies', 'title status')
            .populate('dependentTasks', 'title status');
        
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        
        res.status(200).json({ task });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const executeTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const { status } = req.body;
        
        const task = await Task.findById(taskId)
            .populate('dependencies', 'status');
        
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Check if user is executor
        if (req.user.role !== 'executor') {
            return res.status(403).json({ message: "Only executors can execute tasks" });
        }

        // Check if task is already assigned to another executor
        if (task.executedBy && !task.executedBy.equals(req.user._id)) {
            return res.status(400).json({ message: "Task is already assigned to another executor" });
        }

        // CRITICAL BUSINESS RULE: Check if all dependencies are completed
        if (task.dependencies && task.dependencies.length > 0) {
            const incompleteDependencies = task.dependencies.filter(
                dep => dep.status !== 'completed'
            );
            
            if (incompleteDependencies.length > 0) {
                return res.status(400).json({
                    message: "Cannot execute task. Dependencies are not completed",
                    incompleteDependencies: incompleteDependencies.map(dep => ({
                        id: dep._id,
                        title: dep.title,
                        status: dep.status
                    }))
                });
            }
        }

        // Update task
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            {
                status,
                executedBy: req.user._id,
                ...(status === 'completed' && { completionDate: new Date() })
            },
            { new: true }
        ).populate('createdBy', 'name email')
         .populate('executedBy', 'name email')
         .populate('dependencies', 'title status');

        res.status(200).json({
            message: "Task execution updated successfully",
            task: updatedTask
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getCreatorTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ createdBy: req.user._id })
            .populate('createdBy', 'name email')
            .populate('executedBy', 'name email')
            .populate('dependencies', 'title status')
            .populate('dependentTasks', 'title status')
            .sort({ createdAt: -1 });
        
        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getExecutorTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ executedBy: req.user._id })
            .populate('createdBy', 'name email')
            .populate('executedBy', 'name email')
            .populate('dependencies', 'title status')
            .sort({ createdAt: -1 });
        
        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getAvailableTasks = async (req, res) => {
    try {
        // Get tasks with no executor assigned and all dependencies completed
        const tasks = await Task.find({
            executedBy: null,
            status: 'pending'
        }).populate('dependencies', 'status');
        
        // Filter tasks where all dependencies are completed
        const availableTasks = tasks.filter(task => {
            if (!task.dependencies || task.dependencies.length === 0) return true;
            return task.dependencies.every(dep => dep.status === 'completed');
        });

        // Populate additional fields for response
        const populatedTasks = await Task.populate(availableTasks, [
            { path: 'createdBy', select: 'name email' },
            { path: 'dependencies', select: 'title status' }
        ]);

        res.status(200).json({ tasks: populatedTasks });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const { title, description, priority, estimatedTime } = req.body;
        
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Check if user is the creator
        if (!task.createdBy.equals(req.user._id)) {
            return res.status(403).json({ message: "Only task creator can update task details" });
        }

        // Cannot update if task is in progress or completed
        if (task.status !== 'pending') {
            return res.status(400).json({ message: "Cannot update task that is already in progress or completed" });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            {
                title: title || task.title,
                description: description || task.description,
                priority: priority || task.priority,
                estimatedTime: estimatedTime || task.estimatedTime
            },
            { new: true }
        ).populate('createdBy', 'name email')
         .populate('dependencies', 'title status');

        res.status(200).json({
            message: "Task updated successfully",
            task: updatedTask
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTaskDependencyGraph = async (req, res) => {
    try {
        const taskId = req.params.id;
        
        const task = await Task.findById(taskId)
            .populate({
                path: 'dependencies',
                select: 'title status',
                populate: {
                    path: 'dependencies',
                    select: 'title status'
                }
            })
            .populate({
                path: 'dependentTasks',
                select: 'title status',
                populate: {
                    path: 'dependencies',
                    select: 'title status'
                }
            });
        
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({
            task: {
                id: task._id,
                title: task.title,
                status: task.status
            },
            dependencies: task.dependencies,
            dependentTasks: task.dependentTasks
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getTasksByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const validStatuses = ['pending', 'in-progress', 'completed', 'blocked'];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const tasks = await Task.find({ status })
            .populate('createdBy', 'name email')
            .populate('executedBy', 'name email')
            .populate('dependencies', 'title status')
            .sort({ priority: -1, createdAt: -1 });
        
        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const testEndpoint = async (req, res) => {
    console.log("Test endpoint reached!");
    console.log("User:", req.user);
    res.status(200).json({ 
        message: "Test successful",
        user: req.user 
    });
};