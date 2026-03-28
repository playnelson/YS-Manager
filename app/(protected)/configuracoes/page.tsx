'use client';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const SettingsModuleComp = dynamic(() => import('@/components/SettingsModule').then(m => m.SettingsModule), {
  ssr: false,
  loading: () => <LoadingPlaceholder />
});

export default function ConfiguracoesPage() {
  const { user, setUser, handleLogout, companySettings, saveCompanySettings } = useAppContext();

  if (!user) return <LoadingPlaceholder />;

  return (
    <SettingsModuleComp
      user={user}
      onUpdateUser={setUser}
      onLogout={handleLogout}
      companySettings={companySettings}
      onCompanySettingsChange={saveCompanySettings}
    />
  );
}
