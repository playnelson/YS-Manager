
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
          scopes: 'email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/contacts.readonly',
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--apple-bg)] font-sans">
      <div className="w-full max-w-[440px]">
        <div className="bg-[var(--apple-card)] squircle shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 md:p-14 border border-white">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-14 h-14 bg-[var(--apple-button)] rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-black/5">
              <span className="material-symbols-outlined !text-3xl">deployed_code</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--apple-text)]">Brain Office</h1>
            <p className="text-[var(--apple-secondary)] text-sm mt-2">
              {isRegistering ? 'Crie sua conta profissional' : 'Acesse sua plataforma profissional'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-xl text-center">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 text-xs font-medium rounded-xl text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--apple-secondary)] px-1 uppercase tracking-wider">Nome de Exibição</label>
                <input
                  className="input-apple"
                  placeholder="Como quer ser chamado?"
                  type="text"
                  required
                  disabled={loading}
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--apple-secondary)] px-1 uppercase tracking-wider">E-mail</label>
              <input
                className="input-apple"
                placeholder="nome@exemplo.com"
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-semibold text-[var(--apple-secondary)] uppercase tracking-wider">Senha</label>
                {!isRegistering && (
                  <a className="text-[11px] font-medium text-gray-500 hover:text-black transition-colors" href="#">Esqueceu a senha?</a>
                )}
              </div>
              <input
                className="input-apple"
                placeholder="••••••••"
                type="password"
                required
                disabled={loading}
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="pt-4">
              <button className="btn-apple-primary" type="submit" disabled={loading}>
                {loading ? <IconLoader2 className="animate-spin" size={18} /> : (isRegistering ? 'Cadastrar' : 'Entrar')}
              </button>
            </div>
          </form>

          {!isRegistering && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-400 font-medium tracking-widest">ou entre com</span>
                </div>
              </div>

              <div className="space-y-3">
                <button className="btn-apple-social" onClick={handleGoogleLogin} disabled={loading}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                  setSuccessMsg('');
                  setPassword('');
                }}
                className="text-xs font-semibold text-[var(--apple-button)] hover:opacity-70 transition-opacity"
              >
                {isRegistering ? 'Já tenho conta' : 'Criar nova conta'}
              </button>

              {!isRegistering && (
                <button
                  type="button"
                  onClick={() => onLogin({ id: 'demo_user_id', nick: 'Visitante' })}
                  className="text-xs font-medium text-gray-400 hover:text-[var(--apple-text)] transition-colors"
                >
                  Modo Demonstrativo
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex gap-6 text-[11px] text-[var(--apple-secondary)] font-medium uppercase tracking-widest">
            <a className="hover:text-[var(--apple-text)] transition-colors" href="#">Termos</a>
            <a className="hover:text-[var(--apple-text)] transition-colors" href="#">Privacidade</a>
            <a className="hover:text-[var(--apple-text)] transition-colors" href="#">Suporte</a>
          </div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">
            Brain Office v2.7 © 2024
          </p>
        </div>
      </div>
    </div>
  );
};
