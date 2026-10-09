import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, [token]);

  const handleLogin = (userData, userToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {user && <Header user={user} onLogout={handleLogout} />}
      <main>
        {!user ? (
          <LoginPage onLogin={handleLogin} />
        ) : user.role === 'patient' ? (
          <PatientDashboard user={user} />
        ) : (
          <DoctorDashboard user={user} />
        )}
      </main>
    </div>
  );
}

export default App;

