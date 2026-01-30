
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
      setError('Campos obrigatórios não preenchidos');
      setLoading(false);
      return;
    }
    const virtualEmail = `${username.toLowerCase().trim()}@ysoffice.local`;
    try {
      if (tab === 'register') {
        if (password !== confirmPassword) {
          setError('As senhas não coincidem');
          setLoading(false);
          return;
        }
        // Using any cast to bypass SupabaseAuthClient type mismatch in the build environment
        const { data, error: signUpError } = await (supabase.auth as any).signUp({
          email: virtualEmail,
          password: password,
          options: { data: { username: username } }
        });
        if (signUpError) throw signUpError;
        if (data.user) onLogin({ id: data.user.id, nick: username });
      } else {
        // Using any cast to bypass SupabaseAuthClient type mismatch in the build environment
        const { data, error: signInError } = await (supabase.auth as any).signInWithPassword({
          email: virtualEmail,
          password: password,
        });
        if (signInError) throw signInError;
        if (data.user) onLogin({ id: data.user.id, nick: data.user.user_metadata.username || username });
      }
    } catch (err: any) {
      setError(err.message || 'Erro de autenticação no servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded border border-[#dee2e6] shadow-xl overflow-hidden">
        <div className="bg-[#1b2631] p-6 text-center text-white border-b-4 border-[#0064d2]">
          <h1 className="text-xl font-bold tracking-tight">YSoffice <span className="text-[10px] font-normal opacity-50 block mt-1 uppercase tracking-widest">Portal do Usuário</span></h1>
        </div>

        <div className="flex border-b border-[#dee2e6] bg-[#f8f9fa]">
          <button 
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${tab === 'login' ? 'bg-white text-[#0064d2] border-b-2 border-[#0064d2]' : 'text-[#556b82] hover:bg-[#f3f5f8]'}`}
          >
            Acesso
          </button>
          <button 
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${tab === 'register' ? 'bg-white text-[#0064d2] border-b-2 border-[#0064d2]' : 'text-[#556b82] hover:bg-[#f3f5f8]'}`}
          >
            Registro
          </button>
        </div>

        <form onSubmit={handleAuth} className="p-8 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded border border-red-100 text-[11px] font-semibold">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#556b82] tracking-wider">Usuário</label>
            <input 
              type="text"
              disabled={loading}
              className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded outline-none focus:border-[#0064d2] focus:ring-1 focus:ring-[#0064d2]/20 text-sm transition-all"
              placeholder="Nome de identificação"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#556b82] tracking-wider">Senha</label>
            <input 
              type="password"
              disabled={loading}
              className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded outline-none focus:border-[#0064d2] focus:ring-1 focus:ring-[#0064d2]/20 text-sm transition-all"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {tab === 'register' && (
            <div className="space-y-1 animate-in fade-in duration-300">
              <label className="text-[10px] font-bold uppercase text-[#556b82] tracking-wider">Confirmar Senha</label>
              <input 
                type="password"
                disabled={loading}
                className="w-full px-3 py-2 bg-white border border-[#dee2e6] rounded outline-none focus:border-[#0064d2] focus:ring-1 focus:ring-[#0064d2]/20 text-sm transition-all"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#0064d2] hover:bg-[#0052ad] text-white font-bold py-2.5 rounded shadow-sm transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : tab === 'login' ? 'Autenticar Sistema' : 'Confirmar Cadastro'}
            </button>

            <button 
              type="button"
              disabled={loading}
              onClick={() => onLogin({ id: 'demo_user_id', nick: 'Visitante' })}
              className="w-full bg-white hover:bg-[#f8f9fa] text-[#556b82] font-semibold py-2 rounded transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider border border-[#dee2e6]"
            >
              <PlayCircle size={14} /> Modo Avaliação
            </button>
          </div>
        </form>
        <div className="bg-[#f8f9fa] p-4 text-center border-t border-[#dee2e6]">
          <p className="text-[9px] text-[#556b82] uppercase font-bold tracking-tighter opacity-50">Tecnologia Certificada &copy; 2025 YSoffice</p>
        </div>
      </div>
    </div>
  );
};
