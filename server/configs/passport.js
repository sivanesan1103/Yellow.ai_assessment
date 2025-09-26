const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const User = require('../models/User')

// JWT Strategy for API authentication
passport.use('jwt', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
}, async (jwt_payload, done) => {
    try {
        const user = await User.findById(jwt_payload.id)
        if (user) {
            return done(null, user)
        }
        return done(null, false)
    } catch (error) {
        return done(error, false)
    }
}))

// JWT Strategy for cookies
passport.use('jwt-cookie', new JwtStrategy({
    jwtFromRequest: (req) => {
        let token = null
        if (req && req.cookies) {
            token = req.cookies['access_token']
        }
        return token
    },
    secretOrKey: process.env.JWT_SECRET
}, async (jwt_payload, done) => {
    try {
        const user = await User.findById(jwt_payload.id)
        if (user) {
            return done(null, user)
        }
        return done(null, false)
    } catch (error) {
        return done(error, false)
    }
}))

// Google OAuth Strategy
passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:3000'}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists with Google ID
        let user = await User.findOne({ googleId: profile.id })
        
        if (user) {
            // Update last login
            user.lastLogin = new Date()
            await user.save()
            return done(null, user)
        }
        
        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value })
        
        if (user) {
            // Link Google account to existing user
            user.googleId = profile.id
            user.provider = 'both'
            user.lastLogin = new Date()
            await user.save()
            return done(null, user)
        }
        
        // Create new user
        const newUser = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            provider: 'google',
            credits: 100,
            lastLogin: new Date()
        })
        
        await newUser.save()
        return done(null, newUser)
        
    } catch (error) {
        console.error('Google OAuth Error:', error)
        return done(error, null)
    }
}))

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user._id)
})

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id)
        done(null, user)
    } catch (error) {
        done(error, null)
    }
})

module.exports = passport