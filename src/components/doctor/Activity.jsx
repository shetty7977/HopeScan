import React from 'react';

const Activity = ({ reports }) => {
    const recentActivity = [...reports]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 10); // Show the 10 most recently updated reports

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Recent Activity</h3>
            <ul className="divide-y divide-gray-200">
                {recentActivity.map(report => (
                    <li key={report._id} className="py-3">
                        <p className="text-sm text-gray-800">
                            Report for <span className="font-semibold">{report.patientName}</span> was {report.status === 'Reviewed' ? 'reviewed and finalized.' : 'assigned.'}
                        </p>
                        <p className="text-xs text-gray-400">
                            {new Date(report.updatedAt).toLocaleString()}
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Activity;
