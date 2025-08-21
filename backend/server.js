const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Models
const User = require('./models/user');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

// Routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const conversationsRoutes = require('./routes/conversations');

dotenv.config();

const app = express();
const server = http.createServer(app);
// --- FIX: Corrected server initialization from 'new new Server' to 'new Server' ---
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your frontend URL
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/auth', authRoutes);
const lastMessageRoutes = require('./routes/lastMessage');
app.use('/api/lastMessage', lastMessageRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/conversations', conversationsRoutes);

// Socket.IO Logic
let onlineUsers = new Map(); // Map userId to socketId

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // When a client asks for the list of online users
  socket.on('users:get_online', () => {
    socket.emit('users:online', Array.from(onlineUsers.keys()));
  });

  // Add user to online users list
  socket.on('user:online', (userId) => {
    console.log(`User ${userId} is online with socket ${socket.id}`);
    onlineUsers.set(userId, socket.id);
    io.emit('users:online', Array.from(onlineUsers.keys()));
  });

  // Handle user going offline
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    let disconnectedUserId = null;
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }
    if (disconnectedUserId) {
        io.emit('users:online', Array.from(onlineUsers.keys()));
    }
  });
  
  // Handle sending a message
  socket.on('message:send', async (data) => {
    console.log('\n--- Received message:send event ---');
    console.log('Data received from sender:', data);
    console.log('Current online users map:', Array.from(onlineUsers.entries()));
    
    const { senderId, receiverId, content } = data;
    
    try {
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] }
      });
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId]
        });
      }

      const newMessage = new Message({
        conversationId: conversation._id,
        sender: senderId,
        receiver: receiverId,
        content: content,
      });
      await newMessage.save();

      await newMessage.populate('sender', 'username');

      const receiverSocketId = onlineUsers.get(receiverId);

      console.log(`Attempting to find receiver socket for ID ${receiverId}. Found: ${receiverSocketId}`);

      if (receiverSocketId) {
  console.log(`Sending 'message:new' to socket ID ${receiverSocketId}`);
  // Mark as delivered before sending
  await Message.findByIdAndUpdate(newMessage._id, { status: 'delivered' });
  newMessage.status = 'delivered';
  io.to(receiverSocketId).emit('message:new', newMessage);
      } else {
        console.log(`Receiver ${receiverId} is not online. Message will be stored but not sent in real-time.`);
      }

      socket.emit('message:sent', newMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message.' });
    }
  });

  // Handle typing indicators
  socket.on('typing:start', (data) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:start', { senderId: data.senderId });
    }
  });

  socket.on('typing:stop', (data) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:stop', { senderId: data.senderId });
    }
  });
  
  // Handle message read receipts
  socket.on('message:read', async (data) => {
    const { conversationId, userId } = data;
    try {
        await Message.updateMany(
            { conversationId: conversationId, receiver: userId, status: { $ne: 'read' } },
            { $set: { status: 'read' } }
        );

        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
            const otherUserId = conversation.participants.find(p => p.toString() !== userId);
            const otherUserSocketId = onlineUsers.get(otherUserId.toString());
            if (otherUserSocketId) {
                io.to(otherUserSocketId).emit('message:read:receipt', { conversationId });
            }
        }
    } catch (error) {
        console.error('Error updating message status to read:', error);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
