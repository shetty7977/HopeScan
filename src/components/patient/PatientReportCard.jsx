import React, { useState } from 'react';

// Icons (assuming these are defined elsewhere or paste them here)
const ExternalLinkIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);
const CheckIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);
const XIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const PatientReportCard = ({ report }) => {

    const [appointmentStatus, setAppointmentStatus] = useState(report.appointmentStatus);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState('');
    // --- NEW State for Decline Reason ---
    const [showDeclineReason, setShowDeclineReason] = useState(false);
    const [declineReason, setDeclineReason] = useState('');

    const isMalignant = report.result === 'Malignant';
    const resultColorClass = isMalignant ? 'text-red-600' : 'text-green-600';

    const formatAppointment = () => {
        if (!report.appointmentDate) return null;
        try {
            const date = new Date(report.appointmentDate);
            if (isNaN(date.getTime())) return 'Invalid date';
            return date.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
        } catch (error) {
            console.error("Error formatting date:", error);
            return 'Invalid date';
        }
    };

    const formattedAppointment = formatAppointment();
    const canRespondToAppointment = formattedAppointment && formattedAppointment !== 'Invalid date' && appointmentStatus === 'Scheduled';

    // --- UPDATED Function to handle Accept/Decline ---
    const handleAppointmentUpdate = async (newStatus) => {
        // If declining, just show the reason input first
        if (newStatus === 'Declined' && !showDeclineReason) {
            setShowDeclineReason(true);
            return; // Don't call API yet
        }

        // Validate reason if declining
        if (newStatus === 'Declined' && (!declineReason || declineReason.trim() === '')) {
             setUpdateError('Please enter a reason for declining.');
             return;
        }

        setIsUpdating(true);
        setUpdateError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5001/api/reports/${report._id}/appointment`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                // Send reason only if declining
                body: JSON.stringify({
                    status: newStatus,
                    reason: newStatus === 'Declined' ? declineReason : undefined
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || `Failed to ${newStatus.toLowerCase()} appointment.`);
            }

            const updatedReport = await response.json();
            setAppointmentStatus(updatedReport.appointmentStatus); // Update local state
            setShowDeclineReason(false); // Hide reason input on success

        } catch (err) {
            setUpdateError(err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    // Function to cancel decline
    const cancelDecline = () => {
        setShowDeclineReason(false);
        setDeclineReason('');
        setUpdateError('');
    };


    return (
        <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden">
            {/* Header Section */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-600">
                        Submitted for <span className="font-semibold">{report.doctorName}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                        On: {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                </div>
                {report.imageUrl && (
                     <a href={`http://localhost:5001${report.imageUrl}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                        View Submitted Image <ExternalLinkIcon className="h-3 w-3" />
                    </a>
                )}
            </div>

            {/* Diagnosis Section */}
            <div className="p-6">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Doctor's Diagnosis</p>
                {report.status === 'Pending' ? (
                    <p className="text-lg text-gray-500 italic mt-1">Awaiting review...</p>
                ) : (
                    <p className={`text-3xl font-bold mt-1 ${resultColorClass}`}>
                        {report.result || 'No diagnosis provided.'}
                    </p>
                )}
            </div>

            {/* Notes Section */}
            {report.status === 'Reviewed' && (
                <div className="px-6 pb-6">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Notes from {report.doctorName}:</p>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
                        <p className="text-gray-700 whitespace-pre-wrap">
                            {report.notes || 'No additional notes.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Appointment Section */}
            {formattedAppointment && formattedAppointment !== 'Invalid date' && (
                <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                         <div>
                            <p className="text-sm font-semibold text-blue-800">Follow-up Appointment:</p>
                            <p className="text-md font-medium text-blue-900">{formattedAppointment}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            appointmentStatus === 'Confirmed' ? 'bg-green-100 text-green-800' :
                            appointmentStatus === 'Declined' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                            {appointmentStatus || 'Scheduled'}
                        </span>
                    </div>

                    {/* --- UPDATED Buttons & Decline Reason Section --- */}
                    {canRespondToAppointment && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                            {/* Show reason input if user clicked decline */}
                            {showDeclineReason ? (
                                <div className="space-y-3">
                                    <label htmlFor={`declineReason-${report._id}`} className="block text-sm font-medium text-gray-700">
                                        Please provide a reason for declining:
                                    </label>
                                    <textarea
                                        id={`declineReason-${report._id}`}
                                        rows="3"
                                        value={declineReason}
                                        onChange={(e) => setDeclineReason(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="E.g., Cannot make this time, need to reschedule..."
                                    ></textarea>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => handleAppointmentUpdate('Declined')} // Submit with reason
                                            disabled={isUpdating}
                                            className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                                        >
                                            Submit Decline
                                        </button>
                                        <button
                                            onClick={cancelDecline} // Cancel button
                                            disabled={isUpdating}
                                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Show Accept/Decline buttons initially
                                <>
                                    <p className="text-sm text-gray-700 mb-2">Confirm or decline this appointment:</p>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => handleAppointmentUpdate('Confirmed')}
                                            disabled={isUpdating}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                                        >
                                            <CheckIcon className="h-4 w-4" /> Accept
                                        </button>
                                        <button
                                            onClick={() => handleAppointmentUpdate('Declined')} // Initially just shows the reason input
                                            disabled={isUpdating}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                                        >
                                            <XIcon className="h-4 w-4" /> Decline
                                        </button>
                                    </div>
                                </>
                            )}
                            {isUpdating && <p className="text-xs text-gray-500 mt-2 text-center">Updating...</p>}
                            {updateError && <p className="text-xs text-red-500 mt-2 text-center">Error: {updateError}</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PatientReportCard;

