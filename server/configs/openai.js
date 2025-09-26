const { OpenAI } = require("openai");

// Configure OpenAI to use Google's Gemini API
const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

module.exports = openai;