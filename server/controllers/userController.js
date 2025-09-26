const User = require("../models/User");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const Chat = require("../models/Chat");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.json({ success: false, message: "User already exists" });
        }

        const user = await User.create({ name, email, password });
        const token = generateToken(user._id);
        
        res.json({ success: true, token });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ email });
        
        if (user && await bcrypt.compare(password, user.password)) {
            const token = generateToken(user._id);
            return res.json({ success: true, token });
        }
        
        return res.json({ success: false, message: "Invalid email or password" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

const getUser = async (req, res) => {
    try {
        const user = req.user;
        return res.json({ success: true, user });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

const getPublishedImages = async (req, res) => {
    try {
        const publishedImageMessages = await Chat.aggregate([
            { $unwind: "$messages" },
            {
                $match: {
                    "messages.isImage": true,
                    "messages.isPublished": true
                }
            },
            {
                $project: {
                    _id: 0,
                    imageUrl: "$messages.content",
                    userName: "$userName"
                }
            }
        ]);

        res.json({ success: true, images: publishedImageMessages.reverse() });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUser,
    getPublishedImages
}