const express = require('express');
const Message = require('../models/Message');
const Report = require('../models/Report');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Get all message threads for a user (either patient or doctor)
router.get('/', auth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Find all unique reports where the user is either the patient or the doctor
        const reports = await Report.find({
            $or: [{ patientId: userId }, { doctorId: userId }]
        }).populate('patientId', 'name profilePictureUrl').populate('doctorId', 'name profilePictureUrl');

        res.json(reports);
    } catch (err) {
        next(err);
    }
});


// Get all messages for a specific report (conversation history)
router.get('/:reportId', auth, async (req, res, next) => {
    try {
        const messages = await Message.find({ reportId: req.params.reportId }).sort({ createdAt: 'asc' });
        res.json(messages);
    } catch (err) {
        next(err);
    }
});

// Send a new message
router.post('/:reportId', auth, async (req, res, next) => {
    try {
        const { content, receiverId, senderRole } = req.body;
        const newMessage = new Message({
            reportId: req.params.reportId,
            senderId: req.user.id,
            receiverId,
            senderRole,
            content,
        });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (err) {
        next(err);
    }
});

module.exports = router;

