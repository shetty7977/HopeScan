import React, { useState, useEffect } from 'react';
import ScanView from '../components/doctor/ScanView.jsx';
import ProfileSettings from '../components/doctor/ProfileSettings.jsx';
import Schedule from '../components/doctor/Schedule.jsx';
import Activity from '../components/doctor/Activity.jsx';
import Messages from '../components/doctor/Messages.jsx';
import DynamicGreeting from '../components/doctor/DynamicGreeting.jsx'; 
import { DashboardIcon, ScheduleIcon, MessageIcon, ActivityIcon, SettingsIcon, LogoutIcon } from '../components/icons.jsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const DoctorDashboard = ({ user, onLogout, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/reports', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch reports.');
        const data = await response.json();
        setReports(data);
        setFilteredReports(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [user._id]);

  useEffect(() => {
    const results = reports.filter((report) =>
      report.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredReports(results);
  }, [searchTerm, reports]);

  if (selectedReport) {
    return <ScanView report={selectedReport} onBack={() => setSelectedReport(null)} user={user} />;
  }

  const reviewedCount = reports.filter((r) => r.status === 'Reviewed').length;
  const pendingCount = reports.length - reviewedCount;
  const chartData = [
    { name: 'Pending', value: pendingCount },
    { name: 'Reviewed', value: reviewedCount },
  ];
  const COLORS = ['#FFBB28', '#00C49F'];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">
                Pending Patient Reports
              </h3>
              <table className="min-w-full">
                <thead className="border-b-2">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Patient
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">
                      Date Submitted
                    </th>
                    <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading && (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        Loading reports...
                      </td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-red-500">
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filteredReports.map((report) => (
                      <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 font-medium text-gray-800">
                          {report.patientName}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`py-1 px-3 rounded-full text-xs font-semibold ${
                              report.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="bg-blue-500 text-white py-1 px-4 rounded-lg text-sm hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  {!loading && filteredReports.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-500">
                        No reports found for you.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Report Summary</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      case 'schedule':
        return <Schedule reports={reports} />;
      case 'activity':
        return <Activity reports={reports} />;
      case 'messages':
        return <Messages user={user} />;
      default:
        return <div>Select a tab</div>;
    }
  };

  const NavButton = ({ icon: Icon, label, tabName, onClick }) => (
    <button
      onClick={onClick || (() => setActiveTab(tabName))}
      className={`flex items-center w-full px-4 py-2 text-left rounded-lg transition-colors ${
        activeTab === tabName
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="h-5 w-5 mr-3" /> {label}
    </button>
  );

  return (
    <>
      <div className="flex h-screen bg-gray-50 font-sans">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg flex flex-col">
          <div className="p-6 text-center border-b">
            <img
              src={`http://localhost:5001${user.profilePictureUrl}`}
              alt="Doctor profile"
              className="w-24 h-24 rounded-full mx-auto mb-2 border-4 border-blue-200 object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/96x96/EBF4FF/76A9FA?text=Dr';
              }}
            />
            <h2 className="text-lg font-semibold text-gray-800">Dr. {user.name}</h2>
            <p className="text-sm text-gray-500">
              {user.clinicAddress || 'Clinic Address Not Set'}
            </p>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavButton icon={DashboardIcon} label="Dashboard" tabName="dashboard" />
            <NavButton icon={ScheduleIcon} label="Schedule" tabName="schedule" />
            <NavButton icon={MessageIcon} label="Messages" tabName="messages" />
            <NavButton icon={ActivityIcon} label="Activity" tabName="activity" />
            <NavButton icon={SettingsIcon} label="Settings" onClick={() => setShowSettings(true)} />
          </nav>

          <div className="px-4 py-6 border-t">
            <NavButton icon={LogoutIcon} label="Logout" onClick={onLogout} />
          </div>
        </aside>

        {}
        <main className="flex-1 p-8 overflow-y-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              {}
              <DynamicGreeting name={`Dr. ${user.name.split(' ')[0]}`} />
              <p className="text-gray-500">
                You have{' '}
                <span className="font-bold text-blue-600">{pendingCount}</span> new reports to
                review today.
              </p>
            </div>

            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </header>

          {renderContent()}
        </main>
      </div>

      {showSettings && (
        <ProfileSettings
          user={user}
          onClose={() => setShowSettings(false)}
          onProfileUpdate={onProfileUpdate}
        />
      )}
    </>
  );
};

export default DoctorDashboard;
