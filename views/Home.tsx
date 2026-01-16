
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UserStats, CEFRLevel, User } from '../types';
import FredGuide from '../components/FredGuide';

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalLessons: 0,
    levelDistribution: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 },
    totalExams: 0
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('freedom_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedPlans = JSON.parse(localStorage.getItem('freedom_plans') || '[]');
    const savedExams = JSON.parse(localStorage.getItem('freedom_exams') || '[]');
    
    const dist: Record<CEFRLevel, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
    savedPlans.forEach((p: any) => {
      if (dist[p.level as CEFRLevel] !== undefined) {
        dist[p.level as CEFRLevel]++;
      }
    });

    setStats({
      totalLessons: savedPlans.length,
      levelDistribution: dist,
      totalExams: savedExams.length
    });
  }, []);

  const chartData = Object.entries(stats.levelDistribution).map(([name, value]) => ({ name, value }));
  const COLORS = ['#f7931e', '#222222', '#6b7280', '#9ca3af', '#d1d5db'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <FredGuide 
        message={`Welcome back, Teacher ${user ? user.name.split(' ')[0] : ''}! You are the bridge between dreams and reality for your students. Ready for today's magic?`} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-freedom-orange">
          <h3 className="text-freedom-gray font-bold text-xs uppercase tracking-widest mb-2">Total Lessons</h3>
          <p className="text-4xl font-black text-freedom-orange">{stats.totalLessons}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-freedom-gray">
          <h3 className="text-freedom-gray font-bold text-xs uppercase tracking-widest mb-2">Levels Mastery</h3>
          <p className="text-sm text-gray-500 italic">Most taught: {Object.entries(stats.levelDistribution).sort((a,b) => (b[1] as number) - (a[1] as number))[0][0]}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-freedom-orange">
          <h3 className="text-freedom-gray font-bold text-xs uppercase tracking-widest mb-2">Exams Created</h3>
          <p className="text-4xl font-black text-freedom-gray">{stats.totalExams}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h3 className="font-title text-xl mb-6 text-freedom-gray uppercase tracking-tighter">Teaching Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f9f9f9'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col justify-center space-y-4">
          <Link to="/playground" className="group bg-freedom-orange hover:bg-orange-600 text-white p-8 rounded-[2rem] shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-between border-b-4 border-orange-700">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Playground</h2>
              <p className="text-orange-100 text-xs font-bold">Creative Dynamics & Games</p>
            </div>
            <span className="text-4xl">🚀</span>
          </Link>

          <Link to="/quick-generate" className="group bg-freedom-gray hover:bg-black text-white p-8 rounded-[2rem] shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-between border-b-4 border-gray-900">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-freedom-orange">Quick Lesson</h2>
              <p className="text-gray-300 text-xs font-bold">Fast interaction session</p>
            </div>
            <span className="text-4xl">⚡</span>
          </Link>

          <Link to="/exams" className="group bg-white border-2 border-freedom-gray text-freedom-gray p-8 rounded-[2rem] shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-between border-b-4 border-gray-200">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Generate Exams</h2>
              <p className="text-gray-400 text-xs font-bold">Evaluate student growth</p>
            </div>
            <span className="text-4xl">📝</span>
          </Link>
          
          <Link to="/history" className="flex items-center space-x-2 text-freedom-orange font-black text-xs uppercase tracking-[0.2em] hover:underline self-center pt-4 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>My Lesson Library</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
