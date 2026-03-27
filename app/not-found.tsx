import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-palette-lightest dark:bg-[#111111] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-gray-900 dark:bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <span className="text-white dark:text-gray-900 font-black text-4xl">404</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Página não encontrada</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">
          A página que você tentou acessar não existe ou foi removida.
          Verifique a URL ou volte ao início.
        </p>
        <Link
          href="/escritorio"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>home</span>
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
