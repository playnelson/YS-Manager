'use client';
import dynamic from 'next/dynamic';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const BrasilApiModule = dynamic(() => import('@/components/BrasilApiModule').then(m => m.BrasilApiModule), {
  ssr: false,
  loading: () => <LoadingPlaceholder />
});

export default function BrasilHubPage() {
  return (
    <BrasilApiModule />
  );
}
