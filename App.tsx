
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './views/Home';
import LessonGenerator from './views/LessonGenerator';
import QuickLessonGenerator from './views/QuickLessonGenerator';
import Playground from './views/Playground';
import LessonDetail from './views/LessonDetail';
import ClassroomView from './views/ClassroomView';
import ExamGenerator from './views/ExamGenerator';
import History from './views/History';
import Login from './views/Login';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('freedom_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setCheckedAuth(true);
  }, []);

  const handleLogin = (userData: User) => {
    localStorage.setItem('freedom_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('freedom_user');
    setUser(null);
  };

  if (!checkedAuth) return null;

  return (
    <Router>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Navigation Bar */}
          <nav className="bg-freedom-gray text-white py-4 px-6 shadow-md print:hidden">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Link to="/" className="flex items-center space-x-2 group">
                <span className="text-freedom-orange font-title text-2xl group-hover:scale-105 transition-transform">FREEDOM</span>
                <span className="text-white font-title text-2xl tracking-tighter">LPG</span>
              </Link>
              
              <div className="flex items-center space-x-6 text-xs font-bold uppercase tracking-widest">
                <span className="text-gray-400 hidden sm:inline">Hi, {user.name.split(' ')[0]}</span>
                <Link to="/history" className="hover:text-freedom-orange transition-colors">My Library</Link>
                <Link to="/playground" className="text-freedom-orange hover:text-white transition-colors">Playground</Link>
                <Link to="/exams" className="hover:text-freedom-orange transition-colors">Exams</Link>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-500 transition-colors">Logout</button>
              </div>
            </div>
          </nav>

          {/* Main Content Area */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/generate" element={<LessonGenerator />} />
              <Route path="/quick-generate" element={<QuickLessonGenerator />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/lesson/:id" element={<LessonDetail />} />
              <Route path="/classroom/:id" element={<ClassroomView />} />
              <Route path="/exams" element={<ExamGenerator />} />
              <Route path="/history" element={<History />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-white py-8 border-t border-gray-200 mt-12 print:hidden">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center opacity-50">
              <p className="text-sm font-bold">© {new Date().getFullYear()} Freedom English School</p>
              <div className="flex space-x-4 mt-4 md:mt-0 text-[10px] font-bold uppercase tracking-widest">
                <span>Teacher Empowerment</span>
                <span className="text-freedom-orange">Conversation First</span>
                <span>AI Driven Learning</span>
              </div>
            </div>
          </footer>
        </div>
      )}
    </Router>
  );
};

export default App;
