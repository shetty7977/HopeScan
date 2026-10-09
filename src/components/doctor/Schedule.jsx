import React from 'react';

// --- NEW HELPER: Status Badge ---
const AppointmentStatusBadge = ({ status }) => {
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';

    switch (status) {
        case 'Scheduled':
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-800';
            break;
        case 'Confirmed':
            bgColor = 'bg-green-100';
            textColor = 'text-green-800';
            break;
        case 'Declined': // Should not appear due to filter, but good to have
            bgColor = 'bg-red-100';
            textColor = 'text-red-800';
            break;
        default: // Pending or null
            bgColor = 'bg-gray-100';
            textColor = 'text-gray-800';
            status = 'Pending'; // Display 'Pending' for null/undefined
    }

    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
            {status}
        </span>
    );
};


const Schedule = ({ reports }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the beginning of today for accurate comparison

    // --- UPDATED FILTER LOGIC ---
    // Now filters based on date AND status
    const upcomingAppointments = reports
        .filter(report => {
            const appointmentDate = report.appointmentDate ? new Date(report.appointmentDate) : null;
            // Check if date is valid, in the future (or today), AND status is Scheduled or Confirmed
            return appointmentDate &&
                   !isNaN(appointmentDate.getTime()) && // Ensure valid date
                   appointmentDate >= today &&
                   (report.appointmentStatus === 'Scheduled' || report.appointmentStatus === 'Confirmed');
        })
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate)); // Sort by date

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-6 text-gray-700 border-b pb-3">Upcoming Schedule</h3>
            {upcomingAppointments.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                    {upcomingAppointments.map(report => (
                        <li key={report._id} className="py-5 flex flex-col sm:flex-row justify-between sm:items-center">
                            {/* Left Side: Patient Info */}
                            <div>
                                <p className="font-semibold text-lg text-gray-800">{report.patientName}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Follow-up regarding report from {new Date(report.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            {/* Right Side: Date, Time & Status */}
                            <div className="mt-3 sm:mt-0 sm:text-right flex flex-col items-start sm:items-end">
                                <p className="font-semibold text-blue-600 text-lg">
                                    {new Date(report.appointmentDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {new Date(report.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                {/* Display the status */}
                                <div className="mt-2">
                                     <AppointmentStatusBadge status={report.appointmentStatus} />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500 py-10 italic">
                    No upcoming appointments found matching the criteria (Scheduled or Confirmed).
                </p>
            )}
        </div>
    );
};

export default Schedule;
