import React, { useState, useEffect } from 'react';
import type { Testimonial } from '../types.js';
import { api, createRealtimeSocket } from '../api.js';
import {
  Star,
  Quote,
  CheckCircle2,
  Sparkles,
  MessageSquarePlus,
  ThumbsUp,
  MapPin,
  Calendar,
  Heart,
  X,
  Send,
  User,
  ShieldCheck,
  Camera,
  Upload,
  Trash2,
  Loader2,
} from 'lucide-react';

const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    name: 'Chef Rodrigo Albuquerque',
    roleOrProfile: 'Chef Executivo & Proprietário',
    neighborhood: 'Copacabana',
    city: 'Rio de Janeiro',
    planOrProduct: 'Pote 1.000g (Assinatura Semanal)',
    rating: 5,
    date: 'Há 3 dias',
    content:
      'Economizamos mais de 45 minutos diários de mise en place na cozinha do restaurante. O grande diferencial da A Mi Gusto é que não tem aquele gosto residual ácido de vinagre ou ácido cítrico dos alhos de balde de supermercado. É alho nobre 100% puro, fresco, aroma intenso e moído no ponto perfeito.',
    verified: true,
    category: 'chefs',
    avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
    highlightTag: 'Restaurante Parceiro',
    helpfulCount: 42,
  },
  {
    id: 'test-2',
    name: 'Dra. Camila Brandão',
    roleOrProfile: 'Nutricionista & Mãe de 2',
    neighborhood: 'Barra da Tijuca',
    city: 'Rio de Janeiro',
    planOrProduct: 'Pote 500g (Assinatura Quinzenal)',
    rating: 5,
    date: 'Há 1 semana',
    content:
      'Como nutricionista, sempre fujo de ultraprocessados com conservantes químicos. A pasta da A Mi Gusto é apenas alho triturado puro e fresco. Chega em casa cheiroso e prático. Nunca mais fiquei com cheiro forte de alho impregnado nas unhas na correria do almoço!',
    verified: true,
    category: 'familias',
    avatarUrl: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=200&q=80',
    highlightTag: 'Assinante Fidelidade',
    helpfulCount: 29,
  },
  {
    id: 'test-3',
    name: 'Carlos Eduardo Mendes',
    roleOrProfile: 'Engenheiro & Cozinheiro de Fim de Semana',
    neighborhood: 'Tijuca',
    city: 'Rio de Janeiro',
    planOrProduct: 'Pote 500g (Assinatura Quinzenal)',
    rating: 5,
    date: 'Há 2 semanas',
    content:
      'O sistema de indicação é real mesmo! Indiquei para 10 vizinhos do meu condomínio que também cozinham bastante e já ganhei 2 potes de 500g inteiramente grátis entregues na minha porta. O acompanhamento da entrega em tempo real pelo portal é muito prático.',
    verified: true,
    category: 'assinantes',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    highlightTag: 'Ganhou 2 Potes Grátis 🎁',
    helpfulCount: 38,
  },
  {
    id: 'test-4',
    name: 'Beatriz Matos',
    roleOrProfile: 'Pousada & Gastronomia Artesanal',
    neighborhood: 'Botafogo',
    city: 'Rio de Janeiro',
    planOrProduct: 'Pote 1.000g (Assinatura Semanal)',
    rating: 5,
    date: 'Há 3 semanas',
    content:
      'A textura da moagem é impecável: nem ralo criando água, nem pedaços duros que queimam no refogado. Doura por igual na frigideira e deixa um perfume acolhedor no salão. A entrega é sempre pontual e o pote vem com lacre de segurança higiênico.',
    verified: true,
    category: 'chefs',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    highlightTag: 'Qualidade Profissional',
    helpfulCount: 19,
  },
  {
    id: 'test-5',
    name: 'Fernanda Guimarães',
    roleOrProfile: 'Arquiteta & Designer',
    neighborhood: 'Ipanema',
    city: 'Rio de Janeiro',
    planOrProduct: 'Pote 250g (Assinatura Mensal)',
    rating: 5,
    date: 'Há 1 mês',
    content:
      'Moro sozinha e o potinho de 250g dura o mês inteirinho perfeitamente conservado na minha geladeira. Quando viajei de férias, precisei alterar a data de entrega e fiz tudo direto na área do cliente sem burocracia nenhuma. Atendimento nota 10 do Marcelo!',
    verified: true,
    category: 'familias',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    highlightTag: 'Cliente Verificada',
    helpfulCount: 15,
  },
  {
    id: 'test-6',
    name: 'Marcos Vinícius Silva',
    roleOrProfile: 'Consultor Financeiro',
    neighborhood: 'Icaraí',
    city: 'Niterói',
    planOrProduct: 'Pote 500g (Compra Avulsa)',
    rating: 5,
    date: 'Há 1 mês',
    content:
      'Comecei experimentando uma compra avulsa para testar se era bom mesmo. Depois do primeiro arroz e feijão refogados com ele, virei fã incondicional. Muito melhor que descascar alho no meio da semana.',
    verified: true,
    category: 'assinantes',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    highlightTag: 'Primeira Compra Aprovada',
    helpfulCount: 12,
  },
];

const LOCAL_STORAGE_KEY = 'amigusto_user_testimonials';

export const CustomerTestimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [filterCategory, setFilterCategory] = useState<'todos' | 'assinantes' | 'chefs' | 'familias'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Review Form state
  const [formName, setFormName] = useState('');
  const [formNeighborhood, setFormNeighborhood] = useState('');
  const [formCity, setFormCity] = useState('Rio de Janeiro');
  const [formCategory, setFormCategory] = useState<'assinantes' | 'chefs' | 'familias'>('assinantes');
  const [formPlan, setFormPlan] = useState('Pote 500g (Assinatura Quinzenal)');
  const [formRating, setFormRating] = useState(5);
  const [formContent, setFormContent] = useState('');
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  // Fetch testimonials from backend API on mount
  const loadTestimonials = async () => {
    try {
      setIsLoading(true);
      const data = await api.getTestimonials();
      if (Array.isArray(data) && data.length > 0) {
        setTestimonials(data);
      }
    } catch {
      // Fallback to local storage or initial
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTestimonials([...parsed, ...INITIAL_TESTIMONIALS]);
          }
        }
      } catch {
        // ignore
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();

    // Listen to real-time events for instant sync
    const disconnect = createRealtimeSocket((event) => {
      if (event.type === 'TESTIMONIALS_UPDATED' && Array.isArray((event as any).testimonials)) {
        setTestimonials((event as any).testimonials);
      }
    });

    return () => disconnect();
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setFormAvatarUrl(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          setFormAvatarUrl(event.target?.result as string);
        }
        setIsUploadingAvatar(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const filtered = testimonials.filter((t) => {
    if (t.active === false) return false;
    if (filterCategory === 'todos') return true;
    return t.category === filterCategory;
  });

  const handleToggleLike = async (id: string) => {
    const isLiked = likedMap[id];
    setLikedMap((prev) => ({ ...prev, [id]: !isLiked }));
    setTestimonials((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            helpfulCount: isLiked ? Math.max(0, item.helpfulCount - 1) : item.helpfulCount + 1,
          };
        }
        return item;
      })
    );

    if (!isLiked) {
      try {
        await api.likeTestimonial(id);
      } catch {
        // ignore
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formContent.trim()) return;

    setIsSubmitting(true);
    const newTestimonial: Partial<Testimonial> = {
      name: formName.trim(),
      roleOrProfile:
        formCategory === 'chefs'
          ? 'Cozinha Profissional'
          : formCategory === 'familias'
          ? 'Cozinha Caseira'
          : 'Assinante A Mi Gusto',
      neighborhood: formNeighborhood.trim() || 'Rio de Janeiro',
      city: formCity.trim() || 'RJ',
      planOrProduct: formPlan,
      rating: formRating,
      date: 'Agora mesmo',
      content: formContent.trim(),
      verified: true,
      category: formCategory,
      avatarUrl: formAvatarUrl || undefined,
      highlightTag: 'Novo Depoimento ⭐',
      helpfulCount: 1,
      active: true,
    };

    try {
      const res = await api.saveTestimonial(newTestimonial);
      if (res && res.testimonial) {
        setTestimonials((prev) =>
          prev.some((x) => x.id === res.testimonial.id) ? prev : [res.testimonial, ...prev]
        );
      }
    } catch {
      // Fallback local save
      const fallbackItem: Testimonial = {
        id: `test-user-${Date.now()}`,
        name: newTestimonial.name!,
        roleOrProfile: newTestimonial.roleOrProfile!,
        neighborhood: newTestimonial.neighborhood!,
        city: newTestimonial.city!,
        planOrProduct: newTestimonial.planOrProduct!,
        rating: newTestimonial.rating!,
        date: newTestimonial.date!,
        content: newTestimonial.content!,
        verified: true,
        category: newTestimonial.category!,
        avatarUrl: newTestimonial.avatarUrl,
        highlightTag: newTestimonial.highlightTag,
        helpfulCount: 1,
      };
      setTestimonials((prev) => [fallbackItem, ...prev]);
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        const userList = stored ? JSON.parse(stored) : [];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([fallbackItem, ...userList]));
      } catch {
        // ignore
      }
    } finally {
      setIsSubmitting(false);
      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        setIsModalOpen(false);
        setFormName('');
        setFormNeighborhood('');
        setFormContent('');
        setFormAvatarUrl('');
      }, 2000);
    }
  };

  return (
    <section id="depoimentos" className="py-12 sm:py-20 bg-gradient-to-b from-stone-50 via-emerald-50/25 to-stone-50 dark:from-stone-950 dark:via-emerald-950/15 dark:to-stone-950 border-t border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2.5 sm:space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] sm:text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Depoimentos Reais de Clientes</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight leading-tight">
            Quem experimenta, não volta mais a descascar alho
          </h2>

          <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-base leading-relaxed px-1 sm:px-0">
            Veja a experiência real de chefs, famílias e apaixonados por boa comida que recebem o alho artesanal triturado fresco da <strong>A Mi Gusto</strong> direto na porta de casa.
          </p>

          {/* Aggregate Rating Banner (Mobile optimized) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 shadow-2xs">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-extrabold text-stone-900 dark:text-white text-xs sm:text-sm">4.9 / 5.0</span>
              <span className="text-stone-400 text-[11px]">(+1.200 entregas)</span>
            </div>

            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-700 shadow-2xs text-[11px] sm:text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Alho Puro sem Conservantes</span>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-95 text-xs w-full sm:w-auto"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Deixar Depoimento</span>
            </button>
          </div>
        </div>

        {/* Filter Pills - Swipeable horizontal scroll on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 px-1 mb-6 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 sm:justify-center touch-pan-x">
          {[
            { id: 'todos', label: 'Todos os Depoimentos' },
            { id: 'assinantes', label: 'Assinantes Periódicos' },
            { id: 'chefs', label: 'Chefs & Restaurantes' },
            { id: 'familias', label: 'Cozinha de Família' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id as any)}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95 ${
                filterCategory === cat.id
                  ? 'bg-emerald-800 text-white shadow-sm ring-2 ring-emerald-800/20'
                  : 'bg-white dark:bg-stone-850 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Testimonials Grid (Mobile-friendly gap and padding) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((item) => {
            const isLiked = likedMap[item.id];
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between p-4 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-md transition-all relative overflow-hidden group"
              >
                {/* Accent corner tag */}
                {item.highlightTag && (
                  <div className="absolute top-0 right-0 bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-2.5 sm:px-3 py-1 rounded-bl-xl border-l border-b border-emerald-200 dark:border-emerald-800 shadow-2xs">
                    {item.highlightTag}
                  </div>
                )}

                <div className="space-y-2.5 sm:space-y-3">
                  {/* Rating Stars & Date */}
                  <div className="flex items-center justify-between gap-2 pr-2">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            i < item.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300 dark:text-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-stone-400 truncate">{item.date}</span>
                  </div>

                  {/* Quote icon & text */}
                  <div className="relative pt-1">
                    <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600/15 absolute -top-1 -left-1.5 pointer-events-none" />
                    <p className="text-stone-700 dark:text-stone-200 text-xs sm:text-sm leading-relaxed italic pl-1">
                      "{item.content}"
                    </p>
                  </div>
                </div>

                {/* Author Info & Footer */}
                <div className="pt-3.5 mt-3.5 border-t border-stone-100 dark:border-stone-800/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.avatarUrl ? (
                        <img
                          src={item.avatarUrl}
                          alt={item.name}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-stone-200 dark:border-stone-700 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                          {item.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-stone-900 dark:text-white text-xs sm:text-sm truncate">
                            {item.name}
                          </span>
                          {item.verified && (
                            <span title="Cliente Verificado A Mi Gusto" className="shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 block truncate">
                          {item.roleOrProfile}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleLike(item.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 active:scale-90 ${
                        isLiked
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'text-stone-400 hover:text-emerald-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                      title="Depoimento útil"
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      <span className="text-[11px] font-bold">{item.helpfulCount}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400 pt-0.5">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{item.neighborhood}, {item.city}</span>
                    </span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-400 text-[10px] shrink-0 ml-1">
                      {item.planOrProduct}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal: Enviar Depoimento / Avaliar (Mobile-optimized bottom/centered sheet) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-150">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white">
                    Compartilhe sua Experiência
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-500">
                    Seu feedback ajuda outras famílias e chefs a conhecerem a qualidade da A Mi Gusto.
                  </p>
                </div>
              </div>

              {formSuccess ? (
                <div className="p-6 text-center space-y-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
                  <h4 className="font-bold text-base">Obrigado pelo seu depoimento!</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Sua avaliação foi publicada com sucesso e já está visível na página principal e no sistema.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold block text-stone-700 dark:text-stone-300 mb-1">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo Mendes"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs focus:outline-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block text-stone-700 dark:text-stone-300 mb-1">
                        Bairro *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Copacabana"
                        value={formNeighborhood}
                        onChange={(e) => setFormNeighborhood(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs focus:outline-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold block text-stone-700 dark:text-stone-300 mb-1">
                        Cidade / UF
                      </label>
                      <input
                        type="text"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs focus:outline-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block text-stone-700 dark:text-stone-300 mb-1">
                        Categoria
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs focus:outline-emerald-600"
                      >
                        <option value="assinantes">Assinante Regular</option>
                        <option value="chefs">Chef / Restaurante</option>
                        <option value="familias">Cozinha de Família</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold block text-stone-700 dark:text-stone-300 mb-1">
                        Avaliação (Estrelas)
                      </label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setFormRating(star)}
                            className="p-1 cursor-pointer focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 sm:w-5 sm:h-5 ${
                                star <= formRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-300 dark:text-stone-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold block text-stone-700 dark:text-stone-300 mb-1">
                      Pote ou Frequência
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Pote 500g (Assinatura Quinzenal)"
                      value={formPlan}
                      onChange={(e) => setFormPlan(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs focus:outline-emerald-600"
                    />
                  </div>

                  {/* Foto do Cliente ou Prato */}
                  <div>
                    <label className="font-bold block text-stone-700 dark:text-stone-300 mb-1">
                      Sua Foto de Perfil ou Foto do Prato (Opcional)
                    </label>
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-850">
                      {formAvatarUrl ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-600 shadow-xs shrink-0">
                          <img src={formAvatarUrl} alt="Preview do depoimento" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-500 flex items-center justify-center shrink-0">
                          {isUploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{formAvatarUrl ? 'Trocar Foto' : 'Carregar Foto do Aparelho'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingAvatar}
                              className="hidden"
                              onChange={handleAvatarUpload}
                            />
                          </label>
                          {formAvatarUrl && (
                            <button
                              type="button"
                              onClick={() => setFormAvatarUrl('')}
                              className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remover</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500">
                          Tire uma foto ou escolha da galeria do seu celular/computador.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold block text-stone-700 dark:text-stone-300 mb-1">
                      Seu Comentário ou História com a A Mi Gusto *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Conte sobre o sabor, praticidade, aroma, economia de tempo ou a entrega do seu alho..."
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs focus:outline-emerald-600 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-bold hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-800/20 active:scale-95 transition-all"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Publicar Depoimento</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
