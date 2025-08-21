const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Get last message for each user in contact list
router.get('/last/:userId', auth, async (req, res) => {
    try {
        const currentUser = req.user.id;
        // Find all conversations for current user
        const conversations = await Conversation.find({ participants: currentUser });
        const lastMessages = await Promise.all(conversations.map(async (conv) => {
            const otherUser = conv.participants.find(p => p.toString() !== currentUser);
            const lastMsg = await Message.findOne({ conversationId: conv._id })
                .sort({ createdAt: -1 });
            return {
                userId: otherUser,
                lastMessage: lastMsg ? lastMsg.content : '',
                time: lastMsg ? lastMsg.createdAt : null
            };
        }));
        res.json(lastMessages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
