import './globals.css';
import type { Metadata } from 'next';
import { AppProvider } from '@/providers/AppProvider';

export const metadata: Metadata = {
  title: 'Brain Office — Sistema Integrado de Gestão',
  description: 'Sistema de gestão empresarial completo para profissionais e empresas. Organização, fluxo e ferramentas integradas em um só lugar.',
  robots: 'noindex, nofollow',
  themeColor: '#111827',
  openGraph: {
    type: 'website',
    title: 'Brain Office — Sistema Integrado de Gestão',
    description: 'Sua central de produtividade e organização pessoal e profissional.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* Material Symbols */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        {/* Google API & Identity Services */}
        <script src="https://apis.google.com/js/api.js" async defer />
        <script src="https://accounts.google.com/gsi/client" async defer />
        <link rel="icon" type="image/png" href="/favicon_brain_site.png" />
      </head>
      <body className="min-h-screen select-none bg-palette-lightest dark:bg-[#111111]">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
