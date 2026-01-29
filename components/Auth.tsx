
import React, { useState } from 'react';
import { User as UserIcon, Lock, UserPlus, LogIn, AlertCircle, Loader2, PlayCircle } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../supabase';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Preencha todos os campos');
      setLoading(false);
      return;
    }

    // Supabase exige um formato de e-mail, então usamos o nick como parte de um e-mail interno
    const virtualEmail = `${username.toLowerCase().trim()}@ysoffice.local`;

    try {
      if (tab === 'register') {
        if (password !== confirmPassword) {
          setError('As senhas não coincidem');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: virtualEmail,
          password: password,
          options: {
            data: { username: username }
          }
        });

        if (signUpError) throw signUpError;
        if (data.user) {
          alert("Cadastro realizado com sucesso!");
          onLogin({ id: data.user.id, nick: username });
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: password,
        });

        if (signInError) throw signInError;
        if (data.user) {
          onLogin({ 
            id: data.user.id, 
            nick: data.user.user_metadata.username || username 
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    // Acesso imediato como um usuário temporário para testes
    onLogin({ 
      id: 'demo_user_id', 
      nick: 'Visitante' 
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center text-white">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
            {tab === 'login' ? <UserIcon size={40} /> : <UserPlus size={40} />}
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">YSoffice</h1>
        </div>

        <div className="flex border-b border-slate-100">
          <button 
            type="button"
            disabled={loading}
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${tab === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Entrar
          </button>
          <button 
            type="button"
            disabled={loading}
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors ${tab === 'register' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleAuth} className="p-8 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 animate-in fade-in zoom-in-95">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nome de usuário</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400"><UserIcon size={18} /></span>
              <input 
                type="text"
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium disabled:opacity-50"
                placeholder="Seu nome de usuário aqui"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Senha</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400"><Lock size={18} /></span>
              <input 
                type="password"
                disabled={loading}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium disabled:opacity-50"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {tab === 'register' && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Confirmar Senha</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400"><Lock size={18} /></span>
                <input 
                  type="password"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium disabled:opacity-50"
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : tab === 'login' ? (
                <><LogIn size={20} /> Entrar no Painel</>
              ) : (
                <><UserPlus size={20} /> Criar Minha Conta</>
              )}
            </button>

            <button 
              type="button"
              disabled={loading}
              onClick={handleDemoMode}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest border border-slate-200"
            >
              <PlayCircle size={16} /> Experimentar modo Demo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
