// src/controllers/message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Sender ID is required"]
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Receiver ID is required"]
    },
    content: {
        type: String,
        required: [true, "Message content is required"],
        trim: true,
        maxlength: [1000, "Message cannot exceed 1000 characters"]
    },
    timestamp: {
        type: Date,
        default: Date.now,
        immutable: true // Prevents modification after creation
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Indexes for faster querying
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ timestamp: -1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;