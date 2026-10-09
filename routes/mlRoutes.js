const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Predict endpoint
router.post('/predict', auth, (req, res, next) => { // Added 'next' for proper error handling
    const { imageUrl } = req.body;

    if (!imageUrl) {
        return res.status(400).json({ message: 'Image URL is required.' });
    }

    // Construct the absolute path to the image file on the server
    const imagePath = path.join(__dirname, '..', imageUrl);

    // Check if the file actually exists before trying to run the script
    if (!fs.existsSync(imagePath)) {
        console.error(`ML Predict Error: File not found at ${imagePath}`);
        return res.status(404).json({ message: `Image file not found on the server.` });
    }

    // Define the path to your Python executable and script
    const pythonExecutable = 'python'; // or 'python3' on some systems
    const pythonScriptPath = path.join(__dirname, '..', '..', 'ml_model', 'predict_model.py');

    // Spawn a Python process to run the ML model
    const pythonProcess = spawn(pythonExecutable, [pythonScriptPath, imagePath]);

    let predictionData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
        predictionData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            // If the script exits with an error, pass a detailed error to our global handler
            console.error(`Python script exited with code ${code}`);
            console.error(`Stderr from Python script: ${errorData}`);
            const error = new Error(`ML model script failed: ${errorData}`);
            return next(error);
        }

        try {
            // If the script succeeds, parse its JSON output
            const result = JSON.parse(predictionData);
            res.json(result);
        } catch (e) {
            // If parsing fails, it means the Python script gave an invalid response
            console.error('Failed to parse prediction result from Python script.');
            console.error('Python stdout:', predictionData);
            const error = new Error('Invalid response from ML model.');
            return next(error);
        }
    });

    // This catches errors like 'python' command not found
    pythonProcess.on('error', (err) => {
        console.error('Failed to start Python subprocess.', err);
        const error = new Error('Could not execute the ML model script.');
        return next(error);
    });
});

module.exports = router;

