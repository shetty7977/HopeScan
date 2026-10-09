import React, { useState, useRef } from 'react';
import { HopeScanLogo } from '../components/icons.jsx';

// --- Reusable Button Component for a consistent theme ---
const ThemedButton = ({ onClick, children, className = '', type = 'button', disabled = false }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:bg-blue-300 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

// --- Section 1: The Navigation Bar Component ---
const Navbar = ({ scrollToAbout, scrollToLogin, scrollToContact }) => (
    <nav className="bg-white/90 backdrop-blur-md shadow fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                    <HopeScanLogo className="h-8 w-auto text-blue-600" />
                    <h1 className="text-xl font-bold text-gray-800 ml-3 tracking-tight">HopeScan</h1>
                </div>
                <div className="hidden md:flex items-center space-x-2">
                    <button onClick={scrollToAbout} className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">About Us</button>
                    <button onClick={scrollToContact} className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Contact</button>
                    <ThemedButton onClick={scrollToLogin} className="py-2 px-4 text-sm">Login / Register</ThemedButton>
                </div>
            </div>
        </div>
    </nav>
);

// --- Section 2: The Login & Register Form Component ---
const LoginFormComponent = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('patient');
    const [clinicAddress, setClinicAddress] = useState('');
    const [profilePicture, setProfilePicture] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const endpoint = isLogin ? 'login' : 'register';
        const apiUrl = `http://localhost:5001/api/users/${endpoint}`;
        let response;
        try {
          if (isLogin) {
            response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
          } else {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('role', role);
            if (role === 'doctor') {
                if (clinicAddress) formData.append('clinicAddress', clinicAddress);
                if (profilePicture) formData.append('profilePicture', profilePicture);
            }
            response = await fetch(apiUrl, { method: 'POST', body: formData });
          }
          const data = await response.json();
          if (!response.ok) { throw new Error(data.message || 'An error occurred.'); }
          if (data.token && data.user) { onLogin(data.user, data.token); } 
          else { setError("An unexpected error occurred."); }
        } catch (err) { setError(err.message); } 
        finally { setLoading(false); }
    };

    return (
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 sm:p-12">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900">{isLogin ? 'Welcome Back!' : 'Create an Account'}</h2>
            </div>
            <div className="flex justify-center border border-gray-200 rounded-lg p-1 mb-6">
                <button onClick={() => setIsLogin(true)} className={`w-1/2 py-2 text-sm font-medium rounded-md transition-colors ${isLogin ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>Login</button>
                <button onClick={() => setIsLogin(false)} className={`w-1/2 py-2 text-sm font-medium rounded-md transition-colors ${!isLogin ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>Register</button>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
                {!isLogin && (
                    <>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">I am a:</label>
                            <div className="flex rounded-lg border border-gray-300">
                                <button type="button" onClick={() => setRole('patient')} className={`flex-1 px-4 py-2 text-sm rounded-l-md ${role === 'patient' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}>Patient</button>
                                <button type="button" onClick={() => setRole('doctor')} className={`flex-1 px-4 py-2 text-sm rounded-r-md ${role === 'doctor' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}>Doctor</button>
                            </div>
                        </div>
                        {role === 'doctor' && (
                            <>
                                <div className="pt-2">
                                    <label htmlFor="clinicAddress" className="block text-sm font-medium text-gray-700 mb-1">Clinic Address</label>
                                    <input id="clinicAddress" type="text" value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"/>
                                </div>
                                <div className="pt-2">
                                    <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                                    <input id="profilePicture" type="file" onChange={(e) => setProfilePicture(e.target.files[0])} className="w-full text-sm"/>
                                </div>
                            </>
                        )}
                    </>
                )}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                    <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"/>
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm"/>
                </div>
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <ThemedButton type="submit" disabled={loading} className="w-full">{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}</ThemedButton>
            </form>
        </div>
    );
};


// --- The Main Landing Page Component ---
const LandingPage = ({ onLogin }) => {
    const aboutRef = useRef(null);
    const loginRef = useRef(null);
    const contactRef = useRef(null);

    const scrollTo = (ref) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="bg-gray-50 font-sans">
            <Navbar 
                scrollToAbout={() => scrollTo(aboutRef)}
                scrollToLogin={() => scrollTo(loginRef)}
                scrollToContact={() => scrollTo(contactRef)}
            />

            {/* Section 1: Hero */}
            <section 
                className="h-screen flex items-center justify-center bg-cover bg-center text-white relative"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop')` }}
            >
                <div className="absolute inset-0 bg-blue-900 bg-opacity-70"></div>
                <div className="relative text-center p-4 z-10 animate-fade-in">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">HopeScan</h1>
                    <p className="mt-4 text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                        Pioneering early cancer detection through advanced technology, connecting patients with specialists for a healthier future.
                    </p>
                    <ThemedButton onClick={() => scrollTo(loginRef)} className="mt-8 text-lg">
                        Get Started
                    </ThemedButton>
                </div>
            </section>

            {/* Section 2: About Us */}
            <section ref={aboutRef} className="py-24 bg-white">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold text-gray-800 mb-6">About HopeScan</h2>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        HopeScan is a state-of-the-art platform designed to revolutionize the process of preliminary breast cancer diagnosis. We leverage the power of Artificial Intelligence to provide doctors with a powerful tool for analyzing mammogram images, enabling faster and more accessible screening. Our mission is to bridge the gap between patients and specialized medical care, making early detection a reality for everyone, everywhere. By creating a secure and intuitive teleconsultation environment, we empower patients to take control of their health and provide doctors with the tools they need to save lives.
                    </p>
                </div>
            </section>

            {/* Section 3: Login/Register */}
            <section ref={loginRef} className="py-24 bg-gray-100">
                <div className="flex items-center justify-center">
                    <LoginFormComponent onLogin={onLogin} />
                </div>
            </section>

            {/* Section 4: Footer / Contact */}
            <footer ref={contactRef} className="bg-gray-800 text-white py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Contact & Support</h2>
                    <p className="text-gray-400 mb-8">Have a question or a suggestion? We'd love to hear from you.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-8 text-left">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Admin Contact</h3>
                            <p className="text-gray-400">Email: admin@hopescan.com</p>
                            <p className="text-gray-400">Phone: +91 12345 67890</p>
                        </div>
                        <div className="md:col-span-2">
                             <h3 className="font-semibold text-lg mb-2">Reports & Suggestions</h3>
                             <form className="flex flex-col space-y-4">
                                <input type="email" placeholder="Your Email" className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <textarea rows="3" placeholder="Your message..." className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                                <ThemedButton type="submit">Submit</ThemedButton>
                             </form>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 pt-8 mt-8">
                        <p className="text-gray-500">&copy; 2025 HopeScan. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

