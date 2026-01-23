
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';
import { LessonPlan, CEFRLevel } from '../types';
import FredGuide from '../components/FredGuide';

interface TeacherRecord {
  name: string;
  email: string;
  password?: string;
  needsPasswordReset?: boolean;
}

interface RankingItem {
  name: string;
  count: number;
  percentage: number;
}

const AdminDashboard: React.FC = () => {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [selectedTeacherName, setSelectedTeacherName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'teachers' | 'content'>('stats');
  
  // User Management State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: 'freedom1234' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedPlans = JSON.parse(localStorage.getItem('freedom_plans') || '[]');
    const savedTeachers = JSON.parse(localStorage.getItem('freedom_teachers') || '[]');
    setPlans(savedPlans);
    setTeachers(savedTeachers);
  };

  const handleDeleteTeacher = (email: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja remover este professor? O acesso será revogado permanentemente.')) {
      const updated = teachers.filter(t => t.email.toLowerCase() !== email.toLowerCase());
      setTeachers(updated);
      localStorage.setItem('freedom_teachers', JSON.stringify(updated));
    }
  };

  const handleDeletePlan = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Excluir permanentemente esta aula do Banco Global?')) {
      const updated = plans.filter(p => p.id !== id);
      setPlans(updated);
      localStorage.setItem('freedom_plans', JSON.stringify(updated));
    }
  };

  const handleResetPassword = (email: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const teacher = teachers.find(t => t.email.toLowerCase() === email.toLowerCase());
    if (!teacher) return;

    const newPass = window.prompt(`Digite a nova senha para o professor ${teacher.name}:`, 'freedom1234');
    
    if (newPass !== null && newPass.trim() !== "") {
      const updated = teachers.map(t => 
        t.email.toLowerCase() === email.toLowerCase() 
          ? { ...t, password: newPass.trim(), needsPasswordReset: false } 
          : t
      );
      setTeachers(updated);
      localStorage.setItem('freedom_teachers', JSON.stringify(updated));
      alert(`Senha de ${teacher.name} redefinida com sucesso!`);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return;
    
    const emailLower = newUser.email.toLowerCase().trim();
    if (teachers.some(t => t.email.toLowerCase() === emailLower)) {
      alert("Este e-mail já está cadastrado.");
      return;
    }

    const teacherToAdd = { 
      ...newUser, 
      email: emailLower,
      password: newUser.password.trim(),
      needsPasswordReset: true 
    };

    const updated = [...teachers, teacherToAdd];
    setTeachers(updated);
    localStorage.setItem('freedom_teachers', JSON.stringify(updated));

    setNewUser({ name: '', email: '', password: 'freedom1234' });
    setShowCreateModal(false);
  };

  const getRankingData = (): RankingItem[] => {
    const counts: Record<string, number> = {};
    plans.forEach(p => {
      const name = p.authorName || 'Teacher';
      counts[name] = (counts[name] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const max = sorted[0]?.count || 1;
    return sorted.map(item => ({
      ...item,
      percentage: (item.count / max) * 100
    }));
  };

  const ranking = getRankingData();

  const filteredPlans = selectedTeacherName 
    ? plans.filter(p => p.authorName === selectedTeacherName)
    : plans;

  const stats = {
    totalLessons: filteredPlans.length,
    totalQuick: filteredPlans.filter((p: LessonPlan) => p.isQuickLesson).length,
    totalStandard: filteredPlans.filter((p: LessonPlan) => !p.isQuickLesson).length,
    activeTeachers: selectedTeacherName ? 1 : new Set(plans.map(p => p.authorName)).size,
  };

  const levelData = (['A1', 'A2', 'B1', 'B2', 'C1'] as CEFRLevel[]).map(level => ({
    name: level,
    value: filteredPlans.filter(p => p.level === level).length
  }));

  const COLORS = ['#f7931e', '#222222', '#6b7280', '#9ca3af', '#d1d5db'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 pb-20">
      <FredGuide message="Olá, Admin! O painel de controle está totalmente operacional. Use as abas abaixo para gerenciar sua equipe e o conteúdo acadêmico da Freedom." />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-freedom-gray tracking-tighter uppercase">
            {selectedTeacherName ? <>Insights: <span className="text-freedom-orange">{selectedTeacherName}</span></> : <>Freedom <span className="text-freedom-orange">Insights</span></>}
          </h1>
          <div className="flex mt-4 space-x-2">
            <button type="button" onClick={() => {setActiveTab('stats'); setSelectedTeacherName(null);}} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-freedom-orange text-white' : 'bg-gray-100 text-gray-400'}`}>Dashboard</button>
            <button type="button" onClick={() => setActiveTab('teachers')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'teachers' ? 'bg-freedom-orange text-white' : 'bg-gray-100 text-gray-400'}`}>Teachers</button>
            <button type="button" onClick={() => setActiveTab('content')} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'content' ? 'bg-freedom-orange text-white' : 'bg-gray-100 text-gray-400'}`}>Banco Global</button>
          </div>
        </div>
        <div className="flex gap-4">
          <button type="button" onClick={() => setShowCreateModal(true)} className="bg-freedom-orange text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:brightness-110 transition-all border-b-4 border-orange-700 active:translate-y-0.5 active:border-b-0">+ Novo Professor</button>
        </div>
      </div>

      {activeTab === 'stats' && (
        <div className="animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-7 rounded-[2rem] shadow-sm border-t-8 border-freedom-orange">
              <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-2">Total de Aulas</h3>
              <p className="text-5xl font-black text-freedom-gray">{stats.totalLessons}</p>
            </div>
            <div className="bg-white p-7 rounded-[2rem] shadow-sm border-t-8 border-freedom-gray">
              <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-2">Teachers Ativos</h3>
              <p className="text-5xl font-black text-freedom-gray">{stats.activeTeachers}</p>
            </div>
            <div className="bg-white p-7 rounded-[2rem] shadow-sm border-t-8 border-freedom-orange">
              <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-2">Modo Quick</h3>
              <p className="text-5xl font-black text-freedom-gray">{stats.totalQuick}</p>
            </div>
            <div className="bg-white p-7 rounded-[2rem] shadow-sm border-t-8 border-freedom-gray">
              <h3 className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-2">Engajamento</h3>
              <p className="text-5xl font-black text-freedom-gray">98%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col">
              <div className="mb-8">
                <h3 className="text-xl font-black text-freedom-gray uppercase tracking-tighter">Teacher Leaderboard</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Top contribuidores do banco global</p>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
                {ranking.map((item, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => setSelectedTeacherName(item.name)}
                    className={`w-full group flex items-center space-x-4 p-3 rounded-2xl transition-all border-2 ${selectedTeacherName === item.name ? 'border-freedom-orange bg-orange-50/50' : 'border-transparent hover:bg-gray-50'}`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center font-black text-xl pointer-events-none">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </div>
                    <div className="flex-1 text-left pointer-events-none">
                      <div className="flex justify-between items-end mb-1">
                        <h4 className="font-bold text-freedom-gray text-sm leading-none">{item.name}</h4>
                        <span className="text-[10px] font-black text-freedom-orange">{item.count} AULAS</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-freedom-orange transition-all duration-1000" style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
              <h3 className="text-xl font-black text-freedom-gray uppercase tracking-tighter mb-8">Distribuição por Nível CEFR</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={levelData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f9f9f9'}} contentStyle={{borderRadius: '24px', border: 'none'}} />
                    <Bar dataKey="value" radius={[15, 15, 0, 0]}>
                      {levelData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'teachers' && (
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 animate-fadeIn overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Professor</th>
                  <th className="pb-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Email</th>
                  <th className="pb-4 font-black text-[10px] text-gray-400 uppercase tracking-widest">Aulas</th>
                  <th className="pb-4 font-black text-[10px] text-gray-400 uppercase tracking-widest text-right pr-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teachers.map((teacher, idx) => (
                  <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 font-bold text-freedom-gray flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-freedom-orange text-white flex items-center justify-center font-black shadow-sm">{teacher.name.charAt(0)}</div>
                      {teacher.name}
                    </td>
                    <td className="py-5 text-xs font-medium text-gray-500">{teacher.email}</td>
                    <td className="py-5">
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black">
                        {plans.filter(p => p.authorName === teacher.name).length}
                      </span>
                    </td>
                    <td className="py-5">
                      <div className="flex justify-end gap-2 pr-2">
                        <button 
                          type="button"
                          onClick={() => {setSelectedTeacherName(teacher.name); setActiveTab('stats');}} 
                          className="p-2.5 text-freedom-orange hover:bg-freedom-orange hover:text-white rounded-xl transition-all shadow-sm border border-orange-100 group/btn" 
                          title="Ver Insights"
                        >
                          <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => handleResetPassword(teacher.email, e)} 
                          className="p-2.5 text-freedom-gray hover:bg-freedom-gray hover:text-white rounded-xl transition-all shadow-sm border border-gray-100 group/btn" 
                          title="Redefinir Senha"
                        >
                          <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 11-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => handleDeleteTeacher(teacher.email, e)} 
                          className="p-2.5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm border border-red-50 group/btn" 
                          title="Excluir Professor"
                        >
                          <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 animate-fadeIn">
          <h3 className="text-xl font-black text-freedom-gray uppercase mb-6 tracking-tighter">Moderação do Banco Global</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.id} className="p-6 border border-gray-100 rounded-[2rem] hover:border-freedom-orange transition-all bg-gray-50/50 flex flex-col shadow-sm group">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black uppercase text-freedom-orange bg-white px-3 py-1 rounded-full shadow-sm border border-orange-50">{plan.level}</span>
                  <button type="button" onClick={(e) => handleDeletePlan(plan.id, e)} className="text-gray-300 hover:text-red-500 transition-colors" title="Excluir Aula"><svg className="w-5 h-5 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                </div>
                <h4 className="font-bold text-freedom-gray mb-1 line-clamp-1">{plan.title}</h4>
                <p className="text-[9px] text-gray-400 font-bold uppercase mb-6">By: {plan.authorName}</p>
                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-[9px] text-gray-400 font-bold">{new Date(plan.createdAt).toLocaleDateString()}</span>
                  <Link to={`/lesson/${plan.id}`} className="text-[9px] font-black uppercase text-freedom-orange hover:underline tracking-widest">Ver Aula →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-freedom-gray/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl p-8 border border-white/20 relative">
            <button type="button" onClick={() => setShowCreateModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-freedom-gray transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            <h3 className="text-2xl font-black text-freedom-gray uppercase tracking-tighter mb-6">Cadastrar Teacher</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Nome Completo</label>
                <input type="text" required className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-freedom-orange outline-none font-bold text-sm" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">E-mail de Acesso</label>
                <input type="email" required className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-freedom-orange outline-none font-bold text-sm" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Senha Inicial</label>
                <input type="text" required className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-freedom-orange outline-none font-bold text-sm" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-freedom-orange text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg mt-4 border-b-4 border-orange-800 active:translate-y-0.5 active:border-b-0">Salvar Cadastro</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
