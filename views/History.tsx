
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LessonPlan } from '../types';
import FredGuide from '../components/FredGuide';

const History: React.FC = () => {
  const [plans, setPlans] = useState<LessonPlan[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('freedom_plans') || '[]');
    setPlans(saved);
  }, []);

  const deletePlan = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if(window.confirm('Delete this lesson plan?')) {
      const filtered = plans.filter(p => p.id !== id);
      setPlans(filtered);
      localStorage.setItem('freedom_plans', JSON.stringify(filtered));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <FredGuide message="Look at all this progress! Your historical library is a treasure chest of knowledge. Reusing great lessons is a mark of a smart teacher!" />
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-title text-freedom-gray">My Lesson Plans</h1>
        <Link to="/generate" className="bg-freedom-orange text-white px-6 py-2 rounded-xl font-bold shadow-sm">+ New Lesson</Link>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm">
          <p className="text-gray-400 font-bold">No lesson plans found yet. Let's start building!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Link key={plan.id} to={`/lesson/${plan.id}`} className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 relative">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-freedom-orange/10 text-freedom-orange px-3 py-1 rounded-full text-xs font-black">{plan.level}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(plan.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-title text-freedom-gray group-hover:text-freedom-orange transition-colors mb-2 leading-tight">
                {plan.title}
              </h3>
              <p className="text-xs text-gray-500 mb-4 line-clamp-2">Topic: {plan.grammarTopic}</p>
              <div className="flex items-center text-[10px] font-bold text-gray-400 space-x-3 mt-auto">
                <span>⏱ {plan.duration}</span>
                <span>👤 {plan.studentCount} Alunos</span>
              </div>
              <button 
                onClick={(e) => deletePlan(plan.id, e)}
                className="absolute bottom-6 right-6 p-2 text-gray-300 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
