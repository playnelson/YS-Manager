'use client';

import React, { useState, useRef } from 'react';
import {
  IconUser,
  IconCamera,
  IconBrandGoogle,
  IconLogout,
  IconDeviceFloppy,
  IconLoader2,
  IconLink,
  IconLinkOff
} from '@tabler/icons-react';
import { User, CalendarConfig } from '@/types';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

interface SettingsModuleProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  companySettings: { name: string; logoUrl: string };
  onCompanySettingsChange: (data: { name: string; logoUrl: string }) => void;
  calendarConfig?: CalendarConfig;
  onCalendarConfigChange?: (config: CalendarConfig) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ user, onUpdateUser, onLogout, companySettings, onCompanySettingsChange, calendarConfig, onCalendarConfigChange }) => {
  const [nick, setNick] = useState(user.nick);
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState(companySettings.name);
  const [companyLogoUrl, setCompanyLogoUrl] = useState(companySettings.logoUrl);
  const [companySaved, setCompanySaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [uf, setUf] = useState(calendarConfig?.uf || 'SP');
  const [city, setCity] = useState(calendarConfig?.city || 'SÃO PAULO');
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  React.useEffect(() => {
     if (!uf) return;
     setLoadingCities(true);
     fetch('https://brasilapi.com.br/api/ibge/municipios/v1/' + uf)
       .then(res => res.json())
       .then(data => {
         if (Array.isArray(data)) {
           setCitiesList(data.map((m: any) => m.nome).sort());
         }
       })
       .catch(e => console.error("Erro IBGE", e))
       .finally(() => setLoadingCities(false));
  }, [uf]);

  const handleSaveLocation = () => {
      if (onCalendarConfigChange) {
          onCalendarConfigChange({ uf, city });
          setSuccess('Localização de Calendário salva com sucesso!');
          setTimeout(() => setSuccess(''), 3000);
      }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username: nick,
          avatar_url: photoUrl
        }
      });

      if (updateError) throw updateError;

      onUpdateUser({ ...user, nick, photoUrl });
      setSuccess('Perfil atualizado com sucesso!');
    } catch (err: any) {
      console.error(err);
      setError('Erro ao atualizar perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCompany = () => {
    onCompanySettingsChange({ name: companyName, logoUrl: companyLogoUrl });
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2000);
  };

  const handleGoogleLink = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data, error: linkError } = await supabase.auth.linkIdentity({
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
      if (linkError) throw linkError;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao vincular conta Google: ' + err.message);
      setLoading(false);
    }
  };

  const handleGoogleUnlink = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const identity = currentUser?.identities?.find(id => id.provider === 'google');
      if (!identity) {
        throw new Error('Nenhuma conta Google vinculada encontrada.');
      }

      const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
      if (unlinkError) throw unlinkError;

      await supabase.auth.refreshSession();
      onUpdateUser({ ...user, googleAccessToken: undefined });
      setSuccess('Conta Google desvinculada com sucesso!');
    } catch (err: any) {
      console.error(err);
      setError('Erro ao desvincular conta Google: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div className="win95-raised p-4 bg-win95-bg">
        <h2 className="text-lg font-black uppercase mb-4 border-b-2 border-win95-shadow pb-1 flex items-center gap-2">
          <IconUser size={20} /> Perfil do Usuário
        </h2>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 win95-sunken bg-white overflow-hidden flex items-center justify-center border-2 border-win95-shadow">
                {photoUrl ? (
                  <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <IconUser size={64} className="text-gray-300" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-win95-blue text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                <IconCamera size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Clique na câmera para mudar a foto</span>
          </div>

          {/* Form Section */}
          <div className="flex-1 w-full space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-win95-shadow">Nome de Exibição (Nick):</label>
              <input
                type="text"
                className="w-full px-2 py-1 win95-sunken bg-white text-sm outline-none focus:bg-yellow-50"
                value={nick}
                onChange={e => setNick(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-win95-shadow">ID do Usuário:</label>
              <div className="w-full px-2 py-1 win95-sunken bg-gray-100 text-[10px] font-mono text-gray-500 truncate">
                {user.id}
              </div>
            </div>

            {error && <div className="p-2 bg-red-100 text-red-700 text-xs font-bold border border-red-300">{error}</div>}
            {success && <div className="p-2 bg-green-100 text-green-700 text-xs font-bold border border-green-300">{success}</div>}

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveProfile} disabled={loading} className="flex items-center gap-2">
                {loading ? <IconLoader2 className="animate-spin" size={14} /> : <IconDeviceFloppy size={14} />}
                SALVAR ALTERAÇÕES
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="win95-raised p-4 bg-win95-bg">
        <h2 className="text-lg font-black uppercase mb-4 border-b-2 border-win95-shadow pb-1 flex items-center gap-2">
          <IconBrandGoogle size={20} /> Integração Google
        </h2>

        <div className="flex items-center justify-between p-3 win95-sunken bg-white">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${user.googleAccessToken ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
              <IconBrandGoogle size={24} />
            </div>
            <div>
              <div className="text-sm font-bold">Conta Google</div>
              <div className="text-[10px] text-gray-500 uppercase">
                {user.googleAccessToken ? 'Vinculada e Ativa' : 'Não vinculada'}
              </div>
            </div>
          </div>

          {user.googleAccessToken ? (
            <Button onClick={handleGoogleUnlink} variant="secondary" className="text-xs flex items-center gap-2">
              <IconLinkOff size={14} /> DESVINCULAR
            </Button>
          ) : (
            <Button onClick={handleGoogleLink} className="text-xs flex items-center gap-2">
              <IconLink size={14} /> VINCULAR CONTA
            </Button>
          )}
        </div>
      </div>

      {/* Company Settings */}
      <div className="win95-raised p-4 bg-win95-bg">
        <h2 className="text-lg font-black uppercase mb-4 border-b-2 border-win95-shadow pb-1 flex items-center gap-2">
          <span className="text-lg">🏢</span> Dados da Empresa
        </h2>
        <p className="text-xs text-gray-500 mb-4">Estas informações aparecem no cabeçalho das fichas impressas (EPI, Materiais, etc.).</p>

        <div className="space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div
              className="w-24 h-24 win95-sunken bg-white overflow-hidden flex items-center justify-center border-2 border-win95-shadow cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => logoInputRef.current?.click()}
              title="Clique para trocar o logo"
            >
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-xs text-gray-400 text-center font-bold uppercase px-2">Clique para adicionar logo</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                ref={logoInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <Button onClick={() => logoInputRef.current?.click()} className="text-xs flex items-center gap-2">
                <IconCamera size={14} /> Trocar Logo
              </Button>
              {companyLogoUrl && (
                <Button variant="secondary" onClick={() => setCompanyLogoUrl('')} className="text-xs">
                  Remover Logo
                </Button>
              )}
            </div>
          </div>

          {/* Company Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-win95-shadow">Nome da Empresa:</label>
            <input
              type="text"
              className="w-full px-2 py-1 win95-sunken bg-white text-sm outline-none focus:bg-yellow-50"
              value={companyName}
              placeholder="Ex: Construtora Silva Ltda"
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveCompany} className="flex items-center gap-2">
              <IconDeviceFloppy size={14} />
              {companySaved ? 'SALVO ✓' : 'SALVAR DADOS DA EMPRESA'}
            </Button>
          </div>
        </div>
      </div>

      <div className="win95-raised p-4 bg-win95-bg">
        <h2 className="text-lg font-black uppercase mb-4 border-b-2 border-win95-shadow pb-1 flex items-center gap-2">
          <IconLogout size={20} /> Sessão
        </h2>
        <p className="text-xs text-gray-600 mb-4">Deseja encerrar sua sessão atual neste dispositivo?</p>
        <Button onClick={onLogout} variant="danger" className="w-full flex items-center justify-center gap-2">
          <IconLogout size={16} /> ENCERRAR SESSÃO (LOGOUT)
        </Button>
      </div>
    </div>
  );
};
