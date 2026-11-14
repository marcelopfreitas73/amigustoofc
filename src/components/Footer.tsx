import React from 'react';
import { Shield } from 'lucide-react';

interface Props {
  onOpenOwnerPortal: () => void;
  onOpenClientPortal: () => void;
}

export const Footer: React.FC<Props> = ({ onOpenOwnerPortal, onOpenClientPortal }) => {
  return (
    <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-10 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="A Mi Gusto"
            className="w-10 h-10 rounded-full object-cover border border-emerald-800/20 shadow-xs"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/icon.svg';
            }}
          />
          <span className="font-semibold text-stone-800 dark:text-stone-200">
            © {new Date().getFullYear()} A Mi Gusto · Alho 100% Natural, Triturado & Entregue
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <button
            onClick={onOpenClientPortal}
            className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
          >
            Área do Cliente
          </button>

          <a href="#produtos" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">
            Nossos Potes
          </a>

          <a href="#como-funciona" className="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors">
            Como Funciona
          </a>

          <button
            onClick={onOpenOwnerPortal}
            className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Área do Dono</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
