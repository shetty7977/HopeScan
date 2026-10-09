import React, { useState } from 'react';

// A simple back arrow icon component
const BackArrowIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// Simple spinner for the analyze button
const AnalyzeSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// Shimmer effect component
const ShimmerEffect = () => (
    <>
        <style>
            {`
            @keyframes shimmer {
                0% { transform: translateX(-100%) skewX(-20deg); }
                100% { transform: translateX(200%) skewX(-20deg); }
            }
            .animate-shimmer {
                animation: shimmer 2s infinite linear;
            }
            `}
        </style>
        <div className="absolute inset-0 overflow-hidden rounded-lg">
            <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer">
            </div>
        </div>
    </>
);


const ScanView = ({ report, onBack, user }) => {
    // State
    const [analysisResult, setAnalysisResult] = useState(report.ml_result || null);
    // State for Grad-CAM
    const [gradCamUrl, setGradCamUrl] = useState(report.gradCamUrl || null);
    const [manualDiagnosis, setManualDiagnosis] = useState(report.result || '');
    const [notes, setNotes] = useState(report.notes || '');
    // Initialize date/time state based on report data if available
    const initialAppointmentDate = report.appointmentDate ? new Date(report.appointmentDate).toISOString().split('T')[0] : '';
    const initialAppointmentTime = report.appointmentDate ? new Date(report.appointmentDate).toTimeString().substring(0, 5) : '';
    const [appointmentDate, setAppointmentDate] = useState(initialAppointmentDate);
    const [appointmentTime, setAppointmentTime] = useState(initialAppointmentTime);
    const [loading, setLoading] = useState(false); // For saving
    const [isAnalyzing, setIsAnalyzing] = useState(false); // For analyzing
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const finalResult = manualDiagnosis || (analysisResult ? analysisResult.diagnosis : '');

    // Handle AI analysis
    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError('');
        setSuccess('');
        setAnalysisResult(null);
        setGradCamUrl(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5001/api/reports/${report._id}/analyze`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.msg || 'Analysis failed.');
            }
            const updatedReport = await response.json();

            if (updatedReport.ml_result && updatedReport.ml_result.diagnosis) {
                setAnalysisResult(updatedReport.ml_result);
                setManualDiagnosis(updatedReport.ml_result.diagnosis);
                setGradCamUrl(updatedReport.gradCamUrl || null);
            } else {
                setError('AI analysis returned an unexpected result.');
                setAnalysisResult(null);
                setGradCamUrl(null);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Handle saving the final report
    const handleSaveReport = async (e) => {
        e.preventDefault();
        if (!finalResult) {
            setError("Please provide a diagnosis before saving the report.");
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');

        let combinedDateTime = null;
        if (appointmentDate && appointmentTime) {
             try {
                combinedDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
                if (isNaN(combinedDateTime.getTime())) { throw new Error("Invalid date/time format"); }
            } catch (dateError) {
                 setError("Invalid date or time entered.");
                 setLoading(false);
                 return;
            }
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5001/api/reports/${report._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    status: 'Reviewed',
                    result: finalResult,
                    notes: notes,
                    appointmentDate: combinedDateTime,
                    ml_result: analysisResult,
                    gradCamUrl: gradCamUrl
                }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to save the report.');
            }
             const savedReport = await response.json();
            setSuccess('Report saved and updated successfully!');
            setAnalysisResult(savedReport.ml_result || null);
            setGradCamUrl(savedReport.gradCamUrl || null);
            setNotes(savedReport.notes || '');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="relative max-w-7xl mx-auto">
                <button onClick={onBack} className="flex items-center gap-2 mb-6 bg-white text-gray-800 hover:bg-gray-200 font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300 transform hover:-translate-x-1">
                    <BackArrowIcon className="h-5 w-5" />
                    Back to Dashboard
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Image and Grad-CAM */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xl">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">X-Ray Image for {report.patientName}</h2>
                        {/* Image Container */}
                        <div className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center p-2 relative mb-6">
                            <img
                                src={`http://localhost:5001${report.imageUrl}`}
                                alt="X-ray"
                                className="max-w-full max-h-[60vh] object-contain rounded-md" // Max height for main image
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/EBF4FF/76A9FA?text=Scan+Not+Available'; }}
                            />
                            {isAnalyzing && <ShimmerEffect />}
                        </div>

                        {/* Grad-CAM Display Area */}
                        {!isAnalyzing && gradCamUrl && (
                            <div className="mt-6">
                                <h3 className="text-xl font-semibold text-gray-800 mb-3">AI Focus Area (Grad-CAM)</h3>
                                {/* --- UPDATED IMAGE CONTAINER for Grad-CAM --- */}
                                <div className="w-full bg-gray-100 rounded-lg overflow-hidden border p-2 flex items-center justify-center">
                                     <img
                                        src={gradCamUrl}
                                        alt="Grad-CAM Visualization"
                                        // --- ADDED max-h-96 to limit height ---
                                        className="w-full h-auto object-contain rounded-md max-h-96" // Limit max height
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/FFF7E6/D97706?text=GradCAM+Error'; }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2 italic">
                                    This heatmap indicates the regions the AI focused on for its diagnosis.
                                </p>
                            </div>
                        )}

                    </div>

                    {/* Right Column: Analysis and Form */}
                    <div className="bg-white p-6 rounded-2xl shadow-xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Analysis & Report</h3>

                        <form onSubmit={handleSaveReport} className="space-y-6">
                            {/* Analyze Button */}
                            <button
                                type="button"
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || loading}
                                className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-400/50 disabled:bg-blue-300 disabled:shadow-none"
                            >
                                {isAnalyzing ? <><AnalyzeSpinner /> Analyzing...</> : 'Analyze with ML Model'}
                            </button>

                            {/* Analysis Result */}
                             {!isAnalyzing && analysisResult && (
                                <div className="p-4 bg-gray-100 rounded-lg text-left border">
                                    <p className="text-sm font-medium text-gray-600">ML Model Prediction:</p>
                                    <p className={`text-xl font-bold ${analysisResult.diagnosis === 'Malignant' ? 'text-red-600' : 'text-green-600'}`}>
                                        {analysisResult.diagnosis}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Confidence: <span className="font-medium">{analysisResult.confidence ? (parseFloat(analysisResult.confidence) * 100).toFixed(1) + '%' : 'N/A'}</span>
                                    </p>
                                </div>
                            )}
                             {isAnalyzing && error && <p className="text-sm text-red-500 text-center mt-2">{error}</p>}


                            {/* Manual Diagnosis */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Manual Diagnosis</label>
                                <div className="flex rounded-lg shadow-sm">
                                    <button type="button" onClick={() => setManualDiagnosis('Malignant')} className={`flex-1 px-4 py-2 text-sm rounded-l-lg transition-all duration-200 ${manualDiagnosis === 'Malignant' ? 'bg-red-600 text-white ring-2 ring-red-300' : 'bg-white text-gray-700 hover:bg-red-50 border'}`}>Malignant</button>
                                    <button type="button" onClick={() => setManualDiagnosis('Benign')} className={`flex-1 px-4 py-2 text-sm rounded-r-lg transition-all duration-200 ${manualDiagnosis === 'Benign' ? 'bg-green-600 text-white ring-2 ring-green-300' : 'bg-white text-gray-700 hover:bg-green-50 border'}`}>Benign</button>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Doctor's Notes</label>
                                <textarea
                                    id="notes"
                                    rows="4"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500"
                                    placeholder="Enter your observations..."
                                ></textarea>
                            </div>

                            <hr/>

                            {/* Appointment Scheduling */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-700 mb-2">Schedule Follow-up (Optional)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">Date</label>
                                        <input type="date" id="appointmentDate" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"/>
                                    </div>
                                    <div>
                                        <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700">Time</label>
                                        <input type="time" id="appointmentTime" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"/>
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                type="submit"
                                disabled={loading || isAnalyzing || !finalResult}
                                className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-green-400/50 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Saving...' : 'Save & Finalize Report'}
                            </button>

                             {!isAnalyzing && error && <p className="text-sm text-red-500 text-center mt-2">{error}</p>}
                            {success && <p className="text-sm text-green-500 text-center mt-2">{success}</p>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScanView;

