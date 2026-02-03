
import React, { useState } from 'react';
import { User as UserIcon, Lock, Key, HelpCircle, UserPlus, LogIn, Loader2 } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../supabase';
import { Button } from './ui/Button';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Simulação de delay para feedback visual
    await new Promise(r => setTimeout(r, 500));

    // Cria um email virtual para o Supabase, já que o usuário usa apenas "username"
    const virtualEmail = `${username.toLowerCase().trim().replace(/\s+/g, '')}@ysoffice.local`;

    try {
      if (isRegistering) {
        // --- Lógica de REGISTRO ---
        const { data, error: signUpError } = await (supabase.auth as any).signUp({
          email: virtualEmail,
          password: password,
          options: { data: { username: username } }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Se o "Confirm Email" estiver desativado no Supabase, o login é automático.
          // Se estiver ativado, o usuário ficaria preso aqui.
          if (data.session) {
            onLogin({ id: data.user.id, nick: username });
          } else {
            setError('Registro criado! Se o login não for automático, verifique as configurações do Supabase.');
            setIsRegistering(false); // Volta para tela de login
          }
        }
      } else {
        // --- Lógica de LOGIN ---
        const { data, error: signInError } = await (supabase.auth as any).signInWithPassword({
          email: virtualEmail,
          password: password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          onLogin({ id: data.user.id, nick: data.user.user_metadata.username || username });
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('Invalid login')) {
        setError('Usuário ou senha incorretos.');
      } else if (err.message.includes('already registered')) {
        setError('Este usuário já existe. Tente outro.');
      } else if (err.message.includes('password')) {
        setError('A senha deve ter no mínimo 6 caracteres.');
      } else {
        setError('Erro ao processar: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#c0c0c0] flex items-center justify-center font-sans">
      <div className="w-96 win95-raised p-1 shadow-xl">
        {/* Title Bar */}
        <div className="bg-[#000080] text-white px-2 py-1 text-sm font-bold flex justify-between items-center mb-4 select-none">
          <span>{isRegistering ? 'Novo Usuário' : 'Login do Sistema'}</span>
        </div>

        <div className="px-4 pb-4">
          <div className="flex gap-4 mb-4">
            <div className="pt-2">
               {isRegistering ? (
                 <UserPlus size={48} className="text-[#808080]" strokeWidth={1.5} />
               ) : (
                 <Key size={48} className="text-[#808080]" strokeWidth={1.5} />
               )}
            </div>
            <div className="flex-1">
              <p className="text-sm mb-4 text-black">
                {isRegistering 
                  ? 'Defina suas credenciais para criar uma nova conta.' 
                  : 'Digite suas credenciais para acessar o YSoffice.'}
              </p>
              
              {error && (
                <div className="mb-3 px-2 py-1 bg-[#ff0000] text-white text-xs font-bold text-center border border-white shadow-md">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-black">Usuário:</label>
                  <input 
                    type="text"
                    disabled={loading}
                    required
                    className="w-full px-1 py-1 bg-white win95-sunken outline-none text-sm focus:bg-yellow-100 text-black"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoFocus
                    placeholder="Ex: joaosilva"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-black">Senha:</label>
                  <input 
                    type="password"
                    disabled={loading}
                    required
                    minLength={6}
                    className="w-full px-1 py-1 bg-white win95-sunken outline-none text-sm focus:bg-yellow-100 text-black"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  {isRegistering && <p className="text-[10px] text-gray-600">Mínimo de 6 caracteres.</p>}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit" disabled={loading} className="min-w-[80px]">
                       {loading ? <Loader2 className="animate-spin" size={14} /> : (isRegistering ? 'CRIAR' : 'ENTRAR')}
                    </Button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="border-t border-[#808080] border-b border-white my-2 h-0" />
          
          <div className="flex flex-col gap-2 pt-1">
             <div className="flex justify-between items-center">
               <button 
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                    setPassword('');
                  }}
                  className="text-xs font-bold text-[#000080] hover:underline focus:outline-dotted flex items-center gap-1"
               >
                  {isRegistering ? (
                    <><LogIn size={12}/> Já tenho conta</>
                  ) : (
                    <><UserPlus size={12}/> Criar conta</>
                  )}
               </button>
               
               {!isRegistering && (
                 <button 
                    type="button"
                    onClick={() => onLogin({ id: 'demo_user_id', nick: 'Visitante' })}
                    className="text-xs text-[#555] hover:text-black hover:underline"
                 >
                    Acesso Demo
                 </button>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
