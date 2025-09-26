const express = require('express');
const { protect } = require('../middlewares/auth');
const { 
    createProject, 
    getUserProjects, 
    getProjectById, 
    updateProject, 
    deleteProject,
    setDefaultProject 
} = require('../controllers/projectController');

const projectRouter = express.Router();

// All routes require authentication
projectRouter.use(protect);

// GET /api/project - Get all projects for authenticated user
projectRouter.get('/', getUserProjects);

// POST /api/project - Create new project
projectRouter.post('/', createProject);

// GET /api/project/:projectId - Get specific project with chats
projectRouter.get('/:projectId', getProjectById);

// PUT /api/project/:projectId - Update project
projectRouter.put('/:projectId', updateProject);

// DELETE /api/project/:projectId - Delete project and all its chats
projectRouter.delete('/:projectId', deleteProject);

// POST /api/project/:projectId/default - Set as default project
projectRouter.post('/:projectId/default', setDefaultProject);

module.exports = projectRouter;