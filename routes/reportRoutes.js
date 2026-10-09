const express = require('express');
const multer = require('multer');
const path = require('path');
const Report = require('../models/Report');
// --- MAKE SURE THIS PATH IS CORRECT for your Message model ---
const Message = require('../models/Message'); // Adjust path if needed
const auth = require('../middleware/authMiddleware');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const router = express.Router();

// Multer setup
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// POST /api/reports/upload (For patient to upload)
router.post('/upload', auth, upload.single('xrayImage'), async (req, res, next) => {
    try {
        const { patientId, patientName, doctorId, doctorName } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'X-ray image is required.'});
        }
        const newReport = new Report({
            patientId, patientName, doctorId, doctorName,
            imageUrl: `/uploads/${req.file.filename}`,
            status: 'Pending',
            appointmentStatus: 'Pending',
        });
        await newReport.save();
        res.status(200).json(newReport);
    } catch (err) {
        next(err);
    }
});

// GET /api/reports/ (For logged-in DOCTOR)
router.get('/', auth, async (req, res, next) => {
    try {
        const reports = await Report.find({ doctorId: req.user.id }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) { next(err); }
});

// GET /api/reports/patient (For logged-in PATIENT)
router.get('/patient', auth, async (req, res, next) => {
    try {
        const reports = await Report.find({ patientId: req.user.id }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) { next(err); }
});


// PUT /api/reports/:reportId (For doctor to update/finalize)
router.put('/:reportId', auth, async (req, res, next) => {
    try {
        const { status, result, notes, appointmentDate, ml_result } = req.body;
        const updateFields = {
            status,
            result,
            notes,
            appointmentDate,
            ml_result, // Keep this line to allow saving ml_result if sent directly
            appointmentStatus: appointmentDate ? 'Scheduled' : 'Pending'
        };
        Object.keys(updateFields).forEach(key => updateFields[key] === undefined && delete updateFields[key]);

        const report = await Report.findByIdAndUpdate(
            req.params.reportId,
            { $set: updateFields },
            { new: true, runValidators: true }
        );
        if (!report) {
            return res.status(404).json({ message: 'Report not found.' });
        }
        res.json(report);
    } catch (err) { next(err); }
});

// PUT /api/reports/:reportId/appointment (For patient to confirm/decline)
router.put('/:reportId/appointment', auth, async (req, res, next) => {
    try {
        const { status, reason } = req.body; // Expecting 'Confirmed' or 'Declined', and optional 'reason'

        if (!['Confirmed', 'Declined'].includes(status)) {
            return res.status(400).json({ message: 'Invalid appointment status. Must be Confirmed or Declined.' });
        }
        if (status === 'Declined' && (!reason || reason.trim() === '')) {
            return res.status(400).json({ message: 'A reason is required when declining.' });
        }

        const report = await Report.findOne({
            _id: req.params.reportId,
            patientId: req.user.id // Ensure patient owns the report
        });

        if (!report) {
            return res.status(404).json({ message: 'Report not found or you do not have permission to update it.' });
        }
        if (report.appointmentStatus !== 'Scheduled') {
             return res.status(400).json({ message: 'Appointment cannot be updated as it is not currently scheduled.' });
        }

        let appointmentDateTime = report.appointmentDate;
        report.appointmentStatus = status;

        if (status === 'Declined') {
            report.appointmentDate = null;
        }

        await report.save();

        let messageContent = '';
        const formattedDate = new Date(appointmentDateTime).toLocaleString();

        if (status === 'Confirmed') {
            messageContent = `Appointment CONFIRMED by ${report.patientName} for ${formattedDate}. (Report ID: ${report._id})`;
        } else { // Declined
            messageContent = `Appointment DECLINED by ${report.patientName} for ${formattedDate}. Reason: "${reason}". (Report ID: ${report._id})`;
        }

        try {
            const newMessage = new Message({
                senderId: req.user.id, // Patient ID
                receiverId: report.doctorId, // Doctor ID
                content: messageContent,
                reportId: report._id, // Link message to the report
                senderRole: 'patient' // Explicitly set sender role based on your model
            });
            await newMessage.save();
            console.log(`Message saved for doctor ${report.doctorId}`);
            // TODO: Add real-time notification logic here (e.g., Socket.IO emit)
        } catch (msgError) {
            console.error("Failed to create/save message:", msgError);
        }

        res.json(report);
    } catch (err) {
        next(err);
    }
});


// --- UPDATED ROUTE ---
// POST /api/reports/:id/analyze (For doctor to trigger AI)
router.post('/:id/analyze', auth, async (req, res, next) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ msg: 'Report not found' });
        const imagePath = path.join(__dirname, '..', report.imageUrl);
        if (!fs.existsSync(imagePath)) return res.status(404).json({ msg: 'Report image file not found.' });

        const form = new FormData();
        // Use 'image' key as expected by the updated Python app.py
        form.append('image', fs.createReadStream(imagePath));
        let mlResponse;
        try {
            // Calling Python API on port 8000
            mlResponse = await axios.post('http://localhost:8000/predict', form, { headers: form.getHeaders() });
        } catch (mlError) {
            console.error("ML API Error:", mlError.response ? mlError.response.data : mlError.message);
            return res.status(500).json({ msg: 'ML analysis service failed.' });
        }

        // --- NEW: Destructure the expected response ---
        const { diagnosis, confidence, grad_cam } = mlResponse.data;

        // Basic validation of the response
        if (!diagnosis || confidence === undefined) {
             console.error("Invalid response structure from ML API:", mlResponse.data);
             return res.status(500).json({ msg: 'Received invalid response from ML service.' });
        }

        // --- UPDATE: Save the destructured data correctly ---
        report.ml_result = { diagnosis, confidence }; // Store diagnosis and confidence
        report.gradCamUrl = grad_cam || ''; // Store Grad-CAM URL (or empty string if null/undefined)

        if (report.status === 'Pending') {
            report.status = 'Reviewed';
        }

        await report.save();
        res.json(report); // Send updated report back to frontend

    } catch (err) {
        console.error("Error in /analyze route:", err);
        next(err);
    }
});
// --- END OF UPDATED ROUTE ---


// DELETE /api/reports (For logged-in patient to delete all their reports)
router.delete('/', auth, async (req, res, next) => {
    try {
        const patientId = req.user.id;
        const reports = await Report.find({ patientId: patientId });
        reports.forEach(report => {
            if (report.imageUrl) {
                const imagePath = path.join(__dirname, '..', report.imageUrl);
                if (fs.existsSync(imagePath)) {
                    fs.unlink(imagePath, (err) => { if (err) console.error(`Failed to delete image: ${imagePath}`, err); });
                }
            }
        });
        const deleteResult = await Report.deleteMany({ patientId: patientId });
        res.json({ msg: `Successfully deleted ${deleteResult.deletedCount} reports.` });
    } catch (err) { next(err); }
});


module.exports = router;

