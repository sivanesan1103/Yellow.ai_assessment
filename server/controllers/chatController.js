const Chat = require("../models/Chat");
const Project = require("../models/Project");
const fs = require('fs');
const path = require('path');


// API Controller for creating a new chat
const createChat = async (req, res) => {
    try {
        const userId = req.user._id
        const { projectId } = req.body

        let targetProjectId = projectId

        // If no projectId provided, use default project or create one
        if (!targetProjectId) {
            let defaultProject = await Project.findOne({ userId, isDefault: true })
            
            if (!defaultProject) {
                // Create a default project if none exists
                defaultProject = new Project({
                    name: "My First Project",
                    description: "Default project for your chats",
                    userId,
                    userName: req.user.name,
                    isDefault: true
                })
                await defaultProject.save()
            }
            
            targetProjectId = defaultProject._id
        } else {
            // Verify the project belongs to the user
            const project = await Project.findOne({ _id: projectId, userId })
            if (!project) {
                return res.json({ success: false, message: "Project not found" })
            }
        }

        const chatData = {
            userId,
            projectId: targetProjectId,
            messages: [],
            name: "New Chat",
            userName: req.user.name
        }

        const newChat = await Chat.create(chatData)
        res.json({success: true, message: "Chat created", chat: newChat})
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// API Controller for getting all chats (optionally filtered by project)
const getChats = async (req, res) => {
    try {
        const userId = req.user._id
        const { projectId } = req.query

        let query = { userId }
        if (projectId) {
            // Verify project belongs to user
            const project = await Project.findOne({ _id: projectId, userId })
            if (!project) {
                return res.json({ success: false, message: "Project not found" })
            }
            query.projectId = projectId
        }

        const chats = await Chat.find(query)
            .populate('projectId', 'name')
            .sort({ updatedAt: -1 })
        
        res.json({success: true, chats})
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// API Controller for deleting a chat
const deleteChat = async (req, res) => {
    try {
        const userId = req.user._id
        const {chatId} = req.body

        // Verify chat belongs to user before deleting
        const chat = await Chat.findOne({ _id: chatId, userId })
        if (!chat) {
            return res.json({ success: false, message: "Chat not found" })
        }

        // Collect all file paths from messages that need to be deleted
        const filesToDelete = []
        let fileCount = 0
        
        chat.messages.forEach(message => {
            if (message.isFile && message.fileInfo && message.fileInfo.path) {
                filesToDelete.push(message.fileInfo.path)
                fileCount++
            }
        })

        // Delete the chat from database first
        await Chat.deleteOne({_id: chatId, userId})

        // Delete associated files from storage
        let deletedFiles = 0
        let failedFiles = 0
        
        for (const filePath of filesToDelete) {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    deletedFiles++;
                } else {
                    console.log(`File not found: ${filePath}`)
                }
            } catch (fileError) {
                failedFiles++;
            }
        }

        const message = fileCount > 0 ? 
            `Chat deleted along with ${deletedFiles} file(s)${failedFiles > 0 ? ` (${failedFiles} files could not be deleted)` : ''}` :
            "Chat deleted successfully"
        
        res.json({success: true, message, filesDeleted: deletedFiles, filesFailed: failedFiles})
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// API Controller for getting chats by project
const getChatsByProject = async (req, res) => {
    try {
        const userId = req.user._id
        const { projectId } = req.params

        // Verify project belongs to user
        const project = await Project.findOne({ _id: projectId, userId })
        if (!project) {
            return res.json({ success: false, message: "Project not found" })
        }

        const chats = await Chat.find({ projectId, userId })
            .sort({ updatedAt: -1 })
        
        res.json({
            success: true, 
            chats,
            project
        })
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

module.exports = {
    createChat,
    getChats,
    deleteChat,
    getChatsByProject
}