
import React, { useState } from 'react';
import { 
  IconUser, 
  IconLock, 
  IconKey, 
  IconHelp, 
  IconUserPlus, 
  IconLogin, 
  IconLoader2, 
  IconMail, 
  IconBrandGoogle 
} from '@tabler/icons-react';
import { User } from '../types';
import { supabase } from '../supabase';
import { Button } from './ui/Button';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState(''); // Novo campo para o nome de exibição
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
          redirectTo: window.location.origin
        }
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      console.error(err);
      setError('Erro ao entrar com Google: ' + err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    
    // Pequeno delay para feedback visual
    await new Promise(r => setTimeout(r, 300));

    try {
      if (isRegistering) {
        // --- Lógica de REGISTRO (Com E-mail Real) ---
        if (!nickname.trim()) throw new Error('Por favor, escolha um nome de exibição.');

        const { data, error: signUpError } = await (supabase.auth as any).signUp({
          email: email,
          password: password,
          options: { data: { username: nickname } }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          if (data.session) {
            // Login automático (se confirmação de email estiver desligada no Supabase)
            onLogin({ id: data.user.id, nick: nickname, photoUrl: data.user.user_metadata.avatar_url });
          } else {
            // Aguardando confirmação de email
            setSuccessMsg(`Conta criada! Verifique a caixa de entrada de ${email} para confirmar seu cadastro.`);
            setIsRegistering(false); // Volta para tela de login para induzir o usuário a checar o email
            setEmail('');
            setPassword('');
            setNickname('');
          }
        }
      } else {
        // --- Lógica de LOGIN (Com E-mail Real) ---
        const { data, error: signInError } = await (supabase.auth as any).signInWithPassword({
          email: email,
          password: password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          // Tenta pegar o username dos metadados, ou usa a parte antes do @ do email como fallback
          const displayNick = data.user.user_metadata.username || data.user.user_metadata.full_name || email.split('@')[0];
          const photoUrl = data.user.user_metadata.avatar_url;
          onLogin({ id: data.user.id, nick: displayNick, photoUrl });
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('Invalid login')) {
        setError('E-mail ou senha incorretos.');
      } else if (err.message.includes('already registered')) {
        setError('Este e-mail já está cadastrado.');
      } else if (err.message.includes('password')) {
        setError('A senha deve ter no mínimo 6 caracteres.');
      } else if (err.message.includes('valid email')) {
        setError('Por favor, insira um e-mail válido.');
      } else {
        setError('Erro: ' + err.message);
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
          <span>{isRegistering ? 'Novo Cadastro' : 'Login Brain'}</span>
        </div>

        <div className="px-4 pb-4">
          <div className="flex gap-4 mb-4">
            <div className="pt-2">
               {isRegistering ? (
                 <IconMail size={48} className="text-[#808080]" strokeWidth={1.5} />
               ) : (
                 <IconKey size={48} className="text-[#808080]" strokeWidth={1.5} />
               )}
            </div>
            <div className="flex-1">
              <p className="text-sm mb-4 text-black">
                {isRegistering 
                  ? 'Informe seu e-mail real para receber o link de confirmação.' 
                  : 'Digite suas credenciais para entrar.'}
              </p>
              
              {error && (
                <div className="mb-3 px-2 py-1 bg-[#ff0000] text-white text-xs font-bold text-center border border-white shadow-md">
                  {error}
                </div>
              )}
              
              {successMsg && (
                <div className="mb-3 px-2 py-1 bg-[#008000] text-white text-xs font-bold text-center border border-white shadow-md">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {isRegistering && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-black">Nome de Exibição:</label>
                    <input 
                      type="text"
                      disabled={loading}
                      required={isRegistering}
                      className="w-full px-1 py-1 bg-white win95-sunken outline-none text-sm focus:bg-yellow-100 text-black"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      placeholder="Como quer ser chamado?"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-black">E-mail:</label>
                  <input 
                    type="email"
                    disabled={loading}
                    required
                    className="w-full px-1 py-1 bg-white win95-sunken outline-none text-sm focus:bg-yellow-100 text-black"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoFocus
                    placeholder="seu@email.com"
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

                <div className="flex flex-col gap-2 pt-4">
                    <Button type="submit" disabled={loading} className="w-full">
                       {loading ? <IconLoader2 className="animate-spin" size={14} /> : (isRegistering ? 'CADASTRAR COM E-MAIL' : 'ENTRAR COM E-MAIL')}
                    </Button>
                    
                    {!isRegistering && (
                      <button 
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full win95-raised bg-white p-2 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors border border-gray-400"
                      >
                        <IconBrandGoogle size={16} className="text-[#4285F4]" />
                        <span className="text-xs font-bold text-black uppercase">Entrar com Google</span>
                      </button>
                    )}
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
                    setSuccessMsg('');
                    setPassword('');
                  }}
                  className="text-xs font-bold text-[#000080] hover:underline focus:outline-dotted flex items-center gap-1"
               >
                  {isRegistering ? (
                    <><IconLogin size={12}/> Já tenho conta</>
                  ) : (
                    <><IconUserPlus size={12}/> Criar conta com E-mail</>
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