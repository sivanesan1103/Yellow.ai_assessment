const axios = require("axios");
const Chat = require("../models/Chat");
const User = require("../models/User");
const Project = require("../models/Project");
const openai = require('../configs/openai');
const fs = require('fs');
const path = require('path');


// Text-based AI Chat Message Controller
const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id


        const {chatId, prompt} = req.body

        // Ensure the chat belongs to the authenticated user for security
        const chat = await Chat.findOne({userId, _id: chatId})
        if (!chat) {
            return res.json({success: false, message: "Chat not found or you don't have access to it"})
        }

        // Additional security check to prevent cross-user access
        if (chat.userId.toString() !== userId.toString()) {
            return res.json({success: false, message: "Unauthorized access to chat"})
        }

        // Get project details for better context
        const project = await Project.findById(chat.projectId);
        
        // Create user message (don't save to DB yet - save after AI response)
        const userMessage = {role: "user", content: prompt, timestamp: Date.now()}

        // Prepare conversation history for project-level memory context
        // Get all chats from the same project for shared memory
        const projectChats = await Chat.find({ 
            projectId: chat.projectId, 
            userId: userId 
        }).sort({ updatedAt: 1 }); // Sort by creation/update time to maintain chronological order

        // Start with system message for context and project-level memory
        const projectContext = project ? `Project: "${project.name}"${project.description ? ` - ${project.description}` : ''}` : 'Current project';
        const conversationHistory = [
            {
                role: "system",
                content: `You are a helpful AI assistant working within a project context. ${projectContext}. You have access to the conversation history across all chats in this project. Use this shared memory to provide contextually relevant responses. Remember previous discussions, topics, and context from all conversations within this project. When referencing previous conversations, you can mention relevant context naturally. Each project is isolated and private to the current user.`
            }
        ];

        // Collect all messages from all chats in the project for shared memory
        const allProjectMessages = [];
        
        projectChats.forEach(projectChat => {
            projectChat.messages
                .filter(msg => !msg.isImage && msg.content && msg.content.trim()) // Only include valid text messages
                .forEach(msg => {
                    allProjectMessages.push({
                        role: msg.role === "user" ? "user" : "assistant",
                        content: msg.content,
                        timestamp: msg.timestamp,
                        chatName: projectChat.name
                    });
                });
        });

        // Sort all messages by timestamp to maintain chronological order across chats
        allProjectMessages.sort((a, b) => a.timestamp - b.timestamp);

        // Limit to recent messages to manage token usage (last 15 messages across all chats)
        const recentMessages = allProjectMessages
            .slice(-15)
            .map(msg => ({
                role: msg.role,
                content: msg.content
            }));

        conversationHistory.push(...recentMessages);

        // Add the current user prompt to conversation history
        conversationHistory.push({
            role: "user",
            content: prompt
        });

        let reply;
        try {
            const completion = await openai.chat.completions.create({
                model: "gemini-2.0-flash",
                messages: conversationHistory, // Send full conversation context
            });
            
            if (!completion || !completion.choices || !completion.choices[0]) {
                throw new Error("Invalid response from AI service")
            }

            reply = {...completion.choices[0].message, timestamp: Date.now()}
        } catch (apiError) {
            console.error("AI API Error:", apiError.message);
            // Create a fallback response if AI service fails
            reply = {
                role: "assistant", 
                content: "I apologize, but I'm having trouble connecting to the AI service right now. Please try again in a moment.",
                timestamp: Date.now(), 
                isImage: false
            }
        }

        // Save both user message and AI reply to database
        chat.messages.push(userMessage)
        chat.messages.push(reply)
        
        // Update chat name to first message content if it's still "New Chat"
        if (chat.name === "New Chat" && chat.messages.length > 0) {
            chat.name = prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt
        }
        
        await chat.save()
        await User.updateOne({_id: userId}, {$inc: {credits: -1}})

        res.json({success: true, reply})

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

// File upload and AI analysis controller
const fileMessageController = async (req, res) => {
    try {
        const userId = req.user._id
        const { chatId, prompt } = req.body
        const uploadedFile = req.file

        if (!uploadedFile) {
            return res.json({success: false, message: "No file uploaded"})
        }

        // Ensure the chat belongs to the authenticated user for security
        const chat = await Chat.findOne({userId, _id: chatId})
        if (!chat) {
            return res.json({success: false, message: "Chat not found or you don't have access to it"})
        }

        // Additional security check to prevent cross-user access
        if (chat.userId.toString() !== userId.toString()) {
            return res.json({success: false, message: "Unauthorized access to chat"})
        }

        // Get project details for better context
        const project = await Project.findById(chat.projectId);

        // Get all chats in the same project for shared memory context
        const projectChats = await Chat.find({
            userId, 
            projectId: chat.projectId
        }).sort({ updatedAt: 1 });

        // Create file info for the user message
        const fileInfo = {
            name: uploadedFile.originalname,
            size: uploadedFile.size,
            type: uploadedFile.mimetype,
            path: uploadedFile.path,
            filename: uploadedFile.filename,
            url: `/api/message/file/${uploadedFile.filename}` // URL to access the file
        };

        // Create user message with file info (don't save to DB yet)
        const userMessage = {
            role: "user", 
            content: prompt || `Uploaded file: ${uploadedFile.originalname}`,
            timestamp: Date.now(),
            isFile: true,
            fileInfo: fileInfo
        };

        // Prepare conversation history with project-level memory
        const conversationHistory = [
            {
                role: "system",
                content: `You are a helpful AI assistant with file analysis capabilities. You are working within the project "${project?.name || 'Unnamed Project'}". You can analyze various file types including images, documents, and text files. Remember the context of conversations within this project. Each project is isolated and private to the current user.`
            }
        ];

        // Add existing messages from all chats in this project for shared memory
        const existingMessages = projectChats
            .flatMap(projectChat => projectChat.messages)
            .filter(msg => msg.content && msg.content.trim())
            .slice(-15) // Limit to last 15 messages across project to manage token usage
            .map(msg => ({
                role: msg.role === "user" ? "user" : "assistant",
                content: msg.content
            }));

        conversationHistory.push(...existingMessages);

        let reply;
        try {
            // Handle different file types
            if (uploadedFile.mimetype.startsWith('image/')) {
                // For images, encode to base64 and send to vision model
                const imageBuffer = fs.readFileSync(uploadedFile.path);
                const base64Image = imageBuffer.toString('base64');
                
                const completion = await openai.chat.completions.create({
                    model: "gemini-2.0-flash",
                    messages: [
                        ...conversationHistory,
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: prompt || "Please analyze this image and describe what you see."
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:${uploadedFile.mimetype};base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ]
                });
                
                reply = {...completion.choices[0].message, timestamp: Date.now()};
            } else if (uploadedFile.mimetype === 'text/plain' || uploadedFile.originalname.endsWith('.txt')) {
                // For text files, read content and analyze
                const textContent = fs.readFileSync(uploadedFile.path, 'utf8');
                
                conversationHistory.push({
                    role: "user",
                    content: `Please analyze this text file "${uploadedFile.originalname}":\n\n${textContent}\n\n${prompt || 'What can you tell me about this file?'}`
                });

                const completion = await openai.chat.completions.create({
                    model: "gemini-2.0-flash",
                    messages: conversationHistory
                });
                
                reply = {...completion.choices[0].message, timestamp: Date.now()};
            } else {
                // For other file types, provide general file information
                conversationHistory.push({
                    role: "user",
                    content: `I've uploaded a file: "${uploadedFile.originalname}" (${uploadedFile.mimetype}, ${(uploadedFile.size/1024/1024).toFixed(2)}MB). ${prompt || 'Can you help me with this file?'}`
                });

                const completion = await openai.chat.completions.create({
                    model: "gemini-2.0-flash",
                    messages: conversationHistory
                });
                
                reply = {...completion.choices[0].message, timestamp: Date.now()};
            }
            
        } catch (apiError) {
            console.error("AI API Error:", apiError.message);
            reply = {
                role: "assistant", 
                content: `I've received your file "${uploadedFile.originalname}", but I'm having trouble processing it right now. Please try again in a moment.`,
                timestamp: Date.now()
            }
        }

       
        // Files will be stored in uploads directory for user access

        // Now save both user message and AI reply to database
        chat.messages.push(userMessage)
        chat.messages.push(reply)
        
        // Update chat name to file name if it's still "New Chat"
        if (chat.name === "New Chat" && chat.messages.length > 0) {
            chat.name = uploadedFile.originalname.length > 30 ? 
                uploadedFile.originalname.substring(0, 30) + "..." : 
                uploadedFile.originalname
        }
        
        await chat.save()
        await User.updateOne({_id: userId}, {$inc: {credits: -1}})

        res.json({success: true, reply})

    } catch (error) {
        // Don't delete file on error - keep it for user access
        console.error("File processing error:", error.message);
        res.json({success: false, message: error.message})
    }
}

// Serve uploaded files
const getFileController = async (req, res) => {
    try {
        const userId = req.user._id
        const { filename } = req.params

        // Security: Check if file belongs to user by checking chat messages
        const chats = await Chat.find({ userId });
        let fileFound = false;
        let filePath = '';

        for (const chat of chats) {
            for (const message of chat.messages) {
                if (message.isFile && message.fileInfo && message.fileInfo.path) {
                    if (message.fileInfo.path.includes(filename)) {
                        fileFound = true;
                        filePath = message.fileInfo.path;
                        break;
                    }
                }
            }
            if (fileFound) break;
        }

        if (!fileFound || !fs.existsSync(filePath)) {
            return res.status(404).json({success: false, message: "File not found"})
        }

        // Serve the file
        res.sendFile(path.resolve(filePath));
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
}

// Debug endpoint to test project memory
const debugMemoryController = async (req, res) => {
    try {
        const userId = req.user._id
        const { projectId } = req.params

        // Get all chats in the project
        const projectChats = await Chat.find({
            userId, 
            projectId: projectId
        }).sort({ updatedAt: 1 });

        // Get project details
        const project = await Project.findById(projectId);

        // Collect all messages from all chats in the project
        const allProjectMessages = [];
        
        projectChats.forEach(projectChat => {
            projectChat.messages
                .filter(msg => msg.content && msg.content.trim())
                .forEach(msg => {
                    allProjectMessages.push({
                        role: msg.role,
                        content: msg.content,
                        timestamp: msg.timestamp,
                        chatName: projectChat.name,
                        chatId: projectChat._id,
                        isFile: msg.isFile || false
                    });
                });
        });

        // Sort by timestamp
        allProjectMessages.sort((a, b) => a.timestamp - b.timestamp);

        res.json({
            success: true, 
            project: project,
            totalChats: projectChats.length,
            totalMessages: allProjectMessages.length,
            recentMessages: allProjectMessages.slice(-15),
            allMessages: allProjectMessages
        })
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

module.exports = {
    textMessageController,
    fileMessageController,
    getFileController
};
