import React from 'react';
import { Sparkles, Truck, Gift, Check, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  onStartRegistration: () => void;
  onOpenClientPortal: () => void;
}

export const Hero: React.FC<Props> = ({ onStartRegistration, onOpenClientPortal }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-14 md:pt-14 md:pb-20 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-b from-stone-50 via-stone-50 to-emerald-950/5 dark:from-stone-900 dark:via-stone-900 dark:to-emerald-950/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Alho Nobre Selecionado · 100% Natural · Sem Conservantes</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-white leading-[1.15]">
              Alho fresco triturado, puro e entregue na porta da sua casa.
            </h1>

            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-xl leading-relaxed">
              Praticidade real no dia a dia com sabor de alho recém-descascado. Potes artesanais de <strong>250g</strong>, <strong>500g</strong> e <strong>1kg</strong>. 
              Assine com desconto ou peça avulso quando quiser.
            </p>

            {/* Quick Benefits Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 pb-2">
              <div className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
                <Truck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>Entrega no dia seguinte à compra</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>Puro alho triturado, 0% sódio ou químicos</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300">
                <Gift className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>Indique amigos e ganhe 500g grátis</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onStartRegistration}
                className="px-6 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-98"
              >
                <span>Quero ser cliente</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenClientPortal}
                className="px-5 py-3.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-emerald-700 text-stone-800 dark:text-stone-200 font-semibold text-sm transition-all hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
              >
                Já sou cliente / Entrar
              </button>
            </div>
          </div>

          {/* Right Column: Visual Product Showcase */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-800/80 p-6 shadow-xl border border-stone-200/80 dark:border-stone-700/80 backdrop-blur-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

              <div className="flex flex-col items-center text-center">
                <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-emerald-50 dark:bg-emerald-950/40 p-4 flex items-center justify-center border-3 border-emerald-800/30 shadow-lg mb-4 relative">
                  <img
                    src="/logo.png"
                    alt="Pote A Mi Gusto Alho Triturado"
                    className="w-full h-full object-contain drop-shadow-md rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icon.svg';
                    }}
                  />
                  <span className="absolute -bottom-1 bg-emerald-700 text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                    100% Artesanal
                  </span>
                </div>

                <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                  A Mi Gusto Gastronomia
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Direto dos melhores produtores para a sua cozinha
                </p>

                {/* Highlights pill-free specs */}
                <div className="mt-5 w-full grid grid-cols-3 gap-2 text-center text-xs border-t border-b border-stone-100 dark:border-stone-700/60 py-3">
                  <div>
                    <span className="block font-bold text-stone-900 dark:text-white text-sm">250g</span>
                    <span className="text-[11px] text-stone-500">Individual</span>
                  </div>
                  <div>
                    <span className="block font-bold text-emerald-800 dark:text-emerald-400 text-sm">500g</span>
                    <span className="text-[11px] text-stone-500">Mais pedido</span>
                  </div>
                  <div>
                    <span className="block font-bold text-stone-900 dark:text-white text-sm">1kg</span>
                    <span className="text-[11px] text-stone-500">Econômico</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between w-full text-xs text-stone-600 dark:text-stone-300">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Sem conservantes
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Pronta entrega
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
