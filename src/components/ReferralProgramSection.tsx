import React from 'react';
import { Gift, Users, Award, Sparkles } from 'lucide-react';

interface Props {
  goal: number;
  onStartRegistration: () => void;
  onOpenClientPortal: () => void;
}

export const ReferralProgramSection: React.FC<Props> = ({
  goal,
  onStartRegistration,
  onOpenClientPortal,
}) => {
  return (
    <section id="indique" className="py-14 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-stone-900 text-white p-7 sm:p-12 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-900/60 px-3 py-1 rounded-lg border border-emerald-700/50">
              <Gift className="w-3.5 h-3.5" />
              <span>Programa de Recompensas</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Indique e Ganhe potes de 500g totalmente grátis! 🧄
            </h2>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-xl">
              Assim que você se cadastra, você recebe seu próprio código exclusivo (como <strong>AMG001</strong>). 
              A cada <strong>{goal} amigos ou vizinhos</strong> que usarem seu código no primeiro pedido, você ganha <strong>1 pote de 500g de alho triturado sem nenhum custo</strong>!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-emerald-900/40 border border-emerald-700/30 rounded-2xl p-4">
                <Users className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="block text-xl font-bold text-white">{goal} Amigos</span>
                <span className="text-xs text-emerald-200">Indicações para 1 pote</span>
              </div>
              <div className="bg-emerald-900/40 border border-emerald-700/30 rounded-2xl p-4">
                <Award className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="block text-xl font-bold text-white">500g Grátis</span>
                <span className="text-xs text-emerald-200">Enviado com carinho</span>
              </div>
              <div className="bg-emerald-900/40 border border-emerald-700/30 rounded-2xl p-4">
                <Sparkles className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="block text-xl font-bold text-white">Sem Limites</span>
                <span className="text-xs text-emerald-200">Ganhe sempre que indicar</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                onClick={onStartRegistration}
                className="px-6 py-3 rounded-xl bg-white text-emerald-950 font-bold text-sm hover:bg-emerald-50 transition-colors shadow-md active:scale-98"
              >
                Cadastre-se para pegar seu código
              </button>
              <button
                onClick={onOpenClientPortal}
                className="px-5 py-3 rounded-xl border border-emerald-700 text-emerald-100 hover:text-white font-semibold text-sm hover:bg-emerald-800/40 transition-colors"
              >
                Ver meu progresso de indicações
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 bg-emerald-950/60 border border-emerald-700/40 rounded-2xl p-6 text-center space-y-4">
            <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider block">
              Exemplo de Progresso
            </span>
            <div className="text-3xl font-mono font-extrabold text-white">
              AMG042
            </div>
            <div className="w-full bg-emerald-900/80 rounded-full h-3 overflow-hidden p-0.5 border border-emerald-700/50">
              <div className="bg-gradient-to-r from-emerald-400 to-emerald-200 h-full rounded-full transition-all" style={{ width: '70%' }} />
            </div>
            <p className="text-xs text-emerald-200">
              7 de 10 indicações · Faltam apenas <strong>3 amigos</strong> para o próximo pote grátis!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
