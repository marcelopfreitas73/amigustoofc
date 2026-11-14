import React, { useState, useEffect, useRef } from 'react';
import type { PartnerBanner } from '../types.js';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Handshake,
  Sparkles,
  Store,
  Utensils,
  Smartphone,
  Monitor,
} from 'lucide-react';

interface Props {
  partners?: PartnerBanner[];
  whatsapp?: string;
  onOpenPartnership?: () => void;
}

export const PartnersBannerSection: React.FC<Props> = ({
  partners = [],
  whatsapp = '21999999999',
  onOpenPartnership,
}) => {
  const activePartners = partners.filter(p => p.active !== false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-advance slider if more than 1 banner
  useEffect(() => {
    if (activePartners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activePartners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activePartners.length]);

  if (activePartners.length === 0) {
    return (
      <section className="py-12 bg-linear-to-b from-stone-100 to-stone-50 dark:from-stone-900 dark:to-stone-950 border-y border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-stone-900 to-stone-950 text-white p-8 sm:p-12 border border-emerald-800/40 shadow-xl text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-500/30">
              <Handshake className="w-4 h-4" />
              <span>Espaço de Empresas Parceiras</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold max-w-2xl mx-auto">
              Divulgue a Sua Empresa Aqui na A Mi Gusto
            </h3>
            <p className="text-stone-300 text-sm sm:text-base max-w-xl mx-auto mt-3 leading-relaxed">
              Você é nosso cliente e tem um negócio, comércio ou presta algum serviço? Nós divulgamos a sua empresa em destaque na nossa página principal por um valor simbólico de apenas <strong>R$ 100,00 por 3 meses inteiros</strong>.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Olá Marcelo! Sou cliente da A Mi Gusto e gostaria de divulgar minha empresa aqui no site pela parceria de 3 meses por R$ 100,00!')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
              >
                <Handshake className="w-4 h-4" />
                <span>Quero Divulgar Minha Empresa (R$ 100 / 3 Meses)</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = activePartners[currentIndex] || activePartners[0];

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + activePartners.length) % activePartners.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % activePartners.length);
  };

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <section className="py-10 sm:py-14 bg-stone-100/60 dark:bg-stone-900/40 border-y border-stone-200/80 dark:border-stone-800/80 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Section Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Handshake className="w-3.5 h-3.5 text-emerald-700" />
              <span>Vitrine de Empresas Parceiras</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
              Negócios & Serviços da Nossa Comunidade
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-xl">
              Conheça as empresas e profissionais de clientes da A Mi Gusto. Você também é nosso cliente e tem um negócio? Divulgue sua marca aqui por apenas R$ 100 por 3 meses!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Olá Marcelo! Sou cliente da A Mi Gusto e gostaria de saber mais sobre a divulgação da minha empresa por R$ 100 (3 meses).')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1.5 transition-colors bg-white dark:bg-stone-800 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Divulgue sua Empresa (R$ 100 / 3 meses)</span>
            </a>

            {activePartners.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-750 shadow-xs transition-colors"
                  aria-label="Banner anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-750 shadow-xs transition-colors"
                  aria-label="Próximo banner"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Responsive Banner Card */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-stone-300/80 dark:border-stone-800 bg-stone-950 group min-h-[320px] sm:min-h-[420px] flex items-end">
          {/* Media Background: Video or Image */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {currentBanner.mediaType === 'video' ? (
              <video
                key={currentBanner.mediaUrl}
                ref={videoRef}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover object-center transition-all duration-700"
              >
                {/* On mobile screens, if mobileMediaUrl exists, use it */}
                {currentBanner.mobileMediaUrl && (
                  <source src={currentBanner.mobileMediaUrl} media="(max-width: 640px)" />
                )}
                <source src={currentBanner.mediaUrl} />
                Seu navegador não suporta vídeos.
              </video>
            ) : (
              <picture>
                {currentBanner.mobileMediaUrl && (
                  <source media="(max-width: 640px)" srcSet={currentBanner.mobileMediaUrl} />
                )}
                <img
                  src={currentBanner.mediaUrl}
                  alt={currentBanner.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
              </picture>
            )}

            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />
          </div>

          {/* Video controls if video */}
          {currentBanner.mediaType === 'video' && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={toggleVideoPlayback}
                className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                title={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                title={isMuted ? 'Ativar som' : 'Silenciar'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Banner Content Details */}
          <div className="relative z-10 p-6 sm:p-10 w-full max-w-3xl space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {currentBanner.badge && (
                <span className="px-3 py-1 rounded-full bg-emerald-600/90 text-white text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 backdrop-blur-xs">
                  <Store className="w-3 h-3" />
                  <span>{currentBanner.badge}</span>
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-xs">
                {currentBanner.partnerName}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-200 text-[10px] font-bold backdrop-blur-xs border border-amber-400/30">
                Parceria de 3 Meses
              </span>
            </div>

            <h3 className="text-xl sm:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-md">
              {currentBanner.title}
            </h3>

            {currentBanner.description && (
              <p className="text-stone-200 text-xs sm:text-base max-w-2xl line-clamp-2 sm:line-clamp-none drop-shadow-sm font-medium">
                {currentBanner.description}
              </p>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {currentBanner.linkUrl && (
                <a
                  href={currentBanner.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  <span>{currentBanner.buttonText || 'Conhecer Parceiro'}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <a
                href={`https://wa.me/55${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá Marcelo! Vi o banner do parceiro "${currentBanner.partnerName}" no site e gostaria de saber mais!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white backdrop-blur-md font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors border border-white/20"
              >
                <Handshake className="w-4 h-4 text-emerald-400" />
                <span>Conversar com a A Mi Gusto</span>
              </a>
            </div>
          </div>

          {/* Dots Indicator */}
          {activePartners.length > 1 && (
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 z-20 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
              {activePartners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-6 bg-emerald-400' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Ir para slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
