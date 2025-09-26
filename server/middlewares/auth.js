const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');

// Enhanced protect middleware 
const protect = async (req, res, next) => {
    let token = null;
    
    // Try to get token from header 
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Try to get token from Authorization 
    else if (req.headers.authorization) {
        token = req.headers.authorization;
    }
    // Try to get token from cookies
    else if (req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
    }
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Access denied. No token provided." 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const userId = decoded.id;

        const user = await User.findById(userId)

        if(!user){
            return res.status(401).json({ 
                success: false, 
                message: "Not authorized, user not found" 
            });
        }

        req.user = user;
        next()
    } catch (error) {
        // If token is expired, refresh 
        if (error.name === 'TokenExpiredError' && req.cookies && req.cookies.refresh_token) {
            try {
                const refreshToken = req.cookies.refresh_token;
                const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
                
                if (decoded.type === 'refresh') {
                    const user = await User.findById(decoded.id);
                    if (user) {
                        // Generate new access token
                        const newAccessToken = jwt.sign(
                            { id: user._id },
                            process.env.JWT_SECRET,
                            { expiresIn: '15m' }
                        );
                        
                        // Set new cookie
                        res.cookie('access_token', newAccessToken, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'lax',
                            maxAge: 15 * 60 * 1000
                        });
                        
                        req.user = user;
                        return next();
                    }
                }
            } catch (refreshError) {
                console.error('Token refresh error:', refreshError);
            }
        }
        
        res.status(401).json({
            success: false,
            message: "Not authorized, invalid token"
        });
    }
}

// Passport-based authentication
const passportAuth = (strategies = ['jwt', 'jwt-cookie']) => {
    return passport.authenticate(strategies, { session: false });
}

module.exports = { protect, passportAuth };