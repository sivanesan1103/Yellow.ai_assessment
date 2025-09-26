const mongoose = require("mongoose");

const { Schema } = mongoose;

const ChatSchema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    projectId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Project', 
        required: true 
    },
    userName: { type: String, required: true },
    name: { type: String, required: true },
    messages: [
        {
            role: { type: String, required: true },
            content: { type: String, required: true },
            timestamp: { type: Number, required: true },
            isFile: { type: Boolean, default: false },
            fileInfo: { type: Schema.Types.Mixed }
        }
    ]
}, {timestamps: true})

// Indexes for better performance
ChatSchema.index({ userId: 1, projectId: 1 });
ChatSchema.index({ projectId: 1 });

// Clear any existing model to avoid conflicts
if (mongoose.models.Chat) {
    delete mongoose.models.Chat;
}

const Chat = mongoose.model('Chat', ChatSchema)

module.exports = Chat;