import React from 'react';
import { PWAInstallButton } from './PWAInstallButton.js';
import { User, Shield, Menu, X } from 'lucide-react';

interface Props {
  onOpenClientPortal: () => void;
  onOpenOwnerPortal: () => void;
  activeClientCode?: string | null;
  activeClientName?: string | null;
}

export const Navbar: React.FC<Props> = ({
  onOpenClientPortal,
  onOpenOwnerPortal,
  activeClientCode,
  activeClientName,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { label: 'Produtos', href: '#produtos' },
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Depoimentos', href: '#depoimentos' },
    { label: 'Indique e Ganhe', href: '#indique' },
    { label: 'Dúvidas', href: '#faq' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-16 sm:h-22 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <a href="#" className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 group min-w-0">
          <img
            src="/logo.png"
            alt="Logo A Mi Gusto"
            className="w-11 h-11 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-emerald-800/25 shadow-sm group-hover:scale-105 transition-transform shrink-0"
            onError={(e) => {
              // Fallback to SVG icon if logo.png is not loaded
              (e.target as HTMLImageElement).src = '/icon.svg';
            }}
          />
          <span className="text-lg sm:text-2xl font-black tracking-tight text-emerald-950 dark:text-emerald-100 whitespace-nowrap truncate">
            A Mi Gusto
          </span>
        </a>

        {/* Zone 2: Single-line Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600 dark:text-stone-300">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Actions (PWA install + Client Portal) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <PWAInstallButton variant="nav" />

          <button
            onClick={onOpenClientPortal}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs whitespace-nowrap ${
              activeClientCode
                ? 'bg-emerald-800 text-white hover:bg-emerald-700'
                : 'bg-emerald-700 text-white hover:bg-emerald-600'
            }`}
          >
            <User className="w-4 h-4 text-emerald-200" />
            <span>
              {activeClientCode
                ? `${activeClientName ? activeClientName.split(' ')[0] : activeClientCode}`
                : 'Área do Cliente'}
            </span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 pt-2 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenOwnerPortal();
              }}
              className="flex items-center gap-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 py-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Painel do Dono</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
