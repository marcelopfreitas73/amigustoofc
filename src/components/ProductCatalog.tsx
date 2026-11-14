import React, { useState } from 'react';
import type { AppSettings } from '../types.js';
import { Check, Repeat, ShoppingCart } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onSelectProduct: (size: '250' | '500' | '1000', type: 'assinatura' | 'avulsa') => void;
}

export const ProductCatalog: React.FC<Props> = ({ settings, onSelectProduct }) => {
  const [purchaseType, setPurchaseType] = useState<'assinatura' | 'avulsa'>('assinatura');

  const products: {
    size: '250' | '500' | '1000';
    label: string;
    sublabel: string;
    description: string;
    servings: string;
    popular?: boolean;
  }[] = [
    {
      size: '250',
      label: '250g',
      sublabel: 'Pote Pequeno',
      description: 'Ideal para solteiros ou casais que cozinham moderadamente e querem alho fresco sempre à mão.',
      servings: 'Rende aprox. 25 a 35 preparações',
    },
    {
      size: '500',
      label: '500g',
      sublabel: 'Pote Médio (Mais Popular)',
      description: 'O tamanho campeão das famílias. Equilíbrio perfeito entre volume, rendimento e durabilidade na geladeira.',
      servings: 'Rende aprox. 60 preparações',
      popular: true,
    },
    {
      size: '1000',
      label: '1kg (1.000g)',
      sublabel: 'Pote Grande Família / Gourmet',
      description: 'Máxima economia por grama. Excelente para quem cozinha todos os dias, marmitas fit ou pequenos negócios.',
      servings: 'Rende mais de 120 preparações',
    },
  ];

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <section id="produtos" className="py-14 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
          Nossos Potes de Alho Triturado
        </h2>
        <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300">
          Alho premium triturado puro com uma pitada de sal marinho apenas para conservação natural. 
          Escolha o modelo que melhor se adapta à sua rotina:
        </p>

        {/* Plan Mode Selector Tabs */}
        <div className="flex flex-col sm:inline-flex sm:flex-row p-1 bg-stone-200/70 dark:bg-stone-800 rounded-xl mt-4 w-full sm:w-auto gap-1 sm:gap-0">
          <button
            onClick={() => setPurchaseType('assinatura')}
            className={`px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              purchaseType === 'assinatura'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-700 dark:text-stone-300 hover:text-stone-900'
            }`}
          >
            <Repeat className="w-4 h-4 shrink-0" />
            <span>Assinatura (Menor preço)</span>
          </button>
          <button
            onClick={() => setPurchaseType('avulsa')}
            className={`px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              purchaseType === 'avulsa'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-700 dark:text-stone-300 hover:text-stone-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>Compra Avulsa (Pedido único)</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {products.map((item) => {
          const subPrice = settings.prices[item.size] || 0;
          const avPrice = settings.avulsoPrices[item.size] || 0;
          const currentPrice = purchaseType === 'assinatura' ? subPrice : avPrice;
          const savings = avPrice - subPrice;

          return (
            <div
              key={item.size}
              className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative bg-white dark:bg-stone-800/90 border ${
                item.popular
                  ? 'border-emerald-700 dark:border-emerald-600 shadow-xl ring-2 ring-emerald-700/20'
                  : 'border-stone-200 dark:border-stone-700 shadow-sm hover:shadow-md'
              }`}
            >
              {item.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[11px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                  Mais Escolhido
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-700/60 pb-4 mb-4">
                  <div>
                    <h3 className="text-2xl font-extrabold text-stone-900 dark:text-white">
                      {item.label}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {item.sublabel}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                    100% Puro
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed min-h-[50px]">
                  {item.description}
                </p>

                <div className="mt-4 mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 tabular-nums">
                      {formatBRL(currentPrice)}
                    </span>
                    <span className="text-xs text-stone-500">
                      {purchaseType === 'assinatura' ? '/ por entrega' : 'pagamento único'}
                    </span>
                  </div>

                  {purchaseType === 'assinatura' && savings > 0 && (
                    <div className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Economize {formatBRL(savings)} por pote comparado à compra avulsa
                    </div>
                  )}

                  <div className="mt-3 text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item.servings}</span>
                  </div>
                </div>
              </div>

              <div>
                <button
                  onClick={() => onSelectProduct(item.size, purchaseType)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98 ${
                    item.popular
                      ? 'bg-emerald-800 hover:bg-emerald-700 text-white'
                      : 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600 text-white'
                  }`}
                >
                  <span>{purchaseType === 'assinatura' ? 'Assinar este pote' : 'Pedir avulso'}</span>
                </button>

                <p className="text-[11px] text-center text-stone-400 dark:text-stone-500 mt-2">
                  {purchaseType === 'assinatura'
                    ? 'Receba semanal, quinzenal ou mensalmente'
                    : 'Entrega rápida no dia útil seguinte'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
