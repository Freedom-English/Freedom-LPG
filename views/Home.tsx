
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UserStats, CEFRLevel, User } from '../types';
import FredGuide from '../components/FredGuide';

const Home: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [personalStats, setPersonalStats] = useState<UserStats>({
    totalLessons: 0,
    levelDistribution: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 },
    totalExams: 0
  });
  const [globalStats, setGlobalStats] = useState<UserStats>({
    totalLessons: 0,
    levelDistribution: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 },
    totalExams: 0
  });

  useEffect(() => {
    const savedUserStr = localStorage.getItem('freedom_user');
    const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
    setUser(savedUser);

    const savedPlans = JSON.parse(localStorage.getItem('freedom_plans') || '[]');
    const savedExams = JSON.parse(localStorage.getItem('freedom_exams') || '[]');
    
    // Global Stats Calculation
    const globalDist: Record<CEFRLevel, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
    savedPlans.forEach((p: any) => {
      if (globalDist[p.level as CEFRLevel] !== undefined) {
        globalDist[p.level as CEFRLevel]++;
      }
    });

    setGlobalStats({
      totalLessons: savedPlans.length,
      levelDistribution: globalDist,
      totalExams: savedExams.length
    });

    // Personal Stats Calculation
    if (savedUser) {
      const myPlans = savedPlans.filter((p: any) => p.authorName === savedUser.name);
      const personalDist: Record<CEFRLevel, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
      myPlans.forEach((p: any) => {
        if (personalDist[p.level as CEFRLevel] !== undefined) {
          personalDist[p.level as CEFRLevel]++;
        }
      });

      setPersonalStats({
        totalLessons: myPlans.length,
        levelDistribution: personalDist,
        totalExams: 0 
      });
    }
  }, []);

  const personalChartData = Object.entries(personalStats.levelDistribution).map(([name, value]) => ({ name, value }));
  const globalChartData = Object.entries(globalStats.levelDistribution).map(([name, value]) => ({ name, value }));
  
  const COLORS = ['#f7931e', '#222222', '#6b7280', '#9ca3af', '#d1d5db'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <FredGuide 
        message={`Bem-vindo de volta, Teacher ${user ? user.name.split(' ')[0] : ''}! Você é a ponte entre os sonhos e a realidade de seus alunos. Pronto para a mágica de hoje?`} 
      />

      {/* KPI Cards (Personal Focus) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-freedom-orange">
          <h3 className="text-freedom-gray font-bold text-xs uppercase tracking-widest mb-2">Your Total Lessons</h3>
          <p className="text-4xl font-black text-freedom-orange">{personalStats.totalLessons}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-freedom-gray">
          <h3 className="text-freedom-gray font-bold text-xs uppercase tracking-widest mb-2">Global Lessons</h3>
          <p className="text-4xl font-black text-freedom-gray">{globalStats.totalLessons}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-freedom-orange">
          <h3 className="text-freedom-gray font-bold text-xs uppercase tracking-widest mb-2">Exams Created</h3>
          <p className="text-4xl font-black text-freedom-gray">{globalStats.totalExams}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
        {/* Personal Dashboard */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-title text-xl text-freedom-gray uppercase tracking-tighter">My Performance</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sua distribuição de níveis CEFR</p>
            </div>
            <div className="bg-freedom-orange/10 text-freedom-orange px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Personal</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={personalChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f9f9f9'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {personalChartData.map((entry, index) => (
                    <Cell key={`cell-p-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Dashboard */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-title text-xl text-freedom-gray uppercase tracking-tighter">Community Impact</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Produção total de todos os Teachers</p>
            </div>
            <div className="bg-freedom-gray/10 text-freedom-gray px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Global</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={globalChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f9f9f9'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {globalChartData.map((entry, index) => (
                    <Cell key={`cell-g-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-10">
        <div className="flex flex-col justify-center space-y-4 max-w-2xl mx-auto w-full">
          {/* Admin Exclusive Access */}
          {user?.role === 'admin' && (
            <Link to="/admin" className="group bg-green-600 hover:bg-green-700 text-white p-8 rounded-[2.5rem] shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-between border-b-4 border-green-800">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Painel de Controle</h2>
                <p className="text-green-100 text-xs font-bold">Insights Globais e Gerenciamento</p>
              </div>
              <span className="text-4xl">📊</span>
            </Link>
          )}

          <Link to="/playground" className="group bg-freedom-orange hover:bg-orange-600 text-white p-8 rounded-[2.5rem] shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-between border-b-4 border-orange-700">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Playground</h2>
              <p className="text-orange-100 text-xs font-bold">Dinâmicas Criativas e Jogos</p>
            </div>
            <span className="text-4xl">🚀</span>
          </Link>

          <Link to="/quick-generate" className="group bg-freedom-gray hover:bg-black text-white p-8 rounded-[2.5rem] shadow-lg transition-all transform hover:-translate-y-1 flex items-center justify-between border-b-4 border-gray-900">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-freedom-orange">Quick Lesson</h2>
              <p className="text-gray-300 text-xs font-bold">Sessão de interação rápida</p>
            </div>
            <span className="text-4xl">⚡</span>
          </Link>
          
          <Link to="/history" className="flex items-center space-x-2 text-freedom-orange font-black text-xs uppercase tracking-[0.2em] hover:underline self-center pt-4 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Minha Biblioteca de Aulas</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
