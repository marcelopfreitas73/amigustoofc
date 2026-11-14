import React from 'react';
import { Package, CalendarClock, Truck, Gift } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Escolha o Pote',
      desc: 'Selecione entre 250g, 500g ou 1kg de puro alho triturado, fresco e aromático.',
      icon: Package,
    },
    {
      num: '02',
      title: 'Defina a Frequência',
      desc: 'Na assinatura com desconto, escolha receber toda semana, a cada 15 dias ou uma vez por mês.',
      icon: CalendarClock,
    },
    {
      num: '03',
      title: 'Entrega Rápida',
      desc: 'A entrega acontece sempre no dia útil seguinte à data da compra ou do ciclo da assinatura.',
      icon: Truck,
    },
    {
      num: '04',
      title: 'Indique e Ganhe',
      desc: 'Compartilhe seu código com amigos. A cada 10 cadastros, você ganha 1 pote de 500g grátis.',
      icon: Gift,
    },
  ];

  return (
    <section id="como-funciona" className="py-14 sm:py-20 bg-stone-100/60 dark:bg-stone-900/60 border-t border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
            Sem Complicação
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white mt-1">
            Como Funciona o A Mi Gusto
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-2">
            Um modelo pensado para você nunca mais ter que descascar ou picar alho na hora de cozinhar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.num}
                className="rounded-2xl bg-white dark:bg-stone-800 p-6 border border-stone-200/80 dark:border-stone-700/80 shadow-xs hover:shadow-md transition-shadow relative"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black text-stone-200 dark:text-stone-700">
                    {st.num}
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white mb-1.5">
                  {st.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
