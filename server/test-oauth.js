// Test OAuth configuration
const express = require('express');
const passport = require('./configs/passport');
require('dotenv').config();

const app = express();

console.log('🔍 OAuth Configuration Test');
console.log('========================');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Set' : '❌ Missing');
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('SERVER_URL:', process.env.SERVER_URL);
console.log('');

// Test Google Strategy configuration
console.log('🔍 Google Strategy Configuration:');
console.log('Callback URL:', `${process.env.SERVER_URL || 'http://localhost:3000'}/api/auth/google/callback`);
console.log('');

console.log('🔗 Test URLs:');
console.log('Google Auth:', `${process.env.SERVER_URL || 'http://localhost:3000'}/api/auth/google`);
console.log('Callback:', `${process.env.SERVER_URL || 'http://localhost:3000'}/api/auth/google/callback`);
console.log('');

console.log('💡 If OAuth is not working, check:');
console.log('1. Google Console has correct redirect URI');
console.log('2. Client ID and Secret are correct');
console.log('3. URLs match between .env and Google Console');
console.log('4. No CORS errors in browser console');