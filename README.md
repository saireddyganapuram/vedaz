# Real-Time Chat Application

A full-stack real-time chat application built with React, Node.js, Socket.IO, and MongoDB. Features include real-time messaging, online/offline status, message read receipts, and typing indicators.

## Features

- 🔐 User authentication (Register/Login)
- 💬 Real-time messaging
- 👥 User online/offline status
- ✔️ Message read receipts (double tick system)
- ⌨️ Typing indicators
- 🔍 User search functionality
- 📱 Responsive design

## Tech Stack

### Frontend
- React
- Socket.IO Client
- Axios
- TailwindCSS
- Vite

### Backend
- Node.js
- Express
- Socket.IO
- MongoDB
- JWT Authentication

## Prerequisites

Before running this application, make sure you have:

- Node.js (v14 or higher)
- MongoDB installed and running
- Git

## Setup Instructions

1. Clone the repository
```bash
git clone https://github.com/saireddyganapuram/vedaz.git
cd vedaz
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables

### Backend (.env)
Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### Frontend (.env)
Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Running the Application

1. Start the backend server
```bash
cd backend
npm start
```

2. Start the frontend development server
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Sample Users

You can use these sample users to test the application:

1. User 1
   - Username: john_doe
   - Password: password123

2. User 2
   - Username: jane_smith
   - Password: password123

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Messages
- GET `/api/conversations/:userId/messages` - Get messages for a conversation
- GET `/api/lastMessage/last/:userId` - Get last message for each conversation

### Users
- GET `/api/users` - Get all users
- GET `/api/users/online` - Get online users

## Socket Events

### Client to Server
- `user:online` - Emit when user comes online
- `message:send` - Send a new message
- `typing:start` - User starts typing
- `typing:stop` - User stops typing
- `message:read` - Mark message as read

### Server to Client
- `users:online` - Receive online users list
- `message:new` - Receive new message
- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `message:read:receipt` - Message read receipt

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Author

saireddyganapuram
