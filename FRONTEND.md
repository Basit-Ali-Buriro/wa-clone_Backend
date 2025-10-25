# Frontend Integration Guide
## React + Tailwind CSS with WhatsApp Clone Backend

This comprehensive guide will help you build a modern, responsive WhatsApp clone frontend using **React** and **Tailwind CSS** that connects to this backend API.

## 📋 Table of Contents

1. [Project Setup](#project-setup)
2. [Project Structure](#project-structure)
3. [Environment Configuration](#environment-configuration)
4. [Authentication Setup](#authentication-setup)
5. [Socket.IO Integration](#socketio-integration)
6. [API Service Layer](#api-service-layer)
7. [React Components](#react-components)
8. [Tailwind CSS Styling](#tailwind-css-styling)
9. [State Management](#state-management)
10. [Media Upload](#media-upload)
11. [AI Features Integration](#ai-features-integration)
12. [Deployment](#deployment)

---

## 🚀 Project Setup

### 1. Create React App with Vite

```bash
# Create new Vite + React project
npm create vite@latest whatsapp-frontend -- --template react
cd whatsapp-frontend

# Install dependencies
npm install

# Install additional packages
npm install axios socket.io-client react-router-dom
npm install zustand # For state management
npm install react-hot-toast # For notifications
npm install emoji-picker-react # For emoji picker
npm install date-fns # For date formatting
npm install @headlessui/react # For UI components

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Configure Tailwind CSS

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#075E54',
        secondary: '#128C7E',
        teal: '#25D366',
        gray: {
          light: '#F0F2F5',
          medium: '#8696A0',
          dark: '#3B4A54',
        },
        blue: {
          light: '#D1F4CC',
          DEFAULT: '#34B7F1',
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .chat-bubble {
    @apply rounded-lg px-3 py-2 max-w-md break-words;
  }
  
  .chat-bubble-sent {
    @apply bg-blue-light text-gray-900 ml-auto;
  }
  
  .chat-bubble-received {
    @apply bg-white text-gray-900;
  }
  
  .input-field {
    @apply w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20;
  }
  
  .btn-primary {
    @apply bg-primary hover:bg-secondary text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200;
  }
  
  .btn-secondary {
    @apply bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200;
  }
}
```

---

## 📂 Project Structure

```
whatsapp-frontend/
├── public/
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── chat/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   └── EmojiPicker.jsx
│   │   ├── sidebar/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ConversationList.jsx
│   │   │   └── ConversationItem.jsx
│   │   ├── modals/
│   │   │   ├── NewChatModal.jsx
│   │   │   ├── NewGroupModal.jsx
│   │   │   └── ProfileModal.jsx
│   │   ├── ai/
│   │   │   ├── AIChat.jsx
│   │   │   ├── AutoReplySettings.jsx
│   │   │   └── SmartSuggestions.jsx
│   │   └── common/
│   │       ├── Avatar.jsx
│   │       ├── LoadingSpinner.jsx
│   │       └── TypingIndicator.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.service.js
│   │   ├── conversation.service.js
│   │   ├── message.service.js
│   │   ├── ai.service.js
│   │   └── socket.service.js
│   ├── store/
│   │   ├── useAuthStore.js
│   │   ├── useConversationStore.js
│   │   └── useMessageStore.js
│   ├── utils/
│   │   ├── formatDate.js
│   │   └── uploadMedia.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Chat.jsx
│   │   └── Settings.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## ⚙️ Environment Configuration

**.env:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

**.env.example:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

**vite.config.js:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      }
    }
  }
})
```

---

## 🔐 Authentication Setup

### Auth Store (Zustand)

**src/store/useAuthStore.js:**
```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      }),
      
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData }
      })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### Auth Service

**src/services/auth.service.js:**
```javascript
import api from './api';

export const authService = {
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  logout: async () => {
    // Clear cookies and local storage
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.clear();
  },
};
```

### Login Component

**src/components/auth/Login.jsx:**
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      setAuth(data.user, data.token);
      toast.success('Login successful!');
      navigate('/chat');
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-light flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">WhatsApp Clone</h1>
          <p className="text-gray-medium mt-2">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-medium">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-primary font-semibold hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
```

### Register Component

**src/components/auth/Register.jsx:**
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const data = await authService.register(
        formData.name,
        formData.email,
        formData.password
      );
      setAuth(data.user, data.token);
      toast.success('Registration successful!');
      navigate('/chat');
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-light flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Create Account</h1>
          <p className="text-gray-medium mt-2">Join WhatsApp Clone</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-medium">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-primary font-semibold hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
```

---

## 🔌 Socket.IO Integration

### Socket Service

**src/services/socket.service.js:**
```javascript
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Send message
  sendMessage(data) {
    this.socket?.emit('send-message', data);
  }

  // Edit message
  editMessage(messageId, newText) {
    this.socket?.emit('message-edited', { messageId, newText });
  }

  // Delete message
  deleteMessage(messageId, deleteType) {
    this.socket?.emit('message-deleted', { messageId, deleteType });
  }

  // React to message
  reactToMessage(messageId, emoji) {
    this.socket?.emit('message-reaction', { messageId, emoji });
  }

  // Typing indicators
  startTyping(conversationId) {
    this.socket?.emit('typing-started', conversationId);
  }

  stopTyping(conversationId) {
    this.socket?.emit('typing-stopped', conversationId);
  }

  // Join/Leave conversation
  joinConversation(conversationId) {
    this.socket?.emit('join-conversation', conversationId);
  }

  leaveConversation(conversationId) {
    this.socket?.emit('leave-conversation', conversationId);
  }

  // Event listeners
  on(event, callback) {
    this.socket?.on(event, callback);
    this.listeners.set(event, callback);
  }

  off(event) {
    const callback = this.listeners.get(event);
    if (callback) {
      this.socket?.off(event, callback);
      this.listeners.delete(event);
    }
  }
}

export default new SocketService();
```

### Socket Hooks

**src/hooks/useSocket.js:**
```javascript
import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useMessageStore } from '../store/useMessageStore';
import socketService from '../services/socket.service';
import toast from 'react-hot-toast';

export function useSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const { addMessage, updateMessage, removeMessage } = useMessageStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Connect socket
    socketService.connect(token);

    // Listen for new messages
    socketService.on('new-message', ({ message, conversationId, isAutoReply }) => {
      addMessage(conversationId, message);
      
      if (isAutoReply) {
        toast('🤖 Auto-reply sent', {
          icon: '✨',
        });
      }
    });

    // Listen for message updates
    socketService.on('message-updated', ({ message, conversationId }) => {
      updateMessage(conversationId, message);
    });

    // Listen for message removal
    socketService.on('message-removed', ({ messageId, conversationId }) => {
      removeMessage(conversationId, messageId);
    });

    // Listen for typing indicators
    socketService.on('user-typing', ({ userId, conversationId, userInfo }) => {
      // Update typing state
      console.log(`${userInfo.name} is typing...`);
    });

    socketService.on('user-stopped-typing', ({ userId, conversationId }) => {
      // Clear typing state
    });

    // Listen for online users
    socketService.on('update-online-users', (userIds) => {
      // Update online users list
      console.log('Online users:', userIds);
    });

    // Listen for errors
    socketService.on('message-error', ({ error }) => {
      toast.error(error);
    });

    // Cleanup
    return () => {
      socketService.off('new-message');
      socketService.off('message-updated');
      socketService.off('message-removed');
      socketService.off('user-typing');
      socketService.off('user-stopped-typing');
      socketService.off('update-online-users');
      socketService.off('message-error');
      socketService.disconnect();
    };
  }, [isAuthenticated, token, addMessage, updateMessage, removeMessage]);

  return socketService;
}
```

---

## 🌐 API Service Layer

### Base API Setup

**src/services/api.js:**
```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage');
    if (token) {
      const parsed = JSON.parse(token);
      if (parsed.state?.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth and redirect
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Message Service

**src/services/message.service.js:**
```javascript
import api from './api';

export const messageService = {
  // Get messages for a conversation
  getMessages: async (conversationId) => {
    const response = await api.get(`/messages/${conversationId}`);
    return response.data;
  },

  // Send text message
  sendMessage: async (conversationId, text, replyTo = null) => {
    const response = await api.post('/messages', {
      conversationId,
      text,
      replyTo,
    });
    return response.data;
  },

  // Send media message
  sendMediaMessage: async (conversationId, file, text = '') => {
    const formData = new FormData();
    formData.append('conversationId', conversationId);
    formData.append('media', file);
    if (text) formData.append('text', text);

    const response = await api.post('/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Edit message
  editMessage: async (messageId, newText) => {
    const response = await api.put(`/messages/${messageId}/edit`, { newText });
    return response.data;
  },

  // Delete message for me
  deleteForMe: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}/deleteForMe`);
    return response.data;
  },

  // Delete message for everyone
  deleteForEveryone: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}/deleteForEveryone`);
    return response.data;
  },

  // Reply to message
  replyToMessage: async (conversationId, text, replyTo) => {
    const response = await api.post('/messages/reply', {
      conversationId,
      text,
      replyTo,
    });
    return response.data;
  },

  // Forward message
  forwardMessage: async (messageId, targetConversationId) => {
    const response = await api.post(`/messages/forward/${messageId}`, {
      targetConversationId,
    });
    return response.data;
  },

  // React to message
  reactToMessage: async (messageId, emoji) => {
    const response = await api.post('/messages/react', {
      messageId,
      emoji,
    });
    return response.data;
  },
};
```

### Conversation Service

**src/services/conversation.service.js:**
```javascript
import api from './api';

export const conversationService = {
  // Get all conversations
  getConversations: async () => {
    const response = await api.get('/conversations');
    return response.data.conversations;
  },

  // Create 1-to-1 conversation
  createConversation: async (recipientId) => {
    const response = await api.post('/conversations', { recipientId });
    return response.data;
  },

  // Create group conversation
  createGroup: async (name, participants, groupAvatar = '') => {
    const response = await api.post('/conversations/group', {
      name,
      participants,
      groupAvatar,
    });
    return response.data.group;
  },

  // Add participants to group
  addParticipants: async (groupId, participants) => {
    const response = await api.put(`/conversations/${groupId}/participants/add`, {
      participants,
    });
    return response.data;
  },

  // Remove participants from group
  removeParticipants: async (groupId, participants) => {
    const response = await api.put(`/conversations/${groupId}/participants/remove`, {
      participants,
    });
    return response.data;
  },

  // Change group admin
  changeGroupAdmin: async (groupId, newAdminId) => {
    const response = await api.put(`/conversations/${groupId}/admin`, {
      newAdminId,
    });
    return response.data;
  },

  // Rename group
  renameGroup: async (groupId, newName) => {
    const response = await api.put(`/conversations/${groupId}/rename`, {
      newName,
    });
    return response.data;
  },

  // Change group avatar
  changeGroupAvatar: async (groupId, groupAvatar) => {
    const response = await api.put(`/conversations/${groupId}/avatar`, {
      groupAvatar,
    });
    return response.data;
  },
};
```

### AI Service

**src/services/ai.service.js:**
```javascript
import api from './api';

export const aiService = {
  // Chat with AI
  chatWithAI: async (prompt, conversationHistory = []) => {
    const response = await api.post('/ai/chat', {
      prompt,
      conversationHistory,
    });
    return response.data;
  },

  // Get auto-reply settings
  getAutoReplySettings: async () => {
    const response = await api.get('/ai/auto-reply');
    return response.data.autoReply;
  },

  // Update auto-reply settings
  updateAutoReplySettings: async (enabled, mode) => {
    const response = await api.put('/ai/auto-reply', {
      enabled,
      mode,
    });
    return response.data;
  },

  // Get smart suggestions
  getSmartSuggestions: async (conversationId) => {
    const response = await api.get(`/ai/suggestions/${conversationId}`);
    return response.data.suggestions;
  },
};
```

---

## 🎨 React Components

### Message Bubble Component

**src/components/chat/MessageBubble.jsx:**
```jsx
import { format } from 'date-fns';
import { useState } from 'react';

export default function MessageBubble({ message, isOwn, onReact, onEdit, onDelete, onReply }) {
  const [showActions, setShowActions] = useState(false);

  const renderMedia = () => {
    if (!message.media || message.media.length === 0) return null;

    return (
      <div className="mb-2">
        {message.media.map((item, index) => (
          <div key={index}>
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt="Message media"
                className="max-w-sm rounded-lg"
              />
            ) : item.type === 'video' ? (
              <video
                src={item.url}
                controls
                className="max-w-sm rounded-lg"
              />
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`chat-bubble ${isOwn ? 'chat-bubble-sent' : 'chat-bubble-received'}`}>
        {message.replyTo && (
          <div className="bg-gray-100 rounded p-2 mb-2 border-l-4 border-primary text-sm">
            <p className="text-gray-600 truncate">{message.replyTo.text}</p>
          </div>
        )}

        {renderMedia()}

        <p className="text-sm">{message.text}</p>

        {message.isEdited && (
          <span className="text-xs text-gray-500 italic"> (edited)</span>
        )}

        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>

          {message.reactions && message.reactions.length > 0 && (
            <div className="flex space-x-1 ml-2">
              {message.reactions.map((reaction, idx) => (
                <span key={idx} className="text-xs">
                  {reaction.emoji}
                </span>
              ))}
            </div>
          )}
        </div>

        {showActions && (
          <div className="absolute top-0 right-0 flex space-x-1 bg-white shadow-lg rounded p-1">
            <button onClick={() => onReact(message._id, '❤️')} className="text-sm">❤️</button>
            <button onClick={() => onReact(message._id, '👍')} className="text-sm">👍</button>
            <button onClick={() => onReact(message._id, '😂')} className="text-sm">😂</button>
            <button onClick={() => onReply(message)} className="text-xs px-2">Reply</button>
            {isOwn && (
              <>
                <button onClick={() => onEdit(message)} className="text-xs px-2">Edit</button>
                <button onClick={() => onDelete(message._id)} className="text-xs px-2 text-red-500">Delete</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Message Input Component

**src/components/chat/MessageInput.jsx:**
```jsx
import { useState, useRef } from 'react';
import { PaperAirplaneIcon, PhotoIcon } from '@heroicons/react/24/solid';
import EmojiPicker from 'emoji-picker-react';
import socketService from '../../services/socket.service';
import { messageService } from '../../services/message.service';
import toast from 'react-hot-toast';

export default function MessageInput({ conversationId, replyTo, onCancelReply }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef();

  const handleTyping = (value) => {
    setText(value);
    
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      socketService.startTyping(conversationId);
    }
    
    if (isTyping && value.length === 0) {
      setIsTyping(false);
      socketService.stopTyping(conversationId);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    try {
      const messageData = {
        conversationId,
        text,
        media: [],
      };

      if (replyTo) {
        messageData.replyTo = replyTo._id;
      }

      socketService.sendMessage(messageData);
      
      setText('');
      setIsTyping(false);
      socketService.stopTyping(conversationId);
      
      if (replyTo) {
        onCancelReply();
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    try {
      await messageService.sendMediaMessage(conversationId, file, text);
      setText('');
      toast.success('Media uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload media');
    }
  };

  const handleEmojiClick = (emojiData) => {
    setText(text + emojiData.emoji);
    setShowEmoji(false);
  };

  return (
    <div className="bg-gray-light p-4 border-t">
      {replyTo && (
        <div className="bg-white rounded-lg p-2 mb-2 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Replying to: </span>
            <span className="truncate">{replyTo.text}</span>
          </div>
          <button onClick={onCancelReply} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-2 hover:bg-gray-200 rounded-full"
        >
          😊
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-200 rounded-full"
        >
          <PhotoIcon className="w-6 h-6 text-gray-600" />
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,video/*"
          className="hidden"
        />

        <input
          type="text"
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message"
          className="flex-1 input-field"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-3 bg-primary text-white rounded-full hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="w-5 h-5" />
        </button>
      </div>

      {showEmoji && (
        <div className="absolute bottom-20 right-4">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
}
```

### AI Auto-Reply Settings Component

**src/components/ai/AutoReplySettings.jsx:**
```jsx
import { useState, useEffect } from 'react';
import { aiService } from '../../services/ai.service';
import toast from 'react-hot-toast';

export default function AutoReplySettings() {
  const [settings, setSettings] = useState({
    enabled: false,
    mode: 'friendly',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await aiService.getAutoReplySettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await aiService.updateAutoReplySettings(settings.enabled, settings.mode);
      toast.success('Auto-reply settings updated!');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">🤖 AI Auto-Reply</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-medium">Enable Auto-Reply</label>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            className="w-12 h-6"
          />
        </div>

        {settings.enabled && (
          <div>
            <label className="font-medium mb-2 block">Reply Tone</label>
            <select
              value={settings.mode}
              onChange={(e) => setSettings({ ...settings, mode: e.target.value })}
              className="input-field"
            >
              <option value="friendly">😊 Friendly (Warm & Casual)</option>
              <option value="professional">💼 Professional (Formal & Clear)</option>
              <option value="funny">😄 Funny (Witty & Humorous)</option>
            </select>
          </div>
        )}

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full btn-primary"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>

        {settings.enabled && (
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700">
            <p className="font-semibold">ℹ️ How it works:</p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Auto-replies are sent when you're offline</li>
              <li>AI uses conversation context for relevant responses</li>
              <li>Replies are marked with a robot icon 🤖</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 📱 Main App Structure

**src/App.jsx:**
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Chat from './pages/Chat';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/chat" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🚀 Running the Application

### 1. Start Backend Server
```bash
cd whatsapp-backend
npm run dev
```

### 2. Start Frontend Development Server
```bash
cd whatsapp-frontend
npm run dev
```

### 3. Open Browser
Navigate to `http://localhost:3000`

---

## 📦 Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

---

## 🎯 Key Features Implementation Summary

✅ **Authentication** - Login/Register with JWT  
✅ **Real-time Messaging** - Socket.IO integration  
✅ **Media Upload** - Cloudinary integration  
✅ **Emoji Reactions** - Add/remove reactions  
✅ **Reply/Forward** - Message interactions  
✅ **Typing Indicators** - Real-time typing status  
✅ **Online Status** - Track online users  
✅ **Group Chats** - Create and manage groups  
✅ **AI Auto-Reply** - Smart offline responses  
✅ **Smart Suggestions** - AI-powered quick replies  

---

## 🔧 Troubleshooting

### CORS Issues
Add backend URL to CORS whitelist in backend `server.js`

### Cookie Not Working
Ensure `withCredentials: true` in axios config

### Socket Not Connecting
Check Socket URL and JWT token in auth

### Media Upload Failed
Verify Cloudinary credentials and file size

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [Axios Documentation](https://axios-http.com)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)

---

**Happy Coding! 🚀**

Built with ❤️ using React, Tailwind CSS, Socket.IO, and Google Gemini AI
