import React, { useState, useEffect } from 'react';
import PatientReportCard from './PatientReportCard.jsx'; // The component with the correct color logic

// Icon for the delete button
const TrashIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Simple loading spinner
const Spinner = () => (
    <div className="text-center p-10">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading reports...</p>
    </div>
);

// Confirmation Modal Component
const ConfirmationModal = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto">
            <h3 className="text-lg font-semibold text-gray-900">Are you sure?</h3>
            <p className="mt-2 text-sm text-gray-600">
                This action is permanent and cannot be undone. All your reports and their associated images will be deleted.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
    </div>
);


const PatientReports = ({ user }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // For modal

    // This useEffect will run once when the component mounts
    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            setError(''); // Clear previous errors
            try {
                const token = localStorage.getItem('token');
                
                // --- THIS IS THE CORRECT URL ---
                // It gets the patient ID from the auth token on the backend.
                const response = await fetch('http://localhost:5001/api/reports/patient', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch reports.');
                }
                const data = await response.json();
                setReports(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []); // Empty dependency array means this runs once on mount

    // --- NEW FUNCTION ---
    // This runs when the user confirms deletion
    const handleDeleteAll = async () => {
        setError('');
        try {
            const token = localStorage.getItem('token');
            // This route matches the backend DELETE route
            const response = await fetch('http://localhost:5001/api/reports', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.msg || 'Failed to delete reports.');
            }
            
            setReports([]); // Clear reports from the UI
            setShowDeleteConfirm(false); // Close the modal
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return <Spinner />;
    }

    // Main component render
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Your Reports</h2>
                {/* --- NEW BUTTON --- */}
                {/* Only show the button if there are reports to delete */}
                {reports.length > 0 && (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                    >
                        <TrashIcon className="h-4 w-4" />
                        Delete All Reports
                    </button>
                )}
            </div>

            {/* Show error message if something went wrong */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                    <p>Error: {error}</p>
                </div>
            )}
            
            {/* Show reports or "no reports" message */}
            {reports.length > 0 ? (
                reports.map(report => (
                    <PatientReportCard key={report._id} report={report} />
                ))
            ) : (
                // Only show "no reports" if there isn't an error
                !error && (
                    <div className="bg-white text-center p-10 rounded-lg shadow-sm border">
                        <p className="text-gray-600">You have not submitted any reports yet.</p>
                    </div>
                )
            )}

            {/* --- NEW MODAL --- */}
            {/* This will pop up when showDeleteConfirm is true */}
            {showDeleteConfirm && (
                <ConfirmationModal 
                    onConfirm={handleDeleteAll}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}
        </div>
    );
};

export default PatientReports;

