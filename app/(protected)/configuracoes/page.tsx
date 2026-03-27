'use client';
import { lazy, Suspense } from 'react';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const SettingsModuleComp = lazy(() => import('@/components/SettingsModule').then(m => ({ default: m.SettingsModule })));

export default function ConfiguracoesPage() {
  const { user, setUser, handleLogout, companySettings, saveCompanySettings } = useAppContext();

  if (!user) return <LoadingPlaceholder />;

  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <SettingsModuleComp
        user={user}
        onUpdateUser={setUser}
        onLogout={handleLogout}
        companySettings={companySettings}
        onCompanySettingsChange={saveCompanySettings}
      />
    </Suspense>
  );
}
