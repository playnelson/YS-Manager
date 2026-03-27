'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingPlaceholder: React.FC = () => (
  <div className="h-full w-full flex flex-col items-center justify-center bg-win95-bg opacity-50">
    <div className="win95-raised p-4 flex flex-col items-center gap-2">
      <Loader2 size={24} className="animate-spin text-win95-blue" />
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Iniciando Módulo...</span>
    </div>
  </div>
);
