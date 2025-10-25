# 💬 WhatsApp Clone Backend

A production-ready, full-featured WhatsApp clone backend built with **Node.js**, **Express**, **MongoDB**, **Socket.IO**, **Cloudinary**, and **Google Gemini AI**. This backend powers a real-time messaging application with support for 1-to-1 chats, group conversations, media uploads, AI chat assistant, and intelligent auto-reply features.

## 🚀 Features

### 🔐 Authentication & Security
- User registration and login with JWT authentication
- Secure HTTP-only cookies with proper CSRF protection (`secure: true`, `sameSite: "None"`)
- Token-based authorization for all protected routes
- Password hashing using bcryptjs (10 salt rounds)
- 7-day token expiration
- **Participant-level authorization** for all message operations (NEW ✅)
- All operations verify user is a conversation participant before allowing access

### 💬 Messaging Features
- **Text Messages**: Send and receive text messages in real-time
- **Media Messages**: Upload and share photos/videos via Cloudinary (50MB limit)
- **Message Editing**: Edit sent messages with timestamp tracking
- **Delete Options**: 
  - Delete for self (soft delete - message remains for others)
  - Delete for everyone (hard delete - sender only)
- **Reply Feature**: Reply to specific messages with context preservation
- **Forward Messages**: Forward messages to other conversations
- **Emoji Reactions**: React to messages with emojis (add/remove/toggle)
- **Seen Status**: Track which users have seen messages
- **Message Search**: Search messages within conversations or globally
- **Authorization**: All message operations verify user is a conversation participant (NEW ✅)

### 👥 Conversation Management
- **1-to-1 Chat**: Create private conversations between two users
- **Group Chats**: Create group conversations with multiple participants
- **Participant Management**: Add or remove participants from groups (admin-only)
- **Multi-Admin Support**: Groups can have multiple administrators
- **Admin Controls**: Change group admins, rename groups, update avatars
- **Last Message Tracking**: Automatic updates of the last message in conversations
- **Conversation Listing**: Fetch all user conversations sorted by last activity
- **Prevent Duplicates**: Checks for existing 1-to-1 conversations before creating new ones

### 📤 File Upload & Media
- Seamless integration with Cloudinary
- Automatic upload of images (JPEG, PNG, WebP, etc.)
- Video upload support (MP4, MOV, AVI, etc.)
- Auto-detection of file types
- Secure URL generation
- 50MB file size limit
- Organized folder structure in Cloudinary (`chat_uploads/`)
- Custom filename generation with timestamps
- **Media stored as array structure** for flexibility and multiple attachments (NEW ✅)

### ⚡ Real-Time Features (Socket.IO)
- **Instant Message Delivery**: Real-time message broadcasting with authorization
- **Online Status Tracking**: Track online/offline users across multiple devices
- **Typing Indicators**: Show when users are typing (start/stop)
- **Multi-Device Support**: Users can connect from multiple devices simultaneously
- **Real-Time Updates**: Edit, delete, and reaction updates in real-time
- **Room-Based Broadcasting**: Messages sent only to authorized conversation participants
- **JWT Socket Authentication**: Secure WebSocket connections with token verification
- **Automatic Reconnection**: Built-in reconnection logic
- **Error Handling**: Comprehensive error events for client-side handling
- **Participant Authorization**: All socket events verify user participation (NEW ✅)

### 🤖 AI Features (Google Gemini) - NEW ✅
- **AI Chat Assistant**: Chat with AI using Google Gemini 2.5 Flash
- **Smart Auto-Reply**: Automatically reply to messages when offline using AI
- **Conversation Context**: AI maintains conversation history for contextual responses
- **Tone Customization**: Choose from 3 reply modes:
  - **Friendly**: Warm, conversational with emojis 😊
  - **Professional**: Formal, clear, and concise
  - **Funny**: Witty and humorous with jokes 😄
- **Smart Suggestions**: Get AI-powered quick reply suggestions based on conversation
- **Auto-Reply Settings**: Enable/disable and configure per-user preferences
- **Offline Detection**: Auto-replies only trigger when user is offline
- **2-Second Delay**: Natural response timing for realistic auto-replies

## 🛠️ Technologies Used

### Backend Framework & Runtime
- **Node.js** - JavaScript runtime environment
- **Express.js v5.1.0** - Fast, minimalist web framework
- **ES Modules** - Modern JavaScript module system

### Database
- **MongoDB** - NoSQL document database
- **Mongoose v8.19.1** - Elegant MongoDB object modeling

### Real-Time Communication
- **Socket.IO v4.8.1** - Real-time bidirectional event-based communication

### AI & Machine Learning
- **Google Generative AI v0.24.1** - Gemini 2.5 Flash for chat and auto-reply

### File Storage & Upload
- **Cloudinary v1.37.2** - Cloud-based media management
- **Multer v2.0.2** - File upload middleware
- **Multer-Storage-Cloudinary v4.0.0** - Cloudinary storage for Multer

### Authentication & Security
- **JSON Web Token v9.0.2** - Secure token-based authentication
- **bcryptjs v3.0.2** - Password hashing
- **Cookie Parser v1.4.7** - Parse cookies

## 📁 Project Structure

```
whatsapp-clone-backend/
├── config/
│   ├── cloudinary.js       # Cloudinary configuration
│   ├── db.js                # MongoDB connection
│   └── gemini.js            # Google Gemini AI setup
├── controllers/
│   ├── authControllers.js  # Authentication logic
│   ├── conversationControllers.js  # Conversation management
│   ├── messageControllers.js       # Message operations
│   └── aiControllers.js            # AI features (NEW)
├── middleware/
│   ├── authMiddleware.js   # JWT verification
│   └── upload.js            # Multer/Cloudinary upload
├── models/
│   ├── User.js              # User schema (with autoReply settings)
│   ├── Conversation.js      # Conversation schema
│   └── Message.js           # Message schema (with media array)
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── conversationRoutes.js # Conversation endpoints
│   ├── messageRoutes.js     # Message endpoints
│   └── aiRoutes.js          # AI endpoints (NEW)
├── socket/
│   ├── index.js             # Socket.IO setup & auth
│   └── messageHandlers.js   # Real-time message handlers (with auto-reply)
├── server.js                # Application entry point
└── package.json
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB database
- Cloudinary account
- Google Gemini API key

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd whatsapp-clone-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Optional: Frontend URL for CORS
CLIENT_URL=http://localhost:3000
```

### 4. Run the server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://0.0.0.0:5000`

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |

**Example Request (Register):**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Example Response:**
```json
{
  "msg": "Registration successful",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "avatarUrl": "",
    "bio": "Hey there! I'm using ChatApp."
  }
}
```

### Conversation Routes (`/api/conversations`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all user conversations | Yes |
| POST | `/` | Create 1-to-1 conversation | Yes |
| POST | `/group` | Create group conversation | Yes |
| PUT | `/:id/participants/add` | Add participants to group | Yes (Admin) |
| PUT | `/:id/participants/remove` | Remove participants | Yes (Admin) |
| PUT | `/:id/admin` | Change group admin | Yes (Admin) |
| PUT | `/:id/rename` | Rename group | Yes (Admin) |
| PUT | `/:id/avatar` | Change group avatar | Yes (Admin) |

### Message Routes (`/api/messages`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Send message (text/media) | Yes (Participant) |
| GET | `/:conversationId` | Get conversation messages | Yes (Participant) |
| PUT | `/:id/edit` | Edit message | Yes (Sender & Participant) |
| DELETE | `/:id/deleteForMe` | Delete message for self | Yes (Participant) |
| DELETE | `/:id/deleteForEveryone` | Delete for everyone | Yes (Sender & Participant) |
| POST | `/reply` | Reply to message | Yes (Participant) |
| POST | `/forward/:id` | Forward message | Yes (Participant of both) |
| POST | `/react` | Add/remove emoji reaction | Yes (Participant) |

**Example Request (Send Message):**
```json
POST /api/messages
{
  "conversationId": "conv123",
  "text": "Hello, how are you?"
}
```

**Example Request (Send Media):**
```
POST /api/messages
Content-Type: multipart/form-data

conversationId: conv123
text: Check out this photo!
media: [file upload]
```

### AI Routes (`/api/ai`) - NEW ✅

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/chat` | Chat with AI assistant | Yes |
| GET | `/auto-reply` | Get auto-reply settings | Yes |
| PUT | `/auto-reply` | Update auto-reply settings | Yes |
| GET | `/suggestions/:conversationId` | Get smart reply suggestions | Yes |

**Example Request (Chat with AI):**
```json
POST /api/ai/chat
{
  "prompt": "Help me write a professional email",
  "conversationHistory": [
    { "sender": "User", "text": "I need help" },
    { "sender": "AI", "text": "How can I help you?" }
  ]
}
```

**Example Request (Update Auto-Reply):**
```json
PUT /api/ai/auto-reply
{
  "enabled": true,
  "mode": "friendly"
}
```

**Example Response (Smart Suggestions):**
```json
GET /api/ai/suggestions/conv123
{
  "suggestions": [
    "Sounds great! When should we meet?",
    "Thanks for letting me know",
    "I'll get back to you soon"
  ]
}
```

## 🔌 Socket.IO Events

### Client → Server Events

| Event | Data | Description |
|-------|------|-------------|
| `send-message` | `{ conversationId, text, media }` | Send a new message |
| `message-edited` | `{ messageId, newText }` | Edit existing message |
| `message-deleted` | `{ messageId, deleteType }` | Delete message |
| `message-reaction` | `{ messageId, emoji }` | Add/remove emoji reaction |
| `typing-started` | `conversationId` | User starts typing |
| `typing-stopped` | `conversationId` | User stops typing |
| `join-conversation` | `conversationId` | Join conversation room |
| `leave-conversation` | `conversationId` | Leave conversation room |

### Server → Client Events

| Event | Data | Description |
|-------|------|-------------|
| `new-message` | `{ message, conversationId, isAutoReply? }` | New message received |
| `message-updated` | `{ message, conversationId }` | Message edited or reacted |
| `message-removed` | `{ messageId, conversationId }` | Message deleted |
| `user-typing` | `{ userId, conversationId, userInfo }` | User is typing |
| `user-stopped-typing` | `{ userId, conversationId }` | User stopped typing |
| `update-online-users` | `[userIds]` | Online users list updated |
| `message-error` | `{ error }` | Error occurred |

### Socket Authentication
Socket connections require JWT authentication via:
1. Cookie header: `cookie: "token=your_jwt_token"`
2. Or auth handshake: `socket.handshake.auth.token = "your_jwt_token"`

## 📊 Database Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  avatarUrl: String,
  bio: String (default: "Hey there! I'm using ChatApp."),
  lastSeen: Date,
  status: String (enum: online/offline/away),
  autoReply: {
    enabled: Boolean (default: false),
    mode: String (enum: friendly/professional/funny, default: "friendly")
  },
  timestamps: true
}
```

### Conversation Model
```javascript
{
  participants: [ObjectId] (required),
  isGroup: Boolean (default: false),
  groupName: String,
  groupAvatar: String,
  groupAdmins: [ObjectId],
  createdBy: ObjectId,
  lastMessage: ObjectId (ref: Message),
  timestamps: true
}
```

### Message Model
```javascript
{
  sender: ObjectId (required, ref: User),
  conversation: ObjectId (required, ref: Conversation),
  text: String,
  media: [
    {
      url: String,
      type: String (enum: image/video/audio/file)
    }
  ],
  replyTo: ObjectId (ref: Message),
  forwarded: Boolean (default: false),
  forwardedFrom: ObjectId (ref: User),
  seenBy: [ObjectId] (ref: User),
  reactions: [
    {
      user: ObjectId (ref: User),
      emoji: String
    }
  ],
  isEdited: Boolean (default: false),
  editedAt: Date,
  deletedBy: [ObjectId] (ref: User),
  isDeletedForEveryone: Boolean (default: false),
  deletedAt: Date,
  timestamps: true
}
```

## 🤖 AI Auto-Reply Usage

### How Auto-Reply Works

1. **User enables auto-reply** in their settings:
   ```json
   PUT /api/ai/auto-reply
   {
     "enabled": true,
     "mode": "friendly"
   }
   ```

2. **Someone sends them a message** while they're offline

3. **AI generates a contextual response** based on:
   - Recent conversation history (last 5 messages)
   - User's preferred tone (friendly/professional/funny)
   - User's name and profile
   - Current conversation context

4. **Auto-reply is sent after 2 seconds** (simulates natural response time)

5. **Message is marked as auto-reply** (`isAutoReply: true`) for clarity

### Auto-Reply Modes

- **Friendly** 😊: "Hey! I'm away right now, but I'll get back to you soon! 😊"
- **Professional** 💼: "I am currently unavailable. I will respond to your message as soon as possible."
- **Funny** 😄: "I'm probably busy doing something awesome! I'll hit you back when I'm done! 😄"

### Smart Suggestions

Get AI-powered quick reply suggestions:
```javascript
GET /api/ai/suggestions/:conversationId

// Response:
{
  "suggestions": [
    "That sounds great!",
    "Let me think about it",
    "I'll get back to you"
  ]
}
```

## 🔒 Security Features

### Authorization & Authentication
- ✅ All message operations verify conversation participation
- ✅ Socket events check user authorization before processing
- ✅ JWT tokens with secure cookies (`httpOnly: true`, `secure: true`, `sameSite: "None"`)
- ✅ Password hashing with bcryptjs
- ✅ Protected routes with authMiddleware
- ✅ Sender verification for edit/delete operations
- ✅ Admin verification for group management

### Data Protection
- ✅ Participant-level access control on all operations
- ✅ Admin-only group management operations
- ✅ Sender-only message editing and deletion
- ✅ Soft delete support (messages remain for others)
- ✅ Media files stored securely on Cloudinary
- ✅ No user can access conversations they're not part of

## 🐛 Critical Bug Fixes (Latest Update)

### Security & Authorization Fixes ✅
1. **Authorization Bypass Fixed**: Added participant verification to ALL message controllers and socket handlers
   - `sendMessage` - now verifies user is conversation participant
   - `getMessages` - now verifies user is conversation participant
   - `reactToMessage` - now verifies user is conversation participant
   - `editMessage` - now verifies user is conversation participant
   - `deleteMessageForMe` - now verifies user is conversation participant
   - `deleteMessageForEveryone` - now verifies user is conversation participant
   - `forwardMessage` - now verifies user is participant of both conversations
   - All socket events (`send-message`, `message-edited`, `message-deleted`, `message-reaction`, `typing-started`, `typing-stopped`) now verify participation

2. **Media Schema Fixed**: Aligned all controllers and socket handlers with Message model's `media` array structure
   - Changed from single `mediaUrl` field to `media: [{ url, type }]` array
   - Updated all populate operations to use `media` instead of `mediaUrl`
   - Fixed conversation lastMessage population

3. **Cookie Security Fixed**: Set `secure: true` for all environments
   - Fixed CSRF vulnerability with proper cookie settings
   - Cookies now work correctly with `sameSite: "None"`

### Performance & Functionality Improvements ✅
4. **Auto-Reply Integration**: Fully integrated AI-powered auto-replies with Socket.IO
5. **Smart Authorization Helper**: Created `checkParticipation()` helper function to DRY up code
6. **Enhanced Error Messages**: Better error handling with specific authorization messages

## 🧪 Testing

### Test Socket.IO Integration
```bash
node testSocket.js
```

Make sure to:
1. Replace placeholder values with real user IDs and conversation IDs
2. Update the JWT token with a valid token from login
3. Ensure MongoDB is connected

### Manual Testing Checklist
- [ ] Register and login
- [ ] Create 1-to-1 conversation
- [ ] Send text message
- [ ] Send media message
- [ ] React to message
- [ ] Edit message
- [ ] Delete message
- [ ] Create group chat
- [ ] Add/remove participants
- [ ] Test auto-reply (enable, send message while offline)
- [ ] Test AI chat
- [ ] Test smart suggestions

## 📝 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `5000` |
| `NODE_ENV` | No | Environment | `development` or `production` |
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Yes | Secret key for JWT signing | `your_secret_key_123` |
| `JWT_EXPIRE` | No | Token expiration | `7d` |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret | `abc123def456` |
| `GEMINI_API_KEY` | Yes | Google Gemini API key | `AIza...` |
| `CLIENT_URL` | No | Frontend URL for CORS | `http://localhost:3000` |

## 🚀 Deployment

This backend is ready for deployment on:
- ✅ **Replit** (currently configured)
- Heroku
- Railway
- Render
- AWS EC2
- DigitalOcean
- Vercel (serverless functions)

### Deployment Checklist
- [ ] Set all environment variables
- [ ] Use production MongoDB instance (MongoDB Atlas recommended)
- [ ] Configure CORS for your frontend domain
- [ ] Ensure HTTPS is enabled (required for secure cookies)
- [ ] Set `NODE_ENV=production`
- [ ] Test all endpoints and Socket.IO connections

## 📚 Frontend Integration Guide

See **[FRONTEND.md](./FRONTEND.md)** for a comprehensive guide on integrating this backend with:
- React + Tailwind CSS
- Socket.IO client setup
- Authentication flow
- Real-time messaging
- Media uploads
- AI features

## 📖 Additional Documentation

- **[SOCKET_INTEGRATION_SUMMARY.md](./SOCKET_INTEGRATION_SUMMARY.md)** - Socket.IO integration details
- **[doc.md](./doc.md)** - Additional technical documentation
- **[replit.md](./replit.md)** - Project overview and recent changes

## 📄 License

MIT License - feel free to use this project for learning or production!

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review documentation files

---

**Built with ❤️ using Node.js, Express, MongoDB, Socket.IO, Cloudinary, and Google Gemini AI**

**Last Updated**: October 19, 2025
