const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// --- Multer Setup for Profile Picture Uploads ---
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage: storage });
// --- End Multer Setup ---

// Register a new user (No changes here)
router.post('/register', upload.single('profilePicture'), async (req, res, next) => {
    // ... existing registration code ...
    const { name, email, password, role, clinicAddress } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            if (req.file) { fs.unlinkSync(req.file.path); }
            return res.status(400).json({ message: 'User already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUserPayload = { name, email, password: hashedPassword, role };
        if (role === 'doctor') {
            if (req.file) { newUserPayload.profilePictureUrl = `/uploads/${req.file.filename}`; }
            if (clinicAddress) { newUserPayload.clinicAddress = clinicAddress; }
        }
        user = new User(newUserPayload);
        await user.save();
        const payload = { user: { id: user.id, name: user.name, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            const { password, ...userData } = user._doc;
            res.status(201).json({ token, user: userData });
        });
    } catch (err) {
        if (req.file) { fs.unlinkSync(req.file.path); }
        next(err);
    }
});

// Login user (No changes here)
router.post('/login', async (req, res, next) => {
    // ... existing login code ...
    const { email, password: inputPassword } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) { return res.status(400).json({ message: 'Invalid Credentials' }); }
        const isMatch = await bcrypt.compare(inputPassword, user.password);
        if (!isMatch) { return res.status(400).json({ message: 'Invalid Credentials' }); }
        const payload = { user: { id: user.id, name: user.name, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            const { password, ...userData } = user._doc;
            res.json({ token, user: userData });
        });
    } catch (err) { next(err); }
});

// Get all doctors (No changes here)
router.get('/doctors', auth, async (req, res, next) => {
    // ... existing get doctors code ...
    try {
        const doctors = await User.find({ role: 'doctor' }).select('-password');
        res.json(doctors);
    } catch (err) { next(err); }
});

// --- NEW ROUTE: UPDATE DOCTOR PROFILE ---
router.put('/profile', auth, upload.single('profilePicture'), async (req, res, next) => {
    const { clinicAddress } = req.body;
    const userId = req.user.id; // Get user ID from the authentication token

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateFields = {};
        if (clinicAddress) {
            updateFields.clinicAddress = clinicAddress;
        }
        if (req.file) {
            // If there's a new file, delete the old one (unless it's the default)
            if (user.profilePictureUrl && user.profilePictureUrl !== '/uploads/default-avatar.png') {
                const oldPath = path.join(__dirname, '..', user.profilePictureUrl);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            updateFields.profilePictureUrl = `/uploads/${req.file.filename}`;
        }
        
        const updatedUser = await User.findByIdAndUpdate(userId, { $set: updateFields }, { new: true }).select('-password');
        
        res.json({ message: 'Profile updated successfully', user: updatedUser });

    } catch (err) {
        // If an error occurs after file upload, delete the orphaned file
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        next(err);
    }
});


module.exports = router;

