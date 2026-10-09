import React, { useState } from 'react';
import ConsultDoctor from '../components/patient/ConsultDoctor.jsx';
// This is the component that has your new delete button
import PatientReports from '../components/patient/PatientReports.jsx'; 
import DoctorsList from '../components/patient/DoctorsList.jsx';

const PatientDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('reports');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setActiveTab('consult');
  };
  
  const clearDoctorSelection = () => {
    setSelectedDoctor(null);
    setActiveTab('doctors');
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'consult':
        return <ConsultDoctor user={user} selectedDoctor={selectedDoctor} clearSelection={clearDoctorSelection} />;
      case 'reports':
        // This renders the component that has your delete button
        return <PatientReports user={user} />;
      case 'doctors':
        return <DoctorsList onDoctorSelect={handleDoctorSelect} />;
      default:
        return <PatientReports user={user} />;
    }
  };

  const TabButton = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
        activeTab === tabName 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="mt-1 text-md text-gray-600">Welcome back, <span className="font-semibold text-blue-600">{user.name}</span>!</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <TabButton tabName="reports" label="My Reports" />
            <TabButton tabName="doctors" label="Find Doctors" />
            <TabButton tabName="consult" label="Consult a Doctor" />
        </div>
      </div>
      
      <div className="mt-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default PatientDashboard;

