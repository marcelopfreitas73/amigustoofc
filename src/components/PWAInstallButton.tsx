import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';
import { Download, Share2, X, Smartphone, CheckCircle } from 'lucide-react';

interface Props {
  variant?: 'nav' | 'banner' | 'card';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone mode (installed), don't show prompt
  if (isInstalled) {
    return null;
  }

  if (variant === 'banner') {
    if (!isInstallable && !isIOS) return null;

    return (
      <div className="bg-emerald-950 text-emerald-50 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm border-b border-emerald-800/40">
        <div className="flex items-center gap-2 max-w-xl">
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Instale o <strong>A Mi Gusto</strong> no seu celular ou desktop para acessar seus pedidos instantaneamente.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isInstallable && (
            <button
              onClick={install}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar App
            </button>
          )}
          {isIOS && (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-semibold px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              Como Instalar
            </button>
          )}
        </div>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
        )}
      </div>
    );
  }

  // Nav button variant
  return (
    <>
      {isInstallable && (
        <button
          onClick={install}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
          title="Instalar aplicativo"
        >
          <Download className="w-3.5 h-3.5 text-emerald-300" />
          <span>Instalar App</span>
        </button>
      )}

      {isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-700/60 text-emerald-100 hover:bg-emerald-800/40 transition-all shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-300" />
          <span>Instalar no iPhone</span>
        </button>
      )}

      {showIOSGuide && (
        <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
      )}
    </>
  );
};

const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-stone-200 dark:border-stone-800 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center mb-4">
        <Smartphone className="w-6 h-6" />
      </div>

      <h3 className="text-lg font-bold text-stone-900 dark:text-white">
        Instalar no iPhone ou iPad
      </h3>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        Adicione à tela de início para acessar em tela cheia mesmo sem internet:
      </p>

      <div className="mt-4 space-y-3 text-xs text-stone-700 dark:text-stone-300">
        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50">
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
          <div>
            Toque no botão <strong>Compartilhar</strong> <span className="inline-block px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 font-mono text-[10px]">⎋ / [↑]</span> na barra inferior do Safari.
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50">
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
          <div>
            Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.
          </div>
        </div>
        <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/50">
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
          <div>
            Toque em <strong>Adicionar</strong> no canto superior direito para concluir.
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="mt-5 w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <CheckCircle className="w-4 h-4" />
        Entendi
      </button>
    </div>
  </div>
);
