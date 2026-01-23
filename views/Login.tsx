
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  // States for First Access Password Reset
  const [showResetFlow, setShowResetFlow] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  const getTeachers = (): any[] => {
    return JSON.parse(localStorage.getItem('freedom_teachers') || '[]');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Check for hardcoded Admin access
    const isAdmin = formData.email.toLowerCase() === 'admin' && formData.password === 'f1';
    if (isAdmin) {
      onLogin({ name: 'Administrador', email: 'admin@freedom.com', role: 'admin' });
      return;
    }

    // Check against admin-created teachers list
    const teachers = getTeachers();
    const existingTeacher = teachers.find(t => t.email.toLowerCase() === formData.email.toLowerCase());

    if (existingTeacher) {
      if (existingTeacher.password === formData.password) {
        // Credenciais válidas. Verificar se precisa resetar senha (primeiro acesso)
        if (existingTeacher.needsPasswordReset) {
          setPendingUser(existingTeacher);
          setNewPassword(existingTeacher.password); // Inicia com a atual para opção de manter
          setShowResetFlow(true);
          setLoading(false);
        } else {
          onLogin({ 
            name: existingTeacher.name, 
            email: existingTeacher.email, 
            role: 'teacher' 
          });
        }
      } else {
        alert("Senha incorreta. Verifique suas credenciais.");
        setLoading(false);
      }
    } else {
      alert("Usuário não autorizado. Entre em contato com o administrador para criar sua conta.");
      setLoading(false);
    }
  };

  const handlePasswordResetComplete = (keepCurrent: boolean) => {
    const finalPassword = keepCurrent ? pendingUser.password : newPassword;
    
    if (!keepCurrent && (!newPassword || newPassword.trim().length < 4)) {
      alert("A nova senha deve ter pelo menos 4 caracteres.");
      return;
    }

    // Atualizar no localStorage
    const teachers = getTeachers();
    const updatedTeachers = teachers.map(t => 
      t.email.toLowerCase() === pendingUser.email.toLowerCase() 
        ? { ...t, password: finalPassword, needsPasswordReset: false } 
        : t
    );
    localStorage.setItem('freedom_teachers', JSON.stringify(updatedTeachers));

    // Efetuar Login
    onLogin({ 
      name: pendingUser.name, 
      email: pendingUser.email, 
      role: 'teacher' 
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-freedom-orange/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-freedom-orange/5 rounded-full blur-[100px]"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

      <div className="max-w-md w-full z-10">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(247,147,30,0.3)]">
            FREEDOM<span className="text-freedom-orange">LPG</span>
          </h1>
          <div className="flex flex-col items-center">
             <div className="h-[2px] w-20 bg-freedom-orange/50 mb-4"></div>
             <p className="text-freedom-orange font-bold text-[11px] uppercase tracking-[0.4em] leading-relaxed max-w-[320px]">
               Plataforma Exclusiva para Teachers
             </p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
          {!showResetFlow ? (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-white font-bold text-lg">Acesso Restrito</h2>
                <p className="text-gray-400 text-xs mt-1">Insira suas credenciais fornecidas pela escola</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-6 animate-fadeIn">
                <div className="group">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 transition-colors group-focus-within:text-freedom-orange">E-mail ou Login</label>
                  <input
                    type="text"
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:border-freedom-orange/50 focus:bg-white/10 outline-none transition-all font-medium text-sm text-white placeholder-white/20"
                    placeholder="exemplo@freedom.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="group">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 transition-colors group-focus-within:text-freedom-orange">Senha de Acesso</label>
                  <input
                    type="password"
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:border-freedom-orange/50 focus:bg-white/10 outline-none transition-all font-medium text-sm text-white placeholder-white/20"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-freedom-orange text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:brightness-110 hover:shadow-[0_0_30px_rgba(247,147,30,0.5)] transition-all duration-500 active:scale-[0.97] mt-4 flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Entrar no Sistema</span>
                      <span className="text-lg">→</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="animate-fadeIn">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-freedom-orange/20 text-freedom-orange rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 className="text-white font-bold text-lg">Olá, Teacher {pendingUser?.name.split(' ')[0]}!</h2>
                <p className="text-gray-400 text-xs mt-1">Este é seu primeiro acesso. Deseja criar uma nova senha pessoal ou manter a atual?</p>
              </div>

              <div className="space-y-4">
                <div className="group">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 transition-colors group-focus-within:text-freedom-orange">Nova Senha</label>
                  <input
                    type="text"
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:border-freedom-orange/50 focus:bg-white/10 outline-none transition-all font-medium text-sm text-white placeholder-white/20"
                    placeholder="Digite sua nova senha"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={() => handlePasswordResetComplete(false)}
                    className="w-full bg-freedom-orange text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-[0.97]"
                  >
                    Confirmar Nova Senha
                  </button>
                  <button
                    onClick={() => handlePasswordResetComplete(true)}
                    className="w-full bg-white/5 text-gray-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Manter Senha Atual
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-gray-500 font-medium">
              {!showResetFlow ? 'Não tem uma conta? ' : 'Segurança Freedom Academy '}
              <span className="text-freedom-orange">Fale com seu coordenador.</span>
            </p>
          </div>
        </div>

        <p className="text-center mt-12 text-gray-500 text-[9px] font-black uppercase tracking-[0.5em] opacity-40">
          Freedom English School // AI-Core System
        </p>
      </div>
    </div>
  );
};

export default Login;
