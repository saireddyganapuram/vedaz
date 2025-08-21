const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

router.get('/:userId/messages', auth, async (req, res) => {
    try {
        const currentUser = req.user.id;
        const otherUser = req.params.userId;
        const conversation = await Conversation.findOne({
            participants: { $all: [currentUser, otherUser] }
        });
        if (!conversation) {
            return res.json([]);
        }
        const messages = await Message.find({ conversationId: conversation._id })
            .populate('sender', 'username')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;