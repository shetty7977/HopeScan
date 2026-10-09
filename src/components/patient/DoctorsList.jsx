import React, { useState, useEffect } from 'react';

const DoctorsList = ({ onDoctorSelect }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/users/doctors', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch doctors list.');
        const data = await response.json();
        setDoctors(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Available Doctors</h2>
      <p className="text-gray-600 mb-6">Please select a doctor to book an appointment and upload your X-ray.</p>
      
      {loading && <p className="text-center py-4">Loading doctors...</p>}
      {error && <p className="text-center py-4 text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {doctors.map(doctor => (
            <div key={doctor._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-4">
                <img 
                  src={`http://localhost:5001${doctor.profilePictureUrl}`} 
                  alt={`Dr. ${doctor.name}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                  // Add a fallback for broken images
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/64x64/EBF4FF/76A9FA?text=Dr'; }}
                />
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">Dr. {doctor.name}</h3>
                  <p className="text-sm text-gray-500">{doctor.clinicAddress || 'Address not available'}</p>
                </div>
              </div>
              <button 
                onClick={() => onDoctorSelect(doctor)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Select
              </button>
            </div>
          ))}
          {doctors.length === 0 && <p className="text-center py-4">No doctors are currently registered.</p>}
        </div>
      )}
    </div>
  );
};

export default DoctorsList;

