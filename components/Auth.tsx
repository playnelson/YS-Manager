
import React, { useState } from 'react';
import { User as UserIcon, Lock, Key, HelpCircle, Loader2 } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../supabase';
import { Button } from './ui/Button';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Simulação de delay de rede antigo
    await new Promise(r => setTimeout(r, 500));

    const virtualEmail = `${username.toLowerCase().trim()}@ysoffice.local`;
    try {
      // Tentativa de login direto
      const { data, error: signInError } = await (supabase.auth as any).signInWithPassword({
        email: virtualEmail,
        password: password,
      });

      if (signInError) {
        // Se falhar, tenta registrar automaticamente (fallback para simplificar a UX do demo)
        const { data: signUpData, error: signUpError } = await (supabase.auth as any).signUp({
          email: virtualEmail,
          password: password,
          options: { data: { username: username } }
        });
        
        if (signUpError) throw signInError; // Lança o erro original se o registro também falhar
        if (signUpData.user) {
            onLogin({ id: signUpData.user.id, nick: username });
            return;
        }
      }

      if (data.user) {
        onLogin({ id: data.user.id, nick: data.user.user_metadata.username || username });
      }
    } catch (err: any) {
      setError('Nome de usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#c0c0c0] flex items-center justify-center font-sans">
      <div className="w-96 win95-raised p-1 shadow-xl">
        {/* Title Bar - Clean, no X */}
        <div className="bg-[#000080] text-white px-2 py-1 text-sm font-bold flex justify-between items-center mb-4 select-none">
          <span>Login do Sistema</span>
        </div>

        <div className="px-4 pb-4">
          <div className="flex gap-4 mb-4">
            <div className="pt-2">
               <Key size={48} className="text-[#808080]" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm mb-4 text-black">Digite suas credenciais para acessar o YSoffice.</p>
              
              {error && (
                <div className="mb-3 px-2 py-1 bg-[#ff0000] text-white text-xs font-bold text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-black">Usuário:</label>
                  <input 
                    type="text"
                    disabled={loading}
                    className="w-full px-1 py-1 bg-white win95-sunken outline-none text-sm focus:bg-yellow-100 text-black"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-black">Senha:</label>
                  <input 
                    type="password"
                    disabled={loading}
                    className="w-full px-1 py-1 bg-white win95-sunken outline-none text-sm focus:bg-yellow-100 text-black"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit" disabled={loading} className="min-w-[80px]">
                       {loading ? '...' : 'OK'}
                    </Button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="border-t border-[#808080] border-b border-white my-2 h-0" />
          
          <div className="flex justify-between items-center pt-1">
             <button 
                type="button"
                onClick={() => onLogin({ id: 'demo_user_id', nick: 'Visitante' })}
                className="text-xs underline text-blue-800 hover:text-blue-600 focus:outline-dotted"
             >
                Modo Demonstração
             </button>
             <HelpCircle size={16} className="text-[#808080]" />
          </div>
        </div>
      </div>
    </div>
  );
};
