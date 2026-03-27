'use client';
import { lazy, Suspense } from 'react';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

const BrasilApiModule = lazy(() => import('@/components/BrasilApiModule').then(m => ({ default: m.BrasilApiModule })));

export default function BrasilHubPage() {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <BrasilApiModule />
    </Suspense>
  );
}
