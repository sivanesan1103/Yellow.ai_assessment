const express = require('express')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const User = require('../models/User')
const router = express.Router()

// Generate JWT tokens
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    )
    
    const refreshToken = jwt.sign(
        { id: userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '30d' }
    )
    
    return { accessToken, refreshToken }
}

// Set cookie options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
}

const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
}

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            })
        }

        // Check if user already exists
        const userExists = await User.findOne({ email })
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            })
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            provider: 'local',
            credits: 100
        })

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user._id)
        
        // Save refresh token to user
        const refreshTokenObj = user.generateRefreshToken()
        await user.save()

        // Set cookies
        res.cookie('access_token', accessToken, cookieOptions)
        res.cookie('refresh_token', refreshToken, refreshCookieOptions)

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token: accessToken, // For compatibility with existing frontend
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                provider: user.provider
            }
        })

    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        })
    }
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            })
        }

        // Check for user
        const user = await User.findOne({ email })
        if (!user || user.provider === 'google') {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            })
        }

        // Check password
        const isMatch = await user.matchPassword(password)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            })
        }

        // Clean expired tokens and generate new ones
        user.cleanExpiredTokens()
        const { accessToken, refreshToken } = generateTokens(user._id)
        
        // Save refresh token
        user.generateRefreshToken()
        user.lastLogin = new Date()
        await user.save()

        // Set cookies
        res.cookie('access_token', accessToken, cookieOptions)
        res.cookie('refresh_token', refreshToken, refreshCookieOptions)

        res.json({
            success: true,
            message: 'Login successful',
            token: accessToken, // For compatibility
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                provider: user.provider
            }
        })

    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        })
    }
})

// @desc    Google OAuth
// @route   GET /api/auth/google
// @access  Public
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}))

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        try {
            const user = req.user
            
            // Generate tokens
            const { accessToken, refreshToken } = generateTokens(user._id)
            
            // Save refresh token
            user.generateRefreshToken()
            await user.save()

            // Set cookies
            res.cookie('access_token', accessToken, cookieOptions)
            res.cookie('refresh_token', refreshToken, refreshCookieOptions)

            // Redirect to frontend with success
            const frontendURL = process.env.CLIENT_URL || 'http://localhost:5174'
            res.redirect(`${frontendURL}/?auth=success&token=${accessToken}`)

        } catch (error) {
            console.error('Google callback error:', error)
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5174'}/login?error=auth_failed`)
        }
    }
)

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Private
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies.refresh_token || req.body.refreshToken

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not provided'
            })
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
        
        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type'
            })
        }

        // Find user and check if refresh token exists and is active
        const user = await User.findById(decoded.id)
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            })
        }

        // Clean expired tokens
        user.cleanExpiredTokens()
        
        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id)
        
        // Save new refresh token and invalidate old one
        user.generateRefreshToken()
        await user.save()

        // Set new cookies
        res.cookie('access_token', accessToken, cookieOptions)
        res.cookie('refresh_token', newRefreshToken, refreshCookieOptions)

        res.json({
            success: true,
            token: accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                provider: user.provider
            }
        })

    } catch (error) {
        console.error('Refresh token error:', error)
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        })
    }
})

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', async (req, res) => {
    try {
        const refreshToken = req.cookies.refresh_token

        if (refreshToken) {
            // Decode token to get user ID
            try {
                const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
                const user = await User.findById(decoded.id)
                
                if (user) {
                    // Invalidate all refresh tokens for this user
                    user.refreshTokens = user.refreshTokens.map(tokenObj => ({
                        ...tokenObj,
                        isActive: false
                    }))
                    await user.save()
                }
            } catch (error) {
                console.error('Error invalidating refresh tokens:', error)
            }
        }

        // Clear cookies
        res.clearCookie('access_token')
        res.clearCookie('refresh_token')

        res.json({
            success: true,
            message: 'Logout successful'
        })

    } catch (error) {
        console.error('Logout error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        })
    }
})

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', passport.authenticate(['jwt', 'jwt-cookie'], { session: false }), async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -refreshTokens')
        
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                credits: user.credits,
                provider: user.provider,
                lastLogin: user.lastLogin
            }
        })
    } catch (error) {
        console.error('Get user error:', error)
        res.status(500).json({
            success: false,
            message: 'Server error'
        })
    }
})

module.exports = router