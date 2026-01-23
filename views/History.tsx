
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LessonPlan, User } from '../types';
import FredGuide from '../components/FredGuide';
import { getSavedPlans, deletePlanSafely, clearAllPlans } from '../services/storageService';

const History: React.FC = () => {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<LessonPlan[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [ownershipFilter, setOwnershipFilter] = useState<'ALL' | 'MINE'>('ALL');

  useEffect(() => {
    const savedPlans = getSavedPlans();
    setPlans(savedPlans);
    
    const userStr = localStorage.getItem('freedom_user');
    if (userStr) setCurrentUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    let result = plans;

    // Filter by ownership
    if (ownershipFilter === 'MINE' && currentUser) {
      result = result.filter(p => p.authorName === currentUser.name);
    }

    if (searchTerm) {
      result = result.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.grammarTopic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vocabularyFocus.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (levelFilter !== 'ALL') {
      result = result.filter(p => p.level === levelFilter);
    }

    if (typeFilter !== 'ALL') {
      result = result.filter(p => typeFilter === 'QUICK' ? p.isQuickLesson : !p.isQuickLesson);
    }

    setFilteredPlans(result);
  }, [plans, searchTerm, levelFilter, typeFilter, ownershipFilter, currentUser]);

  const deletePlan = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if(window.confirm('Excluir este plano de aula da biblioteca permanentemente?')) {
      const updated = deletePlanSafely(id);
      setPlans(updated);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <FredGuide message="Welcome to the Freedom Library! Este é o nosso legado compartilhado. Aqui você encontra suas criações e as aulas incríveis de outros teachers. Use os filtros para explorar o banco global!" />
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-freedom-gray tracking-tighter uppercase">
            Freedom <span className="text-freedom-orange">Library</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Banco de Dados Global da Escola</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-gray-100 p-1 rounded-2xl shadow-inner border border-gray-200">
            <button
              onClick={() => setOwnershipFilter('ALL')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${ownershipFilter === 'ALL' ? 'bg-white text-freedom-orange shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Banco Global
            </button>
            <button
              onClick={() => setOwnershipFilter('MINE')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${ownershipFilter === 'MINE' ? 'bg-white text-freedom-orange shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Minhas Aulas
            </button>
          </div>
          <Link to="/quick-generate" className="bg-freedom-orange text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:scale-105 transition-all active:scale-95 border-b-4 border-orange-800">
            + Nova Aula
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Buscar Conteúdo</label>
          <input 
            type="text" 
            placeholder="Tópico, gramática, título..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-freedom-orange outline-none font-medium text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nível CEFR</label>
          <select 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-freedom-orange outline-none font-bold text-sm"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="ALL">Todos os Níveis</option>
            <option value="A1">A1 - Beginner</option>
            <option value="A2">A2 - Elementary</option>
            <option value="B1">B1 - Intermediate</option>
            <option value="B2">B2 - Upper Intermediate</option>
            <option value="C1">C1 - Advanced</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Metodologia</label>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {['ALL', 'QUICK', 'STANDARD'].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${typeFilter === type ? 'bg-white text-freedom-orange shadow-sm' : 'text-gray-400'}`}
              >
                {type === 'ALL' ? 'Todos' : type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-dashed border-gray-200">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-400 font-bold uppercase text-sm tracking-widest">Nenhuma aula encontrada nos filtros selecionados.</p>
          <button onClick={() => {setSearchTerm(''); setLevelFilter('ALL'); setTypeFilter('ALL'); setOwnershipFilter('ALL');}} className="mt-4 text-freedom-orange font-black text-xs uppercase hover:underline">Limpar Filtros</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPlans.map((plan) => {
            const isMine = currentUser && plan.authorName === currentUser.name;
            return (
              <Link key={plan.id} to={`/lesson/${plan.id}`} className="group bg-white p-7 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all border border-gray-100 relative flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex space-x-2">
                    <span className="bg-freedom-orange text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm">{plan.level}</span>
                    {plan.isQuickLesson && (
                      <span className="bg-freedom-gray text-freedom-orange px-4 py-1.5 rounded-full text-[10px] font-black shadow-sm border border-freedom-orange/30">QUICK</span>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">{new Date(plan.createdAt).toLocaleDateString()}</span>
                    {isMine && (
                      <span className="bg-green-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase mt-1 tracking-tighter">Minha Aula</span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-black text-freedom-gray group-hover:text-freedom-orange transition-colors mb-4 leading-tight uppercase tracking-tighter">
                  {plan.title}
                </h3>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 p-3 rounded-2xl">
                     <span className="text-freedom-orange mr-2">📚</span>
                     <span className="truncate">Grammar: {plan.grammarTopic}</span>
                  </div>
                  <div className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 p-3 rounded-2xl">
                     <span className="text-freedom-orange mr-2">🎯</span>
                     <span className="truncate">Focus: {plan.vocabularyFocus}</span>
                  </div>
                  <div className="flex items-center text-[10px] font-bold text-gray-400 px-3">
                     By: {plan.authorName || 'Teacher'}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                  <div className="flex items-center space-x-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center"><span className="mr-1">⏱</span> {plan.duration}</span>
                    <span className="flex items-center"><span className="mr-1">👤</span> {plan.studentCount} Students</span>
                  </div>
                  {isMine && (
                    <button 
                      onClick={(e) => deletePlan(plan.id, e)}
                      className="p-2 text-gray-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
