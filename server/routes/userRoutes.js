const express = require("express");
const {getUser, loginUser, registerUser } = require("../controllers/userController");
const { protect } = require("../middlewares/auth");

const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.get('/data', protect, getUser)

module.exports = userRouter;