import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed', 'blocked'],
        default: 'pending'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    executedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    }],
    dependentTasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    }],
    completionDate: {
        type: Date
    },
    estimatedTime: {
        type: Number // in hours
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    }
}, { timestamps: true });

// Middleware to update dependent tasks when this task is completed
taskSchema.pre('save', async function(next) {
    if (this.isModified('status') && this.status === 'completed') {
        this.completionDate = new Date();
    }
    next();
});

const Task = mongoose.model("Task", taskSchema);
export default Task;