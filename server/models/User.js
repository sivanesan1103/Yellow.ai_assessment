const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { 
        type: String, 
        required: function() { return !this.googleId; } 
    },
    googleId: { type: String, unique: true, sparse: true },
    avatar: { type: String },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    refreshTokens: [{
        token: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date,
        isActive: { type: Boolean, default: true }
    }],
    lastLogin: { type: Date },
    credits: { type: Number, default: 100 }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function() {
    const crypto = require('crypto');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    this.refreshTokens.push({
        token: refreshToken,
        expiresAt,
        isActive: true
    });
    
    return refreshToken;
};

// Clean expired tokens
userSchema.methods.cleanExpiredTokens = function() {
    this.refreshTokens = this.refreshTokens.filter(
        tokenObj => tokenObj.expiresAt > new Date() && tokenObj.isActive
    );
};

const User = mongoose.model('User', userSchema);

module.exports = User;