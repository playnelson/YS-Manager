'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@/components/Auth';
import { useAppContext } from '@/providers/AppProvider';

export default function LoginPage() {
  const { user, setUser } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/escritorio');
  }, [user, router]);

  return <Auth onLogin={setUser} />;
}
