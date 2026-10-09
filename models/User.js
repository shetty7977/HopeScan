const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor'], required: true },
  profilePictureUrl: { type: String, default: '/uploads/default-avatar.png' }, // New field
  clinicAddress: { type: String }, // New field for doctors
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

