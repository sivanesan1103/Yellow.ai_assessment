const express = require("express");
const { createChat, deleteChat, getChats, getChatsByProject } = require("../controllers/chatController");
const { protect } = require("../middlewares/auth");

const chatRouter = express.Router();

// Create new chat 
chatRouter.get('/create', protect, createChat) 
chatRouter.post('/create', protect, createChat) 
// Get all chats
chatRouter.get('/get', protect, getChats)
// Get chats by specific project
chatRouter.get('/project/:projectId', protect, getChatsByProject)
// Delete chat
chatRouter.post('/delete', protect, deleteChat)

module.exports = chatRouter