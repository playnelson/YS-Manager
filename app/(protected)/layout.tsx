'use client';
import { useEffect, Suspense, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Menu, X, RefreshCw, Box, Users, Settings,
  Cloud, FolderOpen, ClipboardList, Check,
  MessageSquare, CalendarIcon, Home, Package,
  Globe, LogOut, MoreVertical
} from 'lucide-react';
import { useAppContext } from '@/providers/AppProvider';
import { LoadingPlaceholder } from '@/components/LoadingPlaceholder';

// Mapa de rotas → módulo
const NAV_ITEMS = [
  { id: 'escritorio',   href: '/escritorio',  label: 'Escritório',    icon: <Home size={18} /> },
  { id: 'calendario',   href: '/calendario',  label: 'Calendário',    icon: <CalendarIcon size={18} /> },
  { id: 'documentos',   href: '/documentos',  label: 'Documentos',    icon: <FolderOpen size={18} /> },
  { id: 'pedidos',      href: '/pedidos',     label: 'Pedidos',       icon: <ClipboardList size={18} /> },
  { id: 'funcionarios', href: '/funcionarios',label: 'Quadro Fun.',   icon: <Users size={18} /> },
  { id: 'almoxarifado', href: '/almoxarifado',label: 'Almoxarifado',  icon: <Package size={18} /> },
  { id: 'brasil-hub',   href: '/brasil-hub',  label: 'Brasil Hub',    icon: <Globe size={18} /> },
];

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isDataLoaded, isSyncing, hasUnsavedChanges, lastSavedAt, isDark, setIsDark,
    hiddenTabs, handleLogout } = useAppContext();

  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Redireciona para login se não autenticado
  useEffect(() => {
    if (user === null) router.replace('/login');
  }, [user, router]);

  // Dark mode
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('ysoffice_dark', String(isDark));
  }, [isDark]);

  // Click outside profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fechar menu mobile ao mudar de rota
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Guard: aguarda carregamento do usuário e sincronização inicial
  if (user === undefined || user === null || !isDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-palette-lightest dark:bg-[#111111]">
        <LoadingPlaceholder />
      </div>
    );
  }

  // Abas visíveis
  const visibleNav = NAV_ITEMS.filter(item => !hiddenTabs.includes(item.id));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans">

      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm flex-shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left: Logo & Mobile Menu Toggle */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <Link href="/escritorio" className="flex items-center gap-2 group">
                <div className="w-9 h-9 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-gray-900 shadow-md group-hover:scale-105 transition-transform duration-200">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 0, 'wght' 400" }}>deployed_code</span>
                </div>
                <span className="font-bold text-xl tracking-tight hidden sm:block">LogB</span>
              </Link>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 overflow-x-auto no-scrollbar mx-4">
              {visibleNav.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 font-medium'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Sync Status (Hidden on very small screens) */}
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[11px] font-bold tracking-wide uppercase">
                {(isSyncing || hasUnsavedChanges) ? (
                  <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full border border-blue-100 dark:border-blue-800/50">
                    <RefreshCw size={12} className="animate-spin" /> Salvando
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50" title={lastSavedAt ? `Última sincronização: ${lastSavedAt}` : ''}>
                    <Check size={12} /> Sincronizado
                  </span>
                )}
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Alternar tema escuro/claro"
              >
                {isDark ? <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>light_mode</span> : <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dark_mode</span>}
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                >
                  <span className="text-sm font-semibold hidden md:block max-w-[100px] truncate">{user.nick}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden shadow-sm">
                    {user.photoUrl
                      ? <img src={user.photoUrl} alt={user.nick} className="w-full h-full object-cover" />
                      : <span className="material-symbols-outlined text-gray-600 dark:text-gray-300" style={{ fontSize: '18px' }}>person</span>
                    }
                  </div>
                </button>

                {/* Dropdown Menu */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-bold truncate">{user.nick}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email || 'Usuário do Sistema'}</p>
                    </div>
                    <div className="py-1">
                      {user.id !== 'demo_user_id' && !user.googleAccessToken && (
                        <button
                          onClick={() => { window.dispatchEvent(new CustomEvent('link-google')); setProfileOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"
                        >
                          <Cloud size={16} /> Vincular Google
                        </button>
                      )}
                      <Link
                        href="/configuracoes"
                        onClick={() => setProfileOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                      >
                        <Settings size={16} /> Configurações Gerais
                      </Link>
                    </div>
                    <div className="py-1 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => { handleLogout(); setProfileOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors font-medium"
                      >
                        <LogOut size={16} /> Encerrar Sessão
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
            <nav className="max-w-[1600px] mx-auto px-4 py-3 space-y-1">
              {visibleNav.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        <Suspense fallback={<LoadingPlaceholder />}>
          {children}
        </Suspense>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto flex-shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>deployed_code</span>
            LogB &copy; {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
            <span>Versão 1.2.0</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></span>
            <span className="flex items-center gap-1">
              Status: <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
