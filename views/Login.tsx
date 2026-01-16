
import React, { useState } from 'react';
import FredGuide from '../components/FredGuide';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Admin fast-track login
    const isAdmin = formData.email.toLowerCase() === 'admin' && formData.password === 'f1';
    
    if (isAdmin) {
      onLogin({
        name: 'Administrador',
        email: 'admin@freedom.com'
      });
      return;
    }

    // Standard teacher validation
    if (!formData.name || !formData.email || !formData.password) {
      alert("Fred needs all fields to let you in! (Unless you are the Admin)");
      return;
    }
    
    onLogin({
      name: formData.name,
      email: formData.email
    });
  };

  const isEnteringAdmin = formData.email.toLowerCase() === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-freedom-gray tracking-tighter">
            FREEDOM<span className="text-freedom-orange">LPG</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em] mt-2">Teacher's Portal</p>
        </div>

        <FredGuide 
          message={isEnteringAdmin 
            ? "Master access detected! Just enter the password 'f1' to manage the school's magic." 
            : "Welcome, Teacher! Please identify yourself so we can start creating some magic together!"} 
        />

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
          {isEnteringAdmin && (
            <div className="absolute top-0 right-0 bg-freedom-orange text-white text-[8px] font-black px-4 py-1 uppercase tracking-widest rounded-bl-xl animate-pulse">
              Admin Mode
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            {!isEnteringAdmin && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Your Full Name</label>
                <input
                  type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-freedom-orange focus:bg-white outline-none transition-all font-medium"
                  placeholder="Teacher's name"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email or Username</label>
              <input
                type="text"
                required
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-freedom-orange focus:bg-white outline-none transition-all font-medium"
                placeholder="email@freedom.com or 'admin'"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input
                type="password"
                required
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-freedom-orange focus:bg-white outline-none transition-all font-medium"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-freedom-gray text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>{isEnteringAdmin ? 'Access Admin Panel' : 'Login to Dashboard'}</span>
              <span className="text-freedom-orange">→</span>
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Freedom English School
        </p>
      </div>
    </div>
  );
};

export default Login;
