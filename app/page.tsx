'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

export default function RootPage() {
  const { user, isDataLoaded } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (isDataLoaded || user) {
      if (user) {
        router.replace('/escritorio');
      } else {
        router.replace('/login');
      }
    }
  }, [user, isDataLoaded, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-palette-lightest dark:bg-[#111111]">
      <LoadingPlaceholder />
    </div>
  );
}
