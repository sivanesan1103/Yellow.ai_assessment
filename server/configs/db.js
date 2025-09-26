const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('Database connected'));
        await mongoose.connect(`${process.env.MONGODB_URI}/chatbot`);
    } catch (error) {
        console.error('Database connection error:', error.message);
    }
};

module.exports = connectDB;