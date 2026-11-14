import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import type { AppSettings } from '../types.js';

interface Props {
  settings: AppSettings;
}

export const FAQ: React.FC<Props> = ({ settings }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Como funciona o prazo e a taxa de entrega?',
      a: 'Nossas entregas acontecem sempre no dia útil seguinte à data da compra ou renovação do ciclo da assinatura. Levamos seu alho nobre triturado super fresco, refrigerado e pronto para consumo.',
    },
    {
      q: 'Qual a diferença entre Assinatura e Compra Avulsa?',
      a: 'Na assinatura você garante um desconto exclusivo em cada pote e recebe automaticamente na frequência escolhida (semanal, quinzenal ou mensal) sem se preocupar em pedir de novo. Na compra avulsa você faz um pedido único quando precisar.',
    },
    {
      q: 'Posso alterar a frequência ou o tamanho do meu pote?',
      a: 'Sim, a qualquer momento! Basta acessar a sua Área do Cliente ou enviar uma mensagem rápida no nosso WhatsApp de suporte.',
    },
    {
      q: 'Como ganho o pote de 500g grátis?',
      a: `Todo cliente tem um código exclusivo (ex: AMG001). A cada ${settings.goal || 10} amigos que se cadastrarem e fizerem um pedido usando seu código, você ganha automaticamente 1 pote de 500g de alho triturado 100% grátis. Você pode acompanhar o progresso em tempo real no seu painel.`,
    },
    {
      q: 'Como instalo o aplicativo no meu smartphone ou computador?',
      a: 'O A Mi Gusto é um PWA (Progressive Web App). Basta tocar no botão "Instalar App" no topo da página. No iPhone/iPad, toque no ícone de Compartilhar do Safari e selecione "Adicionar à Tela de Início". Funciona offline e sem ocupar memória de app store!',
    },
    {
      q: 'O alho tem conservantes químicos ou sódio adicionado?',
      a: 'Não! Nosso alho é 100% natural, selecionado dente por dente e triturado com apenas uma pitada mínima de sal marinho apenas para conservação natural das propriedades gastronômicas. Sem água, sem amido e sem conservantes artificiais.',
    },
  ];

  const waNumber = settings.whatsapp || '21999999999';
  const waUrl = `https://wa.me/55${waNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
    'Olá! Gostaria de tirar uma dúvida sobre o alho triturado A Mi Gusto.'
  )}`;

  return (
    <section id="faq" className="py-14 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white">
          Dúvidas Frequentes
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
          Tudo o que você precisa saber sobre nossos potes, assinaturas e entregas.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/80 overflow-hidden transition-all shadow-xs"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-stone-900 dark:text-white flex items-center justify-between gap-4"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-emerald-700 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed border-t border-stone-100 dark:border-stone-700/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* WhatsApp Help CTA */}
      <div className="mt-8 text-center">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
        >
          <MessageCircle className="w-4 h-4 text-emerald-300" />
          <span>Falar com a gente no WhatsApp</span>
        </a>
      </div>
    </section>
  );
};
