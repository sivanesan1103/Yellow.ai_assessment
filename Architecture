# 🎯 System Overview

**Yellow.ai** is a modern full-stack chatbot platform that enables users to have intelligent conversations with Google's Gemini AI. The system provides secure authentication, project management, and persistent chat history.

## Core Features

- 🔐 **Google OAuth Authentication**
- 💬 **AI-Powered Conversations** (Google Gemini)
- 📁 **Project-Based Chat Organization**
- 💾 **Persistent Chat History**
- 📱 **Responsive Web Interface**

---

# 🏗️ Architecture Patterns

## 1. Three-Tier Architecture
- **Presentation Layer** – React.js (Frontend)
- **Application Layer** – Node.js + Express.js (Backend)
- **Data Layer** – MongoDB (Atlas)

## 2. MVC Pattern (Backend)
- **Models**: Data schemas and business logic
- **Views**: JSON API responses
- **Controllers**: Request handling and business operations

## 3. Component-Based Architecture (Frontend)
- Reusable React components
- Context-based state management
- Single Page Application (SPA)

---

# ⚙️ Technology Stack

## Frontend Stack
- **React** - UI framework
- **Vite** - Build tool & dev server
- **TailwindCSS** - Styling framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **React Markdown** - Markdown rendering
- **PrismJS** - Code syntax highlighting

## Backend Stack
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM (Object Document Mapper)
- **Passport.js** - Authentication middleware
- **JWT** - Token management
- **bcryptjs** - Password hashing
- **Google Gemini API** - AI integration

## Infrastructure & DevOps
- **Deployment**: Vercel, Railway, Render, AWS EC2
- **Database**: MongoDB Atlas (cloud)
- **CDN**: Platform-provided
- **Process Management**: PM2 (for VPS deployment)

---

# 📊 System Architecture Diagrams

## High-Level System Architecture

```mermaid
graph TB
    User[👤 User] --> Browser[🌐 Web Browser]
    Browser --> Frontend[⚛️ React Frontend<br/>Vite + TailwindCSS]
    Frontend --> API[🔌 REST API<br/>Express.js Server]
    API --> Auth[🔐 Authentication<br/>JWT + Google OAuth]
    API --> DB[(🗄️ MongoDB Atlas<br/>User, Projects, Chats)]
    API --> AI[🤖 Google Gemini<br/>AI Chat API]
    Auth --> Google[📱 Google OAuth 2.0]
    
    style Frontend fill:#61DAFB
    style API fill:#68A063
    style DB fill:#4DB33D
    style AI fill:#4285F4
    style Auth fill:#FF6B35
```

## Frontend Component Tree

```mermaid
graph TB
    App[App.jsx<br/>🏠 Main Application]
    App --> Router[React Router<br/>🧭 Routing]
    App --> Context[AppContext<br/>🔄 Global State]
    App --> Toast[Toaster<br/>📢 Notifications]
    
    Router --> Login[Login.jsx<br/>🔐 Authentication Page]
    Router --> Main[Main Layout<br/>📱 Application Shell]
    
    Main --> Sidebar[Sidebar.jsx<br/>📋 Navigation Menu]
    Main --> ChatArea[Chat Area<br/>💬 Main Content]
    
    Sidebar --> ProjectSelector[ProjectSelector.jsx<br/>📁 Project Management]
    ChatArea --> ChatBox[ChatBox.jsx<br/>💬 Chat Interface]
    
    ChatBox --> MessageList[Message List<br/>📜 Chat History]
    ChatBox --> InputArea[Input Area<br/>✏️ Message Input]
    
    MessageList --> Message[Message.jsx<br/>💭 Individual Message]
    
    style App fill:#61DAFB
    style Context fill:#FF6B6B
    style Login fill:#4ECDC4
    style ChatBox fill:#45B7D1
```

---

# 🔄 Data Flow Diagrams

## User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant G as Google OAuth
    participant DB as MongoDB
    
    U->>F: Click "Login with Google"
    F->>B: GET /auth/google
    B->>G: Redirect to Google OAuth
    G->>U: Google login page
    U->>G: Provide credentials
    G->>B: OAuth callback with code
    B->>G: Exchange code for user data
    G->>B: User profile data
    B->>DB: Save/update user
    B->>F: JWT tokens + user data
    F->>U: Redirect to dashboard
```

## Chat Message Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant AI as Gemini AI
    participant DB as MongoDB
    
    U->>F: Send message
    F->>B: POST /api/chat
    B->>DB: Save user message
    B->>AI: Send to Gemini API
    AI->>B: AI response
    B->>DB: Save AI response
    B->>F: Return AI message
    F->>U: Display response
```

---

# 🌐 API Documentation

## Authentication Endpoints

```
GET    /auth/google              # Initiate Google OAuth
GET    /auth/google/callback     # OAuth callback
POST   /auth/logout              # Logout user
POST   /auth/refresh             # Refresh JWT token
GET    /auth/verify              # Verify token validity
```

## User Management

```
GET    /api/user/profile         # Get user profile
PUT    /api/user/profile         # Update user profile
DELETE /api/user/account         # Delete user account
```

## Project Management

```
GET    /api/projects             # Get user projects
POST   /api/projects             # Create new project
PUT    /api/projects/:id         # Update project
DELETE /api/projects/:id         # Delete project
```

## Chat & Messages

```
GET    /api/messages/:projectId  # Get project messages
POST   /api/chat                 # Send chat message
DELETE /api/messages/:messageId  # Delete message
POST   /api/messages/clear       # Clear all messages
```

## Request/Response Formats

### Chat Request
```json
{
  "message": "Hello, how are you?",
  "projectId": "64f5a1b2c3d4e5f6789012ab"
}
```

### Chat Response
```json
{
  "success": true,
  "data": {
    "response": "Hello! I'm doing well, thank you for asking...",
    "messageId": "64f5a1b2c3d4e5f6789012cd",
    "tokenCount": 25
  }
}
```

---

# 🔐 Authentication & Security

## Authentication Strategy

1. **Google OAuth 2.0** - Primary authentication method
2. **JWT Tokens** - Session management
3. **Refresh Tokens** - Long-term authentication

## Security Measures

### Backend Security
- ✅ **JWT Token Validation** - All protected routes
- ✅ **CORS Configuration** - Cross-origin protection
- ✅ **Input Validation** - Request sanitization
- ✅ **Rate Limiting** - API abuse prevention
- ✅ **Password Hashing** - bcrypt with salt
- ✅ **Environment Variables** - Sensitive data protection

### Frontend Security
- ✅ **Token Storage** - HttpOnly cookies preferred
- ✅ **XSS Protection** - Input sanitization
- ✅ **HTTPS Enforcement** - Production deployment
- ✅ **CSP Headers** - Content Security Policy

### Database Security
- ✅ **Connection Encryption** - TLS/SSL
- ✅ **Access Control** - IP whitelisting
- ✅ **Data Validation** - Mongoose schemas
- ✅ **Backup Strategy** - Automated backups

---

# 📈 Monitoring Strategy

- **Error Tracking** - Comprehensive logging system
- **Performance Metrics** - Response time and throughput monitoring
- **User Analytics** - Behavior tracking and insights
- **Resource Usage** - Server and database monitoring

---

# 🏁 Conclusion

Yellow.ai demonstrates modern full-stack development practices with a focus on:

- **Scalable Architecture** - Modular, maintainable code structure
- **Security First** - Comprehensive authentication and protection
- **User Experience** - Responsive, intuitive interface
- **Developer Experience** - Clear documentation and easy setup
- **Production Ready** - Multiple deployment options and monitoring

The architecture supports both rapid development and production scalability, making it suitable for everything from personal projects to enterprise applications.
