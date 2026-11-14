import React, { useState, useEffect } from 'react';
import type { AppSettings, Client } from '../types.js';
import { api } from '../api.js';
import {
  X,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Clock,
  DollarSign,
  MessageCircle,
  Share2,
  Mail,
  Key,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  initialSize?: '250' | '500' | '1000';
  initialType?: 'assinatura' | 'avulsa';
  initialReferralCode?: string;
  onSuccess: (client: Client, plainPassword: string) => void;
}

export const ClientRegistrationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  initialSize = '500',
  initialType = 'assinatura',
  initialReferralCode = '',
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [num, setNum] = useState('');
  const [comp, setComp] = useState('');
  const [bairro, setBairro] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [email, setEmail] = useState('');
  const [wpp, setWpp] = useState('');

  const [type, setType] = useState<'assinatura' | 'avulsa'>(initialType);
  const [size, setSize] = useState<'250' | '500' | '1000'>(initialSize);
  const [freq, setFreq] = useState<number>(2); // 4 = semanal, 2 = quinzenal, 1 = mensal
  const [pdate, setPdate] = useState(new Date().toISOString().slice(0, 10));
  const [ref, setRef] = useState(initialReferralCode);
  const [notes, setNotes] = useState('');

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdResult, setCreatedResult] = useState<{ client: Client; plainPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPixEarly, setCopiedPixEarly] = useState(false);
  const [isMarkingPaymentSent, setIsMarkingPaymentSent] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [paymentSentSuccess, setPaymentSentSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setSize(initialSize);
      if (initialReferralCode) {
        setRef(initialReferralCode);
      }
      setErrorMsg('');
      setCreatedResult(null);
      setPaymentSentSuccess(false);
      setIsMarkingPaymentSent(false);
      setCopiedShareLink(false);
    }
  }, [isOpen, initialSize, initialType, initialReferralCode]);

  if (!isOpen) return null;

  // Phone mask: (XX) XXXXX-XXXX
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) {
      setWpp(raw.length ? `(${raw}` : '');
    } else if (raw.length <= 7) {
      setWpp(`(${raw.slice(0, 2)}) ${raw.slice(2)}`);
    } else {
      setWpp(`(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`);
    }
  };

  // CEP mask & auto-lookup
  const handleCepChange = async (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    const masked = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw;
    setCep(masked);

    if (raw.length === 8) {
      setIsLoadingCep(true);
      setErrorMsg('');
      try {
        const res = await api.lookupCEP(raw);
        if (res.street) setStreet(res.street);
        if (res.bairro) setBairro(res.bairro);
        if (res.city) setCity(res.city);
        if (res.uf) setUf(res.uf);
      } catch (err: unknown) {
        console.warn('CEP lookup error:', err);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  const getUnitPrice = () => {
    return type === 'avulsa'
      ? settings.avulsoPrices[size] || 0
      : settings.prices[size] || 0;
  };

  const getMonthlyPotsCount = () => {
    if (type === 'avulsa') return 1;
    return freq; // 4 = semanal, 2 = quinzenal, 1 = mensal
  };

  const getTotalToPay = () => {
    return getUnitPrice() * getMonthlyPotsCount();
  };

  const getFrequencyLabel = () => {
    if (type === 'avulsa') return 'Compra Avulsa (única)';
    if (freq === 4) return 'Semanal (4 potes no mês)';
    if (freq === 2) return 'Quinzenal (2 potes no mês)';
    return 'Mensal (1 pote no mês)';
  };

  const getDeliveryDate = () => {
    if (!pdate) return '';
    const d = new Date(pdate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('pt-BR');
  };

  const handleMarkPaymentSent = async () => {
    if (!createdResult) return;
    setIsMarkingPaymentSent(true);
    try {
      const res = await api.confirmPaymentSent(createdResult.client.code);
      setCreatedResult({
        ...createdResult,
        client: res.client,
      });
      setPaymentSentSuccess(true);
      onSuccess(res.client, createdResult.plainPassword);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao confirmar pagamento');
    } finally {
      setIsMarkingPaymentSent(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || name.trim().split(/\s+/).length < 2) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }
    if (!birth) {
      setErrorMsg('Informe sua data de nascimento.');
      return;
    }
    if (cep.replace(/\D/g, '').length !== 8) {
      setErrorMsg('CEP inválido (necessário 8 dígitos).');
      return;
    }
    if (!street.trim() || !num.trim() || !bairro.trim() || !city.trim() || !uf) {
      setErrorMsg('Preencha todos os campos do endereço (Rua, Número, Bairro, Cidade e UF).');
      return;
    }
    if (wpp.replace(/\D/g, '').length < 10) {
      setErrorMsg('Informe um número de WhatsApp válido com DDD.');
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        birth,
        cep: cep.trim(),
        street: street.trim(),
        num: num.trim(),
        comp: comp.trim(),
        bairro: bairro.trim(),
        city: city.trim(),
        uf: uf.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        wpp: wpp.trim(),
        type,
        size,
        freq: type === 'avulsa' ? 0 : freq,
        status: 'Aguardando Pagamento' as const,
        pdate,
        ref: ref ? ref.trim().toUpperCase() : '',
        notes: notes.trim(),
      };

      const res = await api.createClient(payload);
      setCreatedResult(res);
      onSuccess(res.client, res.plainPassword);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao cadastrar. Verifique os dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAccess = () => {
    if (!createdResult) return;
    const text = `Meu Acesso A Mi Gusto:\nCódigo: ${createdResult.client.code}\nSenha: ${createdResult.plainPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const UFs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8 relative">
        {/* Header */}
        <div className="px-6 py-5 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white">
              {createdResult ? 'Confirmação de Pagamento via PIX 🧄' : 'Quero Ser Cliente A Mi Gusto'}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {createdResult
                ? 'Efetue a transferência PIX e confirme o pagamento para liberar suas entregas'
                : 'Preencha seus dados para receber o alho fresco na sua casa'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIX Payment Confirmation Step */}
        {createdResult ? (() => {
          const crUnitPrice = createdResult.client.type === 'avulsa'
            ? (settings.avulsoPrices[createdResult.client.size] || 0)
            : (settings.prices[createdResult.client.size] || 0);
          const crPotsInMonth = createdResult.client.type === 'avulsa' ? 1 : (createdResult.client.freq || 1);
          const crTotalToPay = crUnitPrice * crPotsInMonth;
          const crFreqDesc = createdResult.client.type === 'avulsa'
            ? 'Compra Avulsa (única)'
            : createdResult.client.freq === 4
            ? 'Semanal (4 potes no mês)'
            : createdResult.client.freq === 2
            ? 'Quinzenal (2 potes no mês)'
            : 'Mensal (1 pote no mês)';
          const crIsAwaitingValidation = createdResult.client.status === 'Aguardando Validação' || paymentSentSuccess;

          return (
            <div className="p-6 sm:p-8 space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-stone-900 dark:text-white">
                  Cadastro Salvo, {(createdResult.client.name || '').split(' ')[0]}!
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-md mx-auto">
                  A Mi Gusto trabalha com o modelo <strong>Pague Primeiro</strong>. Realize o PIX e clique em <strong>"Já realizei o pagamento"</strong> para validar seu pedido:
                </p>
              </div>

              {/* Status Alert Badge */}
              <div
                className={`p-3.5 rounded-2xl border text-left max-w-md mx-auto flex items-start gap-3 transition-colors ${
                  crIsAwaitingValidation
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                }`}
              >
                {crIsAwaitingValidation ? (
                  <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-0.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Status do Pedido:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/80 dark:bg-stone-900">
                      {crIsAwaitingValidation ? 'Aguardando Validação' : 'Aguardando Pagamento'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    {crIsAwaitingValidation
                      ? '✓ Você informou o pagamento! O dono está validando seu PIX para ativar o plano e agendar a primeira entrega para o próximo dia útil.'
                      : 'Efetue a transferência do valor total abaixo e clique no botão para registrar seu pagamento no sistema.'}
                  </p>
                </div>
              </div>

              {/* PIX Payment Box */}
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-600/40 text-left space-y-3.5 max-w-md mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/20 pb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 block">
                      Valor Total a Pagar Neste Mês
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      {crPotsInMonth} pote{crPotsInMonth > 1 ? 's' : ''} de {createdResult.client.size}g ({crFreqDesc})
                    </span>
                  </div>
                  <span className="text-xl font-black font-mono text-emerald-900 dark:text-emerald-100">
                    R$ {crTotalToPay.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 block font-semibold">
                    Chave PIX da Loja (CNPJ / E-mail / Celular):
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={settings.pixKey || '21981142230'}
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-emerald-700/40 text-xs font-mono font-bold text-stone-900 dark:text-white select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(settings.pixKey || '21981142230');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2500);
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1 shadow-xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-900 dark:text-emerald-300 bg-white/70 dark:bg-stone-900/60 p-2.5 rounded-xl border border-emerald-800/10 space-y-1">
                  <p>1. Transfira <strong>R$ {crTotalToPay.toFixed(2).replace('.', ',')}</strong> via PIX para a chave acima.</p>
                  <p>2. Clique em <strong>"Já realizei o pagamento"</strong> para atualizar o status para <strong>Aguardando Validação</strong>.</p>
                </div>

                {/* Button: Já realizei o pagamento */}
                {crIsAwaitingValidation ? (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-400/50 text-indigo-900 dark:text-indigo-200 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>✓ Já realizei o pagamento (Aguardando Validação)</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleMarkPaymentSent}
                    disabled={isMarkingPaymentSent}
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                  >
                    {isMarkingPaymentSent ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Atualizando status...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Já realizei o pagamento</span>
                      </>
                    )}
                  </button>
                )}

                {/* Direct WhatsApp Receipt Button */}
                <a
                  href={`https://wa.me/55${(settings.whatsapp || '21999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá! Sou o cliente ${createdResult.client.name} (Código: ${createdResult.client.code}).\nAcabei de realizar o pagamento do PIX no valor total de R$ ${crTotalToPay.toFixed(2).replace('.', ',')} referente a ${crPotsInMonth} pote${crPotsInMonth > 1 ? 's' : ''} de ${createdResult.client.size}g (${crFreqDesc}).\n\nSegue em anexo o meu comprovante para validação e ativação do plano:`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Comprovante no WhatsApp</span>
                </a>
              </div>

              {/* Email Credentials Dispatch Notice (Procedimento informado de envio de senha por e-mail) */}
              {/* Access Credentials Header Notice */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-left max-w-md mx-auto space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                        Credenciais de Acesso Geradas! 🔑
                      </h4>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        Copie ou compartilhe seus dados abaixo para guardar seu acesso:
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Access Credentials Cards */}
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto text-center">
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">
                    Seu Código de Cliente
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-900 dark:text-emerald-100 mt-0.5 block">
                    {createdResult.client.code}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">
                    Sua Senha de Acesso
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-900 dark:text-emerald-100 mt-0.5 block">
                    {createdResult.plainPassword}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-[11px] text-stone-600 dark:text-stone-300 max-w-md mx-auto flex items-center justify-between">
                <span>Guarde sua senha para acessar sua Área do Cliente</span>
                <button
                  type="button"
                  onClick={handleCopyAccess}
                  className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copiar Acesso</span>
                </button>
              </div>

              {/* WhatsApp Referral Section with requested text */}
              {(() => {
                const origin = typeof window !== 'undefined' ? window.location.origin : 'https://amigusto.com.br';
                const shareLink = `${origin}/?ref=${createdResult.client.code}`;
                const shareMsg = `Descobrir a A MI GUSTO. Uma empresa que entrega ALHO TRITURADO à domicilio. 🧄\n\nPeça com o meu código de indicação *${createdResult.client.code}* e receba alho fresquinho na sua casa:\n${shareLink}`;

                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white border border-emerald-800/40 max-w-md mx-auto text-left space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Indique e Ganhe Alho Grátis!</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-200 bg-emerald-800/60 px-2 py-0.5 rounded-md">
                        {createdResult.client.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                      Compartilhe seu link no WhatsApp. A cada {settings.goal} amigos que fizerem pedido, você ganha 1 pote de 500g 100% grátis!
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(shareMsg)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Indicar no WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(shareLink);
                          setCopiedShareLink(true);
                          setTimeout(() => setCopiedShareLink(false), 2500);
                        }}
                        className="py-2 px-3 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 font-semibold text-xs flex items-center gap-1 transition-colors border border-emerald-700/60"
                      >
                        {copiedShareLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Share2 className="w-3.5 h-3.5" />}
                        <span>{copiedShareLink ? 'Copiado!' : 'Copiar Link'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full max-w-md py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-md mx-auto block"
                >
                  Concluir e Ir Para Meu Painel
                </button>
              </div>
            </div>
          );
        })() : (
          /* Registration Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Personal Data */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                1. Seus Dados Pessoais
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={birth}
                    onChange={(e) => setBirth(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    WhatsApp (com DDD) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={wpp}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(21) 99999-9999"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 shrink-0" />
                    <span>Seu código e senha de acesso serão exibidos na tela logo após o cadastro para você salvar.</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Address with ViaCEP Auto-fill */}
            <div className="space-y-4 pt-2 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  2. Endereço para Entrega
                </h3>
                {isLoadingCep && (
                  <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando CEP...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    CEP * <span className="text-[10px] text-stone-400">(digite para autocompletar)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 font-mono"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Rua / Avenida *
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Ex: Rua das Flores"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={num}
                    onChange={(e) => setNum(e.target.value)}
                    placeholder="123"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Complemento <span className="text-[10px] text-stone-400">(Apto, Bloco, etc.)</span>
                  </label>
                  <input
                    type="text"
                    value={comp}
                    onChange={(e) => setComp(e.target.value)}
                    placeholder="Apto 101"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    required
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    UF *
                  </label>
                  <select
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    className="w-full px-2 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 font-bold"
                  >
                    <option value="">—</option>
                    {UFs.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Purchase Choice */}
            <div className="space-y-4 pt-2 border-t border-stone-200 dark:border-stone-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                3. Escolha do Plano e Pote
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Modalidade *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'assinatura' | 'avulsa')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="assinatura">Assinatura (com desconto por entrega)</option>
                    <option value="avulsa">Compra avulsa (pedido único)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Tamanho do Pote *
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as '250' | '500' | '1000')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 font-bold"
                  >
                    <option value="250">250g – {type === 'avulsa' ? `R$ ${settings.avulsoPrices[250]}` : `R$ ${settings.prices[250]}`}</option>
                    <option value="500">500g – {type === 'avulsa' ? `R$ ${settings.avulsoPrices[500]}` : `R$ ${settings.prices[500]}`}</option>
                    <option value="1000">1kg – {type === 'avulsa' ? `R$ ${settings.avulsoPrices[1000]}` : `R$ ${settings.prices[1000]}`}</option>
                  </select>
                </div>

                {type === 'assinatura' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Frequência de Entrega *
                    </label>
                    <select
                      value={freq}
                      onChange={(e) => setFreq(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 font-semibold"
                    >
                      <option value="4">Toda semana (4x por mês)</option>
                      <option value="2">A cada quinze dias (2x por mês)</option>
                      <option value="1">Todo mês (1x por mês)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Data da Compra *
                  </label>
                  <input
                    type="date"
                    required
                    value={pdate}
                    onChange={(e) => setPdate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Código de quem indicou <span className="text-[10px] text-stone-400">(opcional, ex: AMG001)</span>
                  </label>
                  <input
                    type="text"
                    value={ref}
                    onChange={(e) => setRef(e.target.value.toUpperCase())}
                    placeholder="AMG..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 font-mono"
                  />
                </div>
              </div>

              {/* Live Price Summary Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-800/20 text-xs text-stone-700 dark:text-stone-300 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between font-bold text-sm text-emerald-950 dark:text-emerald-100 gap-1">
                  <span>Preço unitário: R$ {getUnitPrice().toFixed(2).replace('.', ',')} por pote</span>
                  <span className="text-emerald-800 dark:text-emerald-300">
                    Total: {getMonthlyPotsCount()} pote{getMonthlyPotsCount() > 1 ? 's' : ''} no mês
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-800/10 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  <span>Valor Total a Pagar no Mês:</span>
                  <span className="text-base font-black font-mono">
                    R$ {getTotalToPay().toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Primeira entrega prevista para: <strong>{getDeliveryDate()}</strong> (dia útil seguinte à validação do PIX).
                </p>
              </div>

              {/* PIX Key Section - Pay first to activate with total month value */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-emerald-50 dark:from-stone-800/90 dark:to-emerald-950/40 border-2 border-emerald-600/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-700/20 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Chave PIX do Dono (Pague Primeiro)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-semibold">
                      Total a Pagar ({type === 'avulsa' ? 'Pedido Único' : 'Mês Vigente'}):
                    </span>
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-900 dark:text-emerald-100">
                      R$ {getTotalToPay().toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Detailed Breakdown Note */}
                <div className="p-3 bg-white/80 dark:bg-stone-900/80 rounded-xl border border-emerald-600/20 text-xs text-stone-700 dark:text-stone-300 space-y-1">
                  <div className="font-bold text-stone-900 dark:text-white flex items-center justify-between">
                    <span>Detalhamento dos Potes:</span>
                    <span className="text-emerald-800 dark:text-emerald-300 font-extrabold">
                      {getMonthlyPotsCount()} pote{getMonthlyPotsCount() > 1 ? 's' : ''} de {size}g
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                    {type === 'assinatura' ? (
                      <>
                        Como você escolheu entrega <strong>{getFrequencyLabel()}</strong>, você receberá um total de <strong>{getMonthlyPotsCount()} potes</strong> naquele mês:{' '}
                        <strong className="text-emerald-900 dark:text-emerald-200 font-mono">
                          {getMonthlyPotsCount()} × R$ {getUnitPrice().toFixed(2).replace('.', ',')} = R$ {getTotalToPay().toFixed(2).replace('.', ',')}
                        </strong>.
                      </>
                    ) : (
                      <>
                        Pedido de <strong>Compra Avulsa</strong> (1 pote de <strong>{size}g</strong>):{' '}
                        <strong className="text-emerald-900 dark:text-emerald-200 font-mono">
                          R$ {getTotalToPay().toFixed(2).replace('.', ',')}
                        </strong>.
                      </>
                    )}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 block">
                    Chave PIX Oficial (CNPJ / E-mail / Celular):
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={settings.pixKey || '21981142230'}
                      className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-emerald-700/40 text-xs font-mono font-bold text-stone-900 dark:text-white select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(settings.pixKey || '21981142230');
                        setCopiedPixEarly(true);
                        setTimeout(() => setCopiedPixEarly(false), 2500);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1 shadow-xs"
                    >
                      {copiedPixEarly ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPixEarly ? 'Copiado!' : 'Copiar Chave'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-stone-600 dark:text-stone-300 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl flex items-start gap-2">
                  <span className="font-bold text-amber-800 dark:text-amber-300 shrink-0">⚠️ Pague Primeiro:</span>
                  <span>
                    Após concluir o cadastro, o pedido é registrado como <strong>Aguardando Pagamento</strong>. Você poderá clicar no botão <strong>"Já realizei o pagamento"</strong> para alterar o status para <strong>Aguardando Validação</strong> e o dono ativar a entrega!
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <span>Cadastrar e Concluir Pagamento PIX</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
