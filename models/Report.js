const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    patientName: {
        type: String,
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    doctorName: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        // Simplified enum - appointment status is handled separately
        enum: ['Pending', 'Reviewed'],
        default: 'Pending',
    },
    result: {
        type: String, // Doctor's final diagnosis
        // Optional: Add enum for consistency
        enum: ['Malignant', 'Benign', ''],
        default: ''
    },
    ml_result: {
        type: Object, // Stores AI result { diagnosis: '...', confidence: '...' }
    },
    // Added based on previous steps for Grad-CAM integration
    gradCamUrl: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    appointmentDate: {
        type: Date,
    },
    appointmentStatus: {
        type: String,
        enum: ['Pending', 'Scheduled', 'Confirmed', 'Declined'], // Ensure all needed statuses are here
        // Changed default to 'Pending' for consistency
        default: 'Pending',
    }
}, { timestamps: true });

// Correct export - this fixes the 'Report.find is not a function' error
// Using mongoose.models check prevents OverwriteModelError in Next.js/hot-reloading environments
module.exports = mongoose.models.Report || mongoose.model('Report', ReportSchema);

