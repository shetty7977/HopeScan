import React, { useState } from 'react';
import { UploadIcon } from '../icons.jsx';

const ConsultDoctor = ({ user, selectedDoctor, clearSelection }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image to upload.');
      return;
    }
    if (!selectedDoctor) {
      setError('An unexpected error occurred. No doctor is selected.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('xrayImage', file);
    formData.append('patientId', user._id);
    formData.append('patientName', user.name);
    formData.append('doctorId', selectedDoctor._id);
    formData.append('doctorName', selectedDoctor.name);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/reports/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Upload failed. Please try again.');
      }

      setSuccess(`Your X-ray has been submitted to Dr. ${selectedDoctor.name}. You will be notified upon review.`);
      setFile(null);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDoctor) {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Consult a Doctor</h2>
            <p className="text-gray-600">Please go to the "Find Doctors" tab to select a doctor before uploading your X-ray.</p>
        </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <div className="flex justify-between items-center">
                <p className="text-sm text-blue-800">
                    Your appointment is with: <span className="font-bold">Dr. {selectedDoctor.name}</span>
                </p>
                <button onClick={clearSelection} className="text-xs text-blue-600 hover:underline">Change Doctor</button>
            </div>
        </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Upload Your X-Ray for Dr. {selectedDoctor.name}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">X-Ray Image File</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {preview ? (
                <img src={preview} alt="X-ray Preview" className="mx-auto h-48 w-auto rounded-md" />
              ) : (
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
              )}
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>{file ? 'Change file' : 'Upload a file'}</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" />
                </label>
                <p className="pl-1">{file ? file.name : 'or drag and drop'}</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        {success && <p className="text-sm text-green-600 text-center">{success}</p>}

        <div>
          <button
            type="submit"
            disabled={loading || !file}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsultDoctor;

