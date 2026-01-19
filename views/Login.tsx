
import React, { useState } from 'react';
import FredGuide from '../components/FredGuide';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

type LoginMode = 'standard' | 'quick';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<LoginMode>('standard');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    username: '',
    keyword: ''
  });

  const getTeachers = (): any[] => {
    return JSON.parse(localStorage.getItem('freedom_teachers') || '[]');
  };

  const saveTeacher = (teacher: any) => {
    const teachers = getTeachers();
    teachers.push(teacher);
    localStorage.setItem('freedom_teachers', JSON.stringify(teachers));
  };

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Admin fast-track
    const isAdmin = formData.email.toLowerCase() === 'admin' && formData.password === 'f1';
    if (isAdmin) {
      onLogin({ name: 'Administrador', email: 'admin@freedom.com' });
      return;
    }

    const teachers = getTeachers();
    const existingTeacher = teachers.find(t => t.email.toLowerCase() === formData.email.toLowerCase());

    if (existingTeacher) {
      // Login attempt
      if (existingTeacher.password === formData.password) {
        onLogin({ name: existingTeacher.name, email: existingTeacher.email });
      } else {
        alert("Incorrect password for this email. Please try again.");
      }
    } else {
      // Registration attempt
      if (!formData.name || !formData.email || !formData.password) {
        alert("First time here? Please fill in all fields to create your teacher profile!");
        return;
      }
      
      const newTeacher = {
        name: formData.name,
        email: formData.email,
        password: formData.password
      };
      saveTeacher(newTeacher);
      onLogin({ name: newTeacher.name, email: newTeacher.email });
    }
  };

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.keyword === 'thebestteachers') {
      onLogin({
        name: formData.username.startsWith('@') ? formData.username : `@${formData.username}`,
        email: `${formData.username.replace('@', '')}@quick.freedom`
      });
    } else {
      alert("Invalid keyword! Try again or use the standard login.");
    }
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
          message={mode === 'quick' 
            ? "Quick access! Just enter your nickname and the secret keyword to enter the playground."
            : isEnteringAdmin 
              ? "Master access detected! Just enter the password 'f1' to manage the school's magic." 
              : "Welcome, Teacher! If it's your first time, fill in everything to register. Next time, just email and password!"} 
        />

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden transition-all duration-500">
          {isEnteringAdmin && mode === 'standard' && (
            <div className="absolute top-0 right-0 bg-freedom-orange text-white text-[8px] font-black px-4 py-1 uppercase tracking-widest rounded-bl-xl animate-pulse">
              Admin Mode
            </div>
          )}
          
          <div className="flex mb-8 bg-gray-100 p-1 rounded-2xl">
            <button 
              onClick={() => setMode('standard')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'standard' ? 'bg-white text-freedom-orange shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Standard
            </button>
            <button 
              onClick={() => setMode('quick')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'quick' ? 'bg-white text-freedom-orange shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Quick Login
            </button>
          </div>

          {mode === 'standard' ? (
            <form onSubmit={handleStandardLogin} className="space-y-4 animate-fadeIn">
              {!isEnteringAdmin && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Name (New Teachers Only)</label>
                  <input
                    type="text"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-freedom-orange focus:bg-white outline-none transition-all font-medium text-sm"
                    placeholder="E.g. Matheus Silva"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                <input
                  type="text"
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-freedom-orange focus:bg-white outline-none transition-all font-medium text-sm"
                  placeholder="teacher@freedom.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-freedom-orange focus:bg-white outline-none transition-all font-medium text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-freedom-gray text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2 mt-4"
              >
                <span>{isEnteringAdmin ? 'Access Admin' : 'Enter Dashboard'}</span>
                <span className="text-freedom-orange">→</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleQuickLogin} className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Teacher Username</label>
                <input
                  type="text"
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-freedom-orange focus:bg-white outline-none transition-all font-medium text-sm"
                  placeholder="@teachermatheus"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Keyword</label>
                <input
                  type="password"
                  required
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-freedom-orange focus:bg-white outline-none transition-all font-medium text-sm"
                  placeholder="The secret word..."
                  value={formData.keyword}
                  onChange={e => setFormData({...formData, keyword: e.target.value})}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-freedom-orange text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2 mt-4"
              >
                <span>Quick Access</span>
                <span className="text-white">⚡</span>
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-8 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Freedom English School
        </p>
      </div>
    </div>
  );
};

export default Login;
