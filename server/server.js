const express = require('express');
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const connectDB = require('./configs/db');
const passport = require('./configs/passport');

// Route imports
const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');
const messageRouter = require('./routes/messageRoutes');
const chatRouter = require('./routes/chatRoutes');
const projectRouter = require('./routes/projectRoutes');

const app = express();

connectDB();

// CORS configuration - Allow multiple origins
const getAllowedOrigins = () => {
    const origins = [
        'http://localhost:5173',
        'http://localhost:5174',
        process.env.CLIENT_URL
    ];
    
    // Add origins from environment variable
    if (process.env.ALLOWED_ORIGINS) {
        origins.push(...process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim()));
    }
    
    return origins.filter(Boolean);
};

const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = getAllowedOrigins();
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            console.log('Allowed origins:', allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/', (req, res) => res.send('Server is Live!'));

// Health check endpoint for Docker
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is working correctly',
        timestamp: new Date().toISOString()
    });
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/chat', chatRouter);
app.use('/api/message', messageRouter);
app.use('/api/project', projectRouter);

// Error handling
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    
    if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'Malformed JSON in request body'
        });
    }
    
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});