



https://github.com/user-attachments/assets/31d0472e-35a4-4aa9-97a6-0d3fefb940ef




# 🤖 Yellow.ai
**A Simple AI Chatbot Platform**

Chat with AI using Google's Gemini API. Login with Google, create projects, and have conversations!

## 🚀 Quick Start Options
**For developers who want full control**

### What You Need:
1. **Node.js** installed - [Download here](https://nodejs.org/)
2. Free accounts on:
   - [MongoDB Atlas](https://www.mongodb.com/atlas) (database)
   - [Google Cloud Console](https://console.cloud.google.com/) (login)
   - [Google AI Studio](https://aistudio.google.com/) (AI chat)

## 🚀 How to Run

### Step 1: Download the Code
```bash
git clone https://github.com/sivanesan1103/Yellow.ai.git
cd Yellow.ai
```

### Step 2: Install Dependencies
```bash
# Install server packages
cd server
npm install

# Install client packages  
cd ../client
npm install
```

### Step 3: Setup Environment File
Create a file called `.env` in the `server` folder and add:

```env
JWT_SECRET=mySecretKey123
JWT_REFRESH_SECRET=myRefreshKey123
SESSION_SECRET=mySessionKey123

MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000
NODE_ENV=development
```

### Step 4: Get Your API Keys

#### MongoDB (Database):
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string → Copy to `MONGODB_URI` in `.env`

#### Google Login:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project → Enable Google+ API
3. Create OAuth credentials:
   - JavaScript origins: `http://localhost:5173`
   - Redirect URIs: `http://localhost:3000/auth/google/callback`
4. Copy Client ID & Secret to `.env`

#### AI Chat:
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create API key → Copy to `GEMINI_API_KEY` in `.env`

### Step 5: Start the App

Open **TWO** terminals and run:

**Terminal 1 (Backend):**
```bash
cd server
npm run server
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

### Step 6: Open Your Browser
Go to: **http://localhost:5173**

That's it! 🎉

## ✨ What It Does

- 🔐 **Login with Google** - No need to create accounts
- � **Chat with AI** - Powered by Google's Gemini
- � **Organize Chats** - Create different projects
- 💾 **Save Everything** - All chats are saved automatically
- 📱 **Works Everywhere** - Desktop, tablet, mobile

## ❌ Problems?

**App won't start?**
- Make sure Node.js is installed
- Check you ran `npm install` in both folders

**Can't login with Google?**  
- Check your Google OAuth setup
- Make sure redirect URL is correct

**AI not responding?**
- Check your Gemini API key
- Make sure you have API credits

**Database errors?**
- Check your MongoDB connection string
- Make sure your IP is allowed in MongoDB Atlas

**Still stuck?** Create an issue on GitHub!
