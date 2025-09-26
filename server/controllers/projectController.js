const Project = require('../models/Project');
const Chat = require('../models/Chat');
const fs = require('fs');
const path = require('path');

// Create a new project
const createProject = async (req, res) => {
    try {
        const { name, description, isDefault } = req.body;
        const userId = req.user._id;
        const userName = req.user.name;

        if (!name || name.trim().length === 0) {
            return res.json({ success: false, message: 'Project name is required' });
        }

        // Check if project name already exists for this user
        const existingProject = await Project.findOne({ 
            userId, 
            name: name.trim() 
        });

        if (existingProject) {
            return res.json({ success: false, message: 'Project with this name already exists' });
        }

        const project = new Project({
            name: name.trim(),
            description: description?.trim() || '',
            userId,
            userName,
            isDefault: isDefault || false
        });

        await project.save();

        res.json({
            success: true,
            message: 'Project created successfully',
            project
        });

    } catch (error) {
        res.json({ success: false, message: 'Failed to create project' });
    }
};

// Get all projects for a user
const getUserProjects = async (req, res) => {
    try {
        const userId = req.user._id;

        const projects = await Project.find({ userId })
            .sort({ isDefault: -1, updatedAt: -1 }); // Default project first, then by recent

        // Get chat count for each project
        const projectsWithChatCount = await Promise.all(
            projects.map(async (project) => {
                const chatCount = await Chat.countDocuments({ projectId: project._id });
                return {
                    ...project.toObject(),
                    chatCount
                };
            })
        );

        res.json({
            success: true,
            projects: projectsWithChatCount
        });

    } catch (error) {
        res.json({ success: false, message: 'Failed to fetch projects' });
    }
};

// Get a single project by ID
const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        const project = await Project.findOne({ _id: projectId, userId });

        if (!project) {
            return res.json({ success: false, message: 'Project not found' });
        }

        // Get chats for this project
        const chats = await Chat.find({ projectId })
            .sort({ updatedAt: -1 });

        res.json({
            success: true,
            project: {
                ...project.toObject(),
                chats
            }
        });

    } catch (error) {
        res.json({ success: false, message: 'Failed to fetch project' });
    }
};

// Update project
const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { name, description, isDefault } = req.body;
        const userId = req.user._id;

        const project = await Project.findOne({ _id: projectId, userId });

        if (!project) {
            return res.json({ success: false, message: 'Project not found' });
        }

        // Check if new name conflicts with existing projects (excluding current)
        if (name && name.trim() !== project.name) {
            const existingProject = await Project.findOne({
                userId,
                name: name.trim(),
                _id: { $ne: projectId }
            });

            if (existingProject) {
                return res.json({ success: false, message: 'Project with this name already exists' });
            }
        }

        // Update fields
        if (name) project.name = name.trim();
        if (description !== undefined) project.description = description.trim();
        if (typeof isDefault === 'boolean') project.isDefault = isDefault;

        await project.save();

        res.json({
            success: true,
            message: 'Project updated successfully',
            project
        });

    } catch (error) {
        res.json({ success: false, message: 'Failed to update project' });
    }
};

// Delete project
const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        const project = await Project.findOne({ _id: projectId, userId });

        if (!project) {
            return res.json({ success: false, message: 'Project not found' });
        }

        // Prevent deletion of default project if it's the only project
        if (project.isDefault) {
            const projectCount = await Project.countDocuments({ userId });
            if (projectCount === 1) {
                return res.json({ 
                    success: false, 
                    message: 'Cannot delete the only project. Create another project first.' 
                });
            }
        }

        // Get all chats in this project to collect files before deletion
        const chatsInProject = await Chat.find({ projectId });
        
        // Collect all file paths from messages that need to be deleted
        const filesToDelete = []
        let totalFiles = 0
        
        chatsInProject.forEach(chat => {
            chat.messages.forEach(message => {
                if (message.isFile && message.fileInfo && message.fileInfo.path) {
                    filesToDelete.push(message.fileInfo.path)
                    totalFiles++
                }
            })
        })

        // Delete all chats in this project
        await Chat.deleteMany({ projectId });

        // Delete the project
        await Project.findByIdAndDelete(projectId);

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
                console.error(`Failed to delete file ${filePath}:`, fileError.message)
                failedFiles++
            }
        }

        // If we deleted the default project, make another project default
        if (project.isDefault) {
            const nextProject = await Project.findOne({ userId });
            if (nextProject) {
                nextProject.isDefault = true;
                await nextProject.save();
            }
        }

        const message = totalFiles > 0 ? 
            `Project deleted along with ${chatsInProject.length} chat(s) and ${deletedFiles} file(s)${failedFiles > 0 ? ` (${failedFiles} files could not be deleted)` : ''}` :
            `Project and ${chatsInProject.length} chat(s) deleted successfully`

        res.json({
            success: true,
            message,
            deletedChats: chatsInProject.length,
            deletedFiles,
            failedFiles
        });

    } catch (error) {
        res.json({ success: false, message: 'Failed to delete project' });
    }
};

// Set default project
const setDefaultProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user._id;

        const project = await Project.findOne({ _id: projectId, userId });

        if (!project) {
            return res.json({ success: false, message: 'Project not found' });
        }

        // Remove default from all other projects and set this one as default
        await Project.updateMany({ userId }, { isDefault: false });
        project.isDefault = true;
        await project.save();

        res.json({
            success: true,
            message: 'Default project updated successfully',
            project
        });

    } catch (error) {
        res.json({ success: false, message: 'Failed to set default project' });
    }
};

module.exports = {
    createProject,
    getUserProjects,
    getProjectById,
    updateProject,
    deleteProject,
    setDefaultProject
};