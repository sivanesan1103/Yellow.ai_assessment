const express = require('express');
const { protect } = require('../middlewares/auth');
const { textMessageController, fileMessageController, getFileController } = require('../controllers/messageController');
const upload = require('../middlewares/upload');

const messageRouter = express.Router();

messageRouter.post('/text', protect, textMessageController);
messageRouter.post('/file', protect, upload.single('file'), fileMessageController);
messageRouter.get('/file/:filename', protect, getFileController);

module.exports = messageRouter;