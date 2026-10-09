import React, { useState } from 'react';

const ProfileSettings = ({ user, onClose, onProfileUpdate }) => {
  const [clinicAddress, setClinicAddress] = useState(user.clinicAddress || '');
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('clinicAddress', clinicAddress);
    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }
      
      setSuccess(data.message);
      onProfileUpdate(data.user); // This updates the user state in the main App component

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // This creates the modal overlay effect
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-4">
            <img 
                src={preview || `http://localhost:5001${user.profilePictureUrl}`}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/96x96/EBF4FF/76A9FA?text=Dr'; }}
            />
            <div>
                <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">Update Profile Picture</label>
                <input id="profilePicture" type="file" onChange={handleFileChange} accept="image/png, image/jpeg" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
          </div>

          <div>
            <label htmlFor="clinicAddress" className="block text-sm font-medium text-gray-700">Clinic Address</label>
            <input id="clinicAddress" type="text" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"/>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {success && <p className="text-sm text-green-500 text-center">{success}</p>}

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;

