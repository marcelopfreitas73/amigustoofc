import React, { useState, useEffect } from 'react';
import type { Client, AppSettings, DeliveryStatus, Product, PurchaseItem } from '../types.js';
import { api, createRealtimeSocket } from '../api.js';
import {
  X,
  User,
  LogOut,
  Gift,
  Package,
  Calendar,
  Share2,
  Copy,
  Check,
  PlusCircle,
  Clock,
  Sparkles,
  AlertCircle,
  Loader2,
  MessageCircle,
  CheckCircle2,
  Shield,
  Edit3,
  ExternalLink,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Truck,
  Bike,
  Radio,
  Mail,
  MapPin,
  RefreshCw,
  Handshake,
  Send,
  Store,
  Repeat,
  KeyRound,
  Lock,
  ShoppingCart,
  ArrowRight,
  Camera,
  Upload,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  activeClientCode?: string | null;
  isAdminSession?: boolean;
  onLoginSuccess: (client: Client) => void;
  onLogout: () => void;
  onOpenRegister: () => void;
  onReturnToOwner?: () => void;
}

export const ClientPortal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  activeClientCode,
  isAdminSession = false,
  onLoginSuccess,
  onLogout,
  onOpenRegister,
  onReturnToOwner,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [client, setClient] = useState<Client | null>(null);
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isMarkingPaymentSent, setIsMarkingPaymentSent] = useState(false);

  // Client Password Recovery & View
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Real-time synchronization state
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // New order state
  const [newOrderSize, setNewOrderSize] = useState<'250' | '500' | '1000'>('500');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');

  // Nova Assinatura state
  const [showNewSubForm, setShowNewSubForm] = useState(false);
  const [subSize, setSubSize] = useState<'250' | '500' | '1000'>('500');
  const [subFreq, setSubFreq] = useState<number>(2); // 4 = semanal, 2 = quinzenal, 1 = mensal
  const [subStartDate, setSubStartDate] = useState('');
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);
  const [subSuccessMsg, setSubSuccessMsg] = useState('');

  // Modificar Data de Recebimento do Produto state
  const [showChangeDateModal, setShowChangeDateModal] = useState(false);
  const [newDeliveryDateInput, setNewDeliveryDateInput] = useState('');
  const [deliveryDateNotes, setDeliveryDateNotes] = useState('');
  const [isSavingDeliveryDate, setIsSavingDeliveryDate] = useState(false);
  const [deliveryDateSuccessMsg, setDeliveryDateSuccessMsg] = useState('');

  // Alterar Senha state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordChangeInput, setPasswordChangeInput] = useState('');
  const [passwordConfirmInput, setPasswordConfirmInput] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordChangeMsg, setPasswordChangeMsg] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Editing state (both owner and client can edit profile/plan/address)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Client>>({});
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveProfileMsg, setSaveProfileMsg] = useState('');

  // Referrals count for this client
  const [referralCount, setReferralCount] = useState<number>(0);

  // Partnership & Company Promotion States (Divulgação da empresa do cliente por R$ 100 / 3 meses)
  const [showPartnershipForm, setShowPartnershipForm] = useState(false);
  const [partnershipCompanyName, setPartnershipCompanyName] = useState('');
  const [partnershipBusinessType, setPartnershipBusinessType] = useState('Comércio / Loja');
  const [partnershipCompanyContact, setPartnershipCompanyContact] = useState('');
  const [partnershipMsg, setPartnershipMsg] = useState('');
  const [partnershipPhotoUrl, setPartnershipPhotoUrl] = useState('');
  const [isUploadingPartnershipPhoto, setIsUploadingPartnershipPhoto] = useState(false);
  const [isSendingPartnership, setIsSendingPartnership] = useState(false);
  const [partnershipSuccessMsg, setPartnershipSuccessMsg] = useState('');

  const handlePartnershipPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPartnershipPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
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
          setPartnershipPhotoUrl(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          setPartnershipPhotoUrl(event.target?.result as string);
        }
        setIsUploadingPartnershipPhoto(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Order Deletion (Permitir o cliente excluir pedidos feitos por engano)
  const [orderToDelete, setOrderToDelete] = useState<PurchaseItem | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [orderDeleteMsg, setOrderDeleteMsg] = useState('');
  const [orderDeleteError, setOrderDeleteError] = useState('');

  // Dynamic products list registered by the owner
  const [productsList, setProductsList] = useState<Product[]>(settings.products || []);

  useEffect(() => {
    if (isOpen) {
      api.getProducts().then(prods => {
        if (prods && prods.length > 0) setProductsList(prods);
      }).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeClientCode) {
      loadClientData(activeClientCode);
    } else {
      setClient(null);
    }
  }, [activeClientCode, isOpen]);

  // Real-time WebSocket connection to receive live updates from Owner Dashboard (iFood sync)
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = createRealtimeSocket((evt) => {
      setIsRealtimeConnected(true);
      if (evt.type === 'PRODUCTS_UPDATED') {
        setProductsList(evt.products);
      } else if (client?.code && (
        (evt.type === 'DELIVERY_STATUS_CHANGED' && evt.clientCode === client.code) ||
        (evt.type === 'CLIENT_ACTIVATED' && evt.clientCode === client.code) ||
        (evt.type === 'CLIENT_UPDATED' && evt.clientCode === client.code) ||
        (evt.type === 'NEW_ORDER_CREATED' && evt.clientCode === client.code)
      )) {
        loadClientData(client.code);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, client?.code]);

  const loadClientData = async (code: string) => {
    setIsLoadingClient(true);
    try {
      const data = await api.getClient(code);
      setClient(data);
      setEditFormData({ ...data });
      if (data.size) setSubSize(data.size);
      if (data.freq) setSubFreq(data.freq);
      const activeDelivery = data.hist?.slice().reverse().find(o => o.deliveryStatus !== 'entregue')?.deliveryDate || data.pdate || '';
      if (activeDelivery) {
        setNewDeliveryDateInput(activeDelivery);
        setSubStartDate(activeDelivery);
      }
      // Fetch clients to calculate referrals
      const allClients = await api.getClients();
      const count = allClients.filter(
        c => c.ref && c.ref.toUpperCase() === code.toUpperCase()
      ).length;
      setReferralCount(count);
    } catch (err) {
      console.error('Error loading client:', err);
    } finally {
      setIsLoadingClient(false);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await api.clientLogin(identifier, password);
      onLoginSuccess(res.client);
      setClient(res.client);
      setEditFormData({ ...res.client });
      loadClientData(res.client.code);
      setPassword('');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCopyCode = () => {
    if (!client) return;
    navigator.clipboard.writeText(client.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const getShareLinkAndText = () => {
    if (!client) return { appLink: '', text: '' };
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://amigusto.com.br';
    const appLink = `${origin}/?ref=${client.code}`;
    const text = `Descobrir a A MI GUSTO. Uma empresa que entrega ALHO TRITURADO à domicilio. 🧄\n\nPeça com o meu código de indicação *${client.code}* e receba alho fresquinho na sua casa:\n${appLink}`;
    return { appLink, text };
  };

  const handleCopyShareMessage = () => {
    const { text } = getShareLinkAndText();
    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleCopyPixKey = () => {
    const key = settings.pixKey || '21981142230';
    navigator.clipboard.writeText(key);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleCopyPassword = () => {
    if (!client) return;
    const pwd = client.plainPw || '123456';
    navigator.clipboard.writeText(pwd);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const handleMarkPaymentSent = async () => {
    if (!client) return;
    setIsMarkingPaymentSent(true);
    try {
      const res = await api.confirmPaymentSent(client.code);
      setClient(res.client);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao registrar pagamento');
    } finally {
      setIsMarkingPaymentSent(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!client) return;
    setIsPlacingOrder(true);
    setOrderSuccessMsg('');
    try {
      const res = await api.addOrder(client.code, {
        size: newOrderSize,
        type: 'avulsa',
      });
      setOrderSuccessMsg(`Pedido de pote ${newOrderSize}g registrado com sucesso! Entrega prevista em ${res.order.deliveryDate?.split('-').reverse().join('/')}.`);
      loadClientData(client.code);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao realizar pedido');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePlaceProductOrder = async (targetUnit: string, productName?: string) => {
    if (!client) return;
    setIsPlacingOrder(true);
    setOrderSuccessMsg('');
    const validSize = targetUnit.includes('250') ? '250' : (targetUnit.includes('1000') || targetUnit.includes('1kg')) ? '1000' : '500';
    try {
      const res = await api.addOrder(client.code, {
        size: validSize as '250' | '500' | '1000',
        type: 'avulsa',
      });
      const name = productName ? ` de ${productName}` : ` (${targetUnit})`;
      setOrderSuccessMsg(`Pedido avulso${name} registrado com sucesso! Entrega prevista em ${res.order.deliveryDate?.split('-').reverse().join('/')}.`);
      loadClientData(client.code);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao realizar pedido');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleConfirmDeleteOrder = async (order: PurchaseItem) => {
    if (!client) return;
    const orderId = order.id || `ord-${order.date}-${order.val}`;
    setIsDeletingOrder(true);
    setOrderDeleteError('');
    try {
      await api.removeOrder(client.code, orderId);
      setOrderToDelete(null);
      setOrderDeleteMsg('Pedido excluído com sucesso! O pedido foi cancelado e retirado da contabilidade.');
      setTimeout(() => setOrderDeleteMsg(''), 5000);
      await loadClientData(client.code);
    } catch (err: unknown) {
      setOrderDeleteError(err instanceof Error ? err.message : 'Erro ao excluir pedido');
    } finally {
      setIsDeletingOrder(false);
    }
  };

  const handleSendPartnershipInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setIsSendingPartnership(true);
    setPartnershipSuccessMsg('');
    try {
      const composedMsg = partnershipPhotoUrl
        ? `${partnershipMsg.trim() || 'Gostaria de divulgar minha empresa na página da A Mi Gusto por R$ 100 durante 3 meses.'}\n\n[Foto/Logo anexada pelo cliente]`
        : (partnershipMsg.trim() || 'Gostaria de divulgar minha empresa na página da A Mi Gusto por R$ 100 durante 3 meses.');

      const res = await api.sendPartnershipInquiry({
        clientCode: client.code,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.wpp,
        companyName: partnershipCompanyName.trim() || client.name,
        businessType: partnershipBusinessType,
        companyContact: partnershipCompanyContact.trim() || client.wpp,
        message: composedMsg,
      });
      setPartnershipSuccessMsg(res.message || 'Informações enviadas com sucesso ao Marcelo! Ele entrará em contato em breve para alinhar o banner.');
      setTimeout(() => {
        setShowPartnershipForm(false);
        setPartnershipSuccessMsg('');
        setPartnershipCompanyName('');
        setPartnershipCompanyContact('');
        setPartnershipMsg('');
        setPartnershipPhotoUrl('');
      }, 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao enviar proposta');
    } finally {
      setIsSendingPartnership(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setIsSavingProfile(true);
    setSaveProfileMsg('');
    try {
      const updated = await api.updateClient(client.code, {
        ...editFormData,
        newPassword: newPasswordInput.trim() || undefined,
      });
      setClient(updated.client);
      setEditFormData({ ...updated.client });
      setNewPasswordInput('');
      setSaveProfileMsg('Dados atualizados com sucesso no banco de dados!');
      setTimeout(() => {
        setIsEditingProfile(false);
        setSaveProfileMsg('');
      }, 1500);
    } catch (err: unknown) {
      setSaveProfileMsg(err instanceof Error ? err.message : 'Erro ao atualizar dados');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setIsSubmittingSub(true);
    setSubSuccessMsg('');
    try {
      const res = await api.createSubscription(client.code, {
        size: subSize,
        freq: subFreq,
        startDate: subStartDate || undefined,
        notes: `Nova assinatura solicitada pelo cliente. Pote ${subSize}g com frequência ${subFreq === 4 ? 'Semanal' : subFreq === 2 ? 'Quinzenal' : 'Mensal'}.`,
      });
      setClient(res.client);
      setSubSuccessMsg(`Nova assinatura do pote de ${subSize}g (${subFreq === 4 ? 'Semanal - 4x/mês' : subFreq === 2 ? 'Quinzenal - 2x/mês' : 'Mensal - 1x/mês'}) confirmada com sucesso! Primeira entrega agendada para ${res.order.deliveryDate ? res.order.deliveryDate.split('-').reverse().join('/') : 'breve'}.`);
      loadClientData(client.code);
      setTimeout(() => {
        setSubSuccessMsg('');
      }, 7000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao criar assinatura');
    } finally {
      setIsSubmittingSub(false);
    }
  };

  const handleUpdateDeliveryDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !newDeliveryDateInput) return;
    setIsSavingDeliveryDate(true);
    setDeliveryDateSuccessMsg('');
    try {
      const res = await api.updateDeliveryDate(client.code, newDeliveryDateInput, deliveryDateNotes);
      setClient(res.client);
      setDeliveryDateSuccessMsg(`Data de recebimento atualizada para ${newDeliveryDateInput.split('-').reverse().join('/')} com sucesso!`);
      loadClientData(client.code);
      setTimeout(() => {
        setDeliveryDateSuccessMsg('');
      }, 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao alterar data de entrega');
    } finally {
      setIsSavingDeliveryDate(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setPasswordChangeError('');
    setPasswordChangeMsg('');

    if (passwordChangeInput.trim().length < 4) {
      setPasswordChangeError('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }
    if (passwordChangeInput.trim() !== passwordConfirmInput.trim()) {
      setPasswordChangeError('A confirmação da senha não confere com a nova senha digitada.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await api.changePassword(client.code, passwordChangeInput.trim());
      setClient(res.client);
      setPasswordChangeMsg('Sua senha de acesso foi alterada com sucesso!');
      setPasswordChangeInput('');
      setPasswordConfirmInput('');
      setTimeout(() => {
        setPasswordChangeMsg('');
      }, 5000);
    } catch (err: unknown) {
      setPasswordChangeError(err instanceof Error ? err.message : 'Erro ao alterar senha');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const goal = settings.goal || 10;
  const wonRewards = Math.floor(referralCount / goal);
  const pendingRewards = Math.max(0, wonRewards - (client?.sent || 0));
  const progressToNext = (referralCount % goal) / goal * 100;

  // Next delivery date calculation
  const getNextDelivery = () => {
    if (!client || client.hist.length === 0) return '—';
    const last = client.hist[client.hist.length - 1];
    if (client.type === 'avulsa') {
      return last.deliveryDate ? last.deliveryDate.split('-').reverse().join('/') : '—';
    }
    const intervalDays = client.freq === 4 ? 7 : client.freq === 2 ? 15 : 30;
    const d = new Date(last.date + 'T12:00:00');
    d.setDate(d.getDate() + intervalDays + 1); // +1 day delivery
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-stone-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-stone-200 dark:border-stone-800 overflow-hidden my-0 sm:my-4 relative h-full sm:h-auto max-h-screen sm:max-h-[90vh] flex flex-col">
        {/* Admin Impersonation Notice Banner */}
        {isAdminSession && client && (
          <div className="bg-amber-600 text-white px-3.5 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold shrink-0">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-200 shrink-0" />
              <span>
                <strong>Modo Dono:</strong> Acessando portal de <strong>{client.name} ({client.code})</strong>.
              </span>
            </div>
            {onReturnToOwner && (
              <button
                onClick={onReturnToOwner}
                className="bg-amber-800 hover:bg-amber-900 px-3 py-1 rounded-lg text-white font-bold transition-colors whitespace-nowrap"
              >
                Voltar ao Painel
              </button>
            )}
          </div>
        )}

        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-stone-50 dark:bg-stone-800/70 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white truncate">
                {client ? `Portal de ${client.name.split(' ')[0]}` : 'Área do Cliente'}
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                {client ? `Código: ${client.code} · ${client.email}` : 'Consulte seus pedidos, entregas e indicações'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {client && (
              <>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 transition-colors"
                  title="Editar dados e plano"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline sm:inline">{isEditingProfile ? 'Fechar' : 'Editar'}</span>
                </button>

                <button
                  onClick={() => {
                    onLogout();
                    setClient(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                  title="Sair da conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!client ? (
            /* Login Form */
            <div className="max-w-md mx-auto py-6 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-extrabold text-stone-900 dark:text-white">
                  Acesse sua Conta
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Informe o seu código de cliente (ex: AMG001) ou o e-mail cadastrado e sua senha:
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Código de Cliente ou E-mail
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Ex: AMG001 ou seu@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Senha de Acesso
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha gerada no cadastro"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <span>Entrar no Painel</span>
                  )}
                </button>
              </form>

              <div className="pt-4 text-center border-t border-stone-100 dark:border-stone-800">
                <p className="text-xs text-stone-500">
                  Ainda não é cliente A Mi Gusto?{' '}
                  <button
                    onClick={() => {
                      onClose();
                      onOpenRegister();
                    }}
                    className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Cadastre-se agora
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* Logged-in Customer Dashboard */
            <>
              {isLoadingClient && (
                <div className="flex items-center justify-center py-2 text-xs text-stone-500">
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Atualizando dados...
                </div>
              )}

              {/* Edit Mode Drawer (allows owner or client to modify everything) */}
              {isEditingProfile && (
                <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-stone-800 border-2 border-emerald-600/40 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between border-b border-emerald-800/20 pb-2">
                    <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4 text-emerald-700" />
                      <span>Editar Todos os Dados e Preferências</span>
                    </h4>
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                      Alterações são salvas diretamente no servidor
                    </span>
                  </div>

                  {saveProfileMsg && (
                    <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-xs font-semibold">
                      {saveProfileMsg}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold block mb-1">Nome Completo</label>
                        <input
                          type="text"
                          value={editFormData.name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">WhatsApp</label>
                        <input
                          type="text"
                          value={editFormData.wpp || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, wpp: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">E-mail</label>
                        <input
                          type="email"
                          value={editFormData.email || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Data Nascimento</label>
                        <input
                          type="date"
                          value={editFormData.birth || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, birth: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-semibold block mb-1">Endereço (Rua, Número e Bairro)</label>
                        <div className="grid grid-cols-6 gap-2">
                          <input
                            type="text"
                            placeholder="Rua"
                            value={editFormData.street || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, street: e.target.value })}
                            className="col-span-3 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                          />
                          <input
                            type="text"
                            placeholder="Nº"
                            value={editFormData.num || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, num: e.target.value })}
                            className="col-span-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                          />
                          <input
                            type="text"
                            placeholder="Bairro"
                            value={editFormData.bairro || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, bairro: e.target.value })}
                            className="col-span-2 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Tamanho & Modalidade</label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={editFormData.size || '500'}
                            onChange={(e) => setEditFormData({ ...editFormData, size: e.target.value as '250' | '500' | '1000' })}
                            className="px-2 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-bold"
                          >
                            <option value="250">250g</option>
                            <option value="500">500g</option>
                            <option value="1000">1kg</option>
                          </select>
                          <select
                            value={editFormData.type || 'assinatura'}
                            onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as 'assinatura' | 'avulsa' })}
                            className="px-2 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                          >
                            <option value="assinatura">Assinatura</option>
                            <option value="avulsa">Avulsa</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="font-semibold block mb-1">Frequência da Assinatura</label>
                        <select
                          value={editFormData.freq || 2}
                          onChange={(e) => setEditFormData({ ...editFormData, freq: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-bold"
                        >
                          <option value="4">Semanal (4x/mês)</option>
                          <option value="2">Quinzenal (2x/mês)</option>
                          <option value="1">Mensal (1x/mês)</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="font-semibold block mb-1">Nova Senha de Acesso (opcional)</label>
                        <input
                          type="text"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          placeholder="Digite apenas se quiser redefinir a senha"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-800/20">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Salvar Alterações</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Password & Access Recovery Card for Client */}
              <div className="p-4 rounded-2xl bg-stone-100/90 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 dark:text-white">
                          Sua Senha de Acesso:
                        </span>
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100">
                          {showPassword ? (client.plainPw || '123456') : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors p-1"
                          title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        Esta senha foi gerada no cadastro e enviada para <strong>{client.email}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePasswordModal(!showChangePasswordModal);
                        setPasswordChangeError('');
                        setPasswordChangeMsg('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{showChangePasswordModal ? 'Fechar' : 'Mudar Senha'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      {copiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPassword ? 'Copiada!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Inline Change Password Form */}
                {showChangePasswordModal && (
                  <form onSubmit={handleChangePassword} className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700/60 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-white">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>Definir Nova Senha de Acesso</span>
                      </div>
                      <span className="text-[10px] text-stone-400">Mínimo 4 caracteres</span>
                    </div>

                    {passwordChangeError && (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{passwordChangeError}</span>
                      </div>
                    )}

                    {passwordChangeMsg && (
                      <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{passwordChangeMsg}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-stone-600 dark:text-stone-300 font-semibold mb-1">
                          Nova Senha *
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordChangeInput}
                          onChange={(e) => setPasswordChangeInput(e.target.value)}
                          placeholder="Digite sua nova senha"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-600 dark:text-stone-300 font-semibold mb-1">
                          Confirmar Nova Senha *
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordConfirmInput}
                          onChange={(e) => setPasswordConfirmInput(e.target.value)}
                          placeholder="Repita a nova senha"
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowChangePasswordModal(false)}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingPassword}
                        className="px-4 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
                      >
                        {isSavingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Salvar Nova Senha</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Central de Acompanhamento ao Vivo Estilo iFood (Sincronização em Tempo Real) */}
              {(() => {
                const activeOrder = client.hist && client.hist.length > 0
                  ? (client.hist.slice().reverse().find(o => o.deliveryStatus && o.deliveryStatus !== 'entregue') || client.hist[client.hist.length - 1])
                  : null;

                if (!activeOrder) return null;

                const stage: DeliveryStatus = (activeOrder.deliveryStatus as DeliveryStatus) || 'recebido';
                const stageIndex = stage === 'recebido' ? 0 : stage === 'preparando' ? 1 : stage === 'saiu_entrega' ? 2 : 3;
                const progressWidths = ['12%', '38%', '70%', '100%'];

                return (
                  <div className="p-5 rounded-2xl bg-white dark:bg-stone-850 border-2 border-emerald-600/30 dark:border-emerald-500/30 shadow-md space-y-4">
                    {/* Header with live sync pulse */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                            <span>Acompanhamento do Pedido ao Vivo</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold uppercase tracking-wide">
                              iFood Sync
                            </span>
                          </h4>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            Pote {activeOrder.size}g · Entrega prevista:{' '}
                            <strong className="text-stone-800 dark:text-stone-200">
                              {activeOrder.deliveryDate ? activeOrder.deliveryDate.split('-').reverse().join('/') : 'Hoje'}
                            </strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Ao Vivo (WebSocket)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => loadClientData(client.code)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="Atualizar status"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* iFood 4-Stage Stepper */}
                    <div className="relative pt-2 pb-1">
                      {/* Gray track line */}
                      <div className="absolute top-6 left-6 right-6 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full -translate-y-1/2 z-0" />
                      {/* Active green progress fill line */}
                      <div
                        className="absolute top-6 left-6 h-1.5 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full -translate-y-1/2 z-0 transition-all duration-700 ease-out"
                        style={{ width: `calc(${progressWidths[stageIndex]} - 24px)` }}
                      />

                      <div className="relative z-10 grid grid-cols-4 text-center">
                        {/* Step 1: Recebido */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              stageIndex >= 0
                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/70 shadow-sm'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-400'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-[11px] font-bold mt-2 ${
                              stageIndex === 0
                                ? 'text-emerald-800 dark:text-emerald-400'
                                : stageIndex > 0
                                ? 'text-stone-800 dark:text-stone-200'
                                : 'text-stone-400'
                            }`}
                          >
                            1. Confirmado
                          </span>
                          <span className="text-[10px] text-stone-500 hidden sm:block">Pedido Aceito</span>
                        </div>

                        {/* Step 2: Preparando */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              stageIndex >= 1
                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/70 shadow-sm'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-400'
                            } ${stageIndex === 1 ? 'animate-pulse' : ''}`}
                          >
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-[11px] font-bold mt-2 ${
                              stageIndex === 1
                                ? 'text-amber-800 dark:text-amber-400'
                                : stageIndex > 1
                                ? 'text-stone-800 dark:text-stone-200'
                                : 'text-stone-400'
                            }`}
                          >
                            2. Moagem Fresca
                          </span>
                          <span className="text-[10px] text-stone-500 hidden sm:block">Em Preparo</span>
                        </div>

                        {/* Step 3: Saiu para Entrega */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              stageIndex >= 2
                                ? 'bg-purple-600 text-white ring-4 ring-purple-100 dark:ring-purple-950/70 shadow-sm'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-400'
                            } ${stageIndex === 2 ? 'animate-bounce' : ''}`}
                          >
                            <Bike className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-[11px] font-bold mt-2 ${
                              stageIndex === 2
                                ? 'text-purple-700 dark:text-purple-400'
                                : stageIndex > 2
                                ? 'text-stone-800 dark:text-stone-200'
                                : 'text-stone-400'
                            }`}
                          >
                            3. Em Rota
                          </span>
                          <span className="text-[10px] text-stone-500 hidden sm:block">Saiu p/ Entrega</span>
                        </div>

                        {/* Step 4: Entregue */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              stageIndex >= 3
                                ? 'bg-emerald-700 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/70 shadow-sm'
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-400'
                            }`}
                          >
                            <Package className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-[11px] font-bold mt-2 ${
                              stageIndex >= 3
                                ? 'text-emerald-800 dark:text-emerald-400'
                                : 'text-stone-400'
                            }`}
                          >
                            4. Entregue
                          </span>
                          <span className="text-[10px] text-stone-500 hidden sm:block">Concluído</span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Stage Notification Box */}
                    {stage === 'recebido' && (
                      <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 text-sky-900 dark:text-sky-200 text-xs flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                        <div>
                          <span className="font-bold block">Pedido Recebido & Confirmado!</span>
                          <span className="text-[11px] text-sky-800 dark:text-sky-300">
                            Nossa equipe já registrou seu pedido. A moagem fresca do alho será iniciada logo em seguida para garantir o aroma e potência natural.
                          </span>
                        </div>
                      </div>
                    )}

                    {stage === 'preparando' && (
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2.5">
                        <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 animate-spin" />
                        <div>
                          <span className="font-bold block">Em Moagem & Embalagem Fresca 🧄</span>
                          <span className="text-[11px] text-amber-800 dark:text-amber-300">
                            Seus dentes de alho selecionados de primeira linha estão sendo moídos e envasados em pote lacrado. Sem conservantes e sem adição de água.
                          </span>
                        </div>
                      </div>
                    )}

                    {stage === 'saiu_entrega' && (
                      <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/50 border-2 border-purple-300 dark:border-purple-800 text-purple-950 dark:text-purple-100 text-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bike className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 animate-bounce" />
                            <div>
                              <span className="font-extrabold text-sm block">
                                O Entregador Já Está a Caminho! 🏍️
                              </span>
                              <span className="text-[11px] text-purple-700 dark:text-purple-300">
                                Previsão de chegada estimada: <strong>{activeOrder.estimatedMinutes || 20} minutos</strong>
                              </span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 text-[10px] font-black uppercase tracking-wider">
                            Em Rota
                          </span>
                        </div>

                        <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-purple-200 dark:border-purple-900 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-stone-500 block uppercase font-semibold">Entregador Responsável:</span>
                            <span className="font-bold text-stone-900 dark:text-white">
                              {activeOrder.deliveryDriver || 'Entregador A Mi Gusto'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                            <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="text-[11px]">
                              {client.street ? `${client.street}, nº ${client.num} - ${client.bairro}` : 'Endereço cadastrado'}
                            </span>
                          </div>

                          <a
                            href={`https://wa.me/55${(settings.whatsapp || '21999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Olá! Sou o cliente ${client.name} (${client.code}). Estou acompanhando pelo portal que meu pedido saiu para entrega com o entregador ${activeOrder.deliveryDriver || 'A Mi Gusto'}!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Falar no WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {stage === 'entregue' && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <span className="font-bold block">Pedido Entregue com Sucesso! 🎉</span>
                            <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                              Alho triturado entregue no seu endereço. Aproveite a praticidade e o sabor autêntico nas suas receitas!
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-bold text-[10px] uppercase">
                          Finalizado
                        </span>
                      </div>
                    )}

                    {/* Excluir Pedido Feito por Engano no Card de Entrega */}
                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>Fez este pedido por engano ou deseja cancelá-lo?</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setOrderToDelete(activeOrder)}
                        className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir Pedido Feito por Engano</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Pending Payment Card (shown when client is Aguardando Pagamento or Aguardando Validação) */}
              {(client.status === 'Aguardando Pagamento' || client.status === 'Aguardando Validação') && (() => {
                const clientUnitPrice = client.type === 'avulsa'
                  ? (settings.avulsoPrices[client.size] || 0)
                  : (settings.prices[client.size] || 0);
                const clientPotsCount = client.type === 'avulsa' ? 1 : (client.freq || 1);
                const clientTotalToPay = clientUnitPrice * clientPotsCount;
                const clientFreqDesc = client.type === 'avulsa'
                  ? 'Compra Avulsa (única)'
                  : client.freq === 4
                  ? 'Semanal (4 potes no mês)'
                  : client.freq === 2
                  ? 'Quinzenal (2 potes no mês)'
                  : 'Mensal (1 pote no mês)';
                const isAwaitingVal = client.status === 'Aguardando Validação';

                return (
                  <div
                    className={`p-5 rounded-2xl border-2 text-stone-900 dark:text-stone-100 space-y-3.5 ${
                      isAwaitingVal
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-800'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isAwaitingVal ? (
                          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 animate-pulse" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold text-sm text-stone-900 dark:text-white block">
                            {isAwaitingVal
                              ? 'Pagamento Informado · Aguardando Validação do Dono'
                              : 'Plano Aguardando Pagamento via PIX'}
                          </span>
                          <span className="text-xs text-stone-600 dark:text-stone-300">
                            {isAwaitingVal
                              ? 'O dono está conferindo o PIX para ativar seu plano e agendar suas entregas.'
                              : 'Para ativar o plano e liberar as entregas, realize a transferência PIX e confirme abaixo.'}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isAwaitingVal
                            ? 'bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200'
                            : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                        }`}
                      >
                        {isAwaitingVal ? 'Aguardando Validação' : 'Pendente'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold block">
                          Chave PIX da Loja · Total do Mês ({clientPotsCount} pote{clientPotsCount > 1 ? 's' : ''} de {client.size}g):
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-base font-black font-mono text-emerald-900 dark:text-emerald-100">
                            R$ {clientTotalToPay.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            ({clientFreqDesc})
                          </span>
                        </div>
                        <span className="font-mono text-xs text-stone-700 dark:text-stone-300 select-all block mt-1">
                          {settings.pixKey || '21981142230'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyPixKey}
                        className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPix ? 'Chave Copiada!' : 'Copiar Chave PIX'}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {!isAwaitingVal ? (
                        <button
                          type="button"
                          onClick={handleMarkPaymentSent}
                          disabled={isMarkingPaymentSent}
                          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          {isMarkingPaymentSent ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Atualizando...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Já realizei o pagamento</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="px-3.5 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Aviso de pagamento já enviado</span>
                        </div>
                      )}

                      <a
                        href={`https://wa.me/55${(settings.whatsapp || '21999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Olá! Sou o cliente ${client.name} (${client.code}). Acabei de realizar o pagamento do PIX no valor total de R$ ${clientTotalToPay.toFixed(2).replace('.', ',')} para ${clientPotsCount} pote${clientPotsCount > 1 ? 's' : ''} de ${client.size}g (${clientFreqDesc}). Segue o comprovante para ativação do meu plano:`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Enviar Comprovante pelo WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })()}

              {/* Status & Plan Summary Card */}
              <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/80 p-5 border border-stone-200/80 dark:border-stone-700">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700/60">
                    <span className="text-[11px] text-stone-500 block">Pote & Modalidade</span>
                    <span className="text-base font-extrabold text-stone-900 dark:text-white block mt-0.5">
                      {client.size}g
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      {client.type === 'avulsa' ? 'Compra Avulsa' : 'Assinatura'}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700/60">
                    <span className="text-[11px] text-stone-500 block">Valor Unitário</span>
                    <span className="text-base font-extrabold text-emerald-800 dark:text-emerald-400 block mt-0.5 tabular-nums">
                      R$ {(client.type === 'avulsa' ? settings.avulsoPrices[client.size] : settings.prices[client.size]).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[10px] text-stone-400">por pote</span>
                  </div>

                  <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700/60">
                    <span className="text-[11px] text-stone-500 block">Compras Feitas</span>
                    <span className="text-base font-extrabold text-stone-900 dark:text-white block mt-0.5 tabular-nums">
                      {client.hist.length}
                    </span>
                    <span className="text-[10px] text-stone-400">pedidos registrados</span>
                  </div>

                  <div className="p-3 bg-white dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700/60">
                    <span className="text-[11px] text-stone-500 block">Próxima Entrega</span>
                    <span className="text-base font-extrabold text-stone-900 dark:text-white block mt-0.5 tabular-nums">
                      {getNextDelivery()}
                    </span>
                    <span className="text-[10px] text-stone-400">previsão estimada</span>
                  </div>
                </div>
              </div>

              {/* Indique e Ganhe Section */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 sm:p-6 shadow-md border border-emerald-800/40 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Programa Indique e Ganhe 🧄
                    </span>
                    <h4 className="text-lg font-extrabold mt-0.5">
                      Seu Código: <span className="font-mono text-emerald-200">{client.code}</span>
                    </h4>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 text-xs font-semibold transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Código Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-emerald-200 mb-1.5">
                    <span>{referralCount} indicação(ões) registrada(s)</span>
                    <span>Faltam <strong>{Math.max(0, goal - (referralCount % goal))}</strong> para o próximo pote grátis</span>
                  </div>
                  <div className="w-full bg-emerald-950/90 rounded-full h-3 overflow-hidden p-0.5 border border-emerald-700/60">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-emerald-200 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressToNext}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-emerald-200 pt-1 border-t border-emerald-800/40">
                  <span>Potes de 500g ganhos: <strong>{wonRewards}</strong> ({pendingRewards} a receber)</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyShareMessage}
                      className="text-white hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                    >
                      {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{copiedMessage ? 'Texto Copiado!' : 'Copiar Convite'}</span>
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(getShareLinkAndText().text)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Vitrine de Produtos A Mi Gusto */}
              <div className="rounded-2xl bg-white dark:bg-stone-850 p-5 sm:p-6 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Cardápio & Tamanhos Disponíveis
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-stone-900 dark:text-white mt-1">
                      Nossos Produtos de Alho Triturado Fresco 🧄
                    </h4>
                  </div>
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    100% puro · Sem conservantes químicos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productsList.filter(p => p.active !== false).map((prod) => (
                    <div
                      key={prod.id}
                      className={`p-4 rounded-2xl flex flex-col justify-between transition-all bg-stone-50 dark:bg-stone-800/60 border ${
                        prod.isPopular
                          ? 'border-2 border-emerald-600/50 shadow-xs relative bg-gradient-to-b from-emerald-50/40 to-white dark:from-emerald-950/20 dark:to-stone-800/80'
                          : 'border-stone-200 dark:border-stone-700/80 hover:border-emerald-600/40'
                      }`}
                    >
                      {prod.isPopular && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                          ★ Mais Vendido
                        </span>
                      )}

                      <div>
                        {prod.imageUrl && (
                          <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-stone-100 dark:bg-stone-800">
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            {prod.unit}
                          </span>
                          <span className="text-[10px] font-semibold text-stone-500 uppercase">
                            {prod.category}
                          </span>
                        </div>

                        <h5 className="font-bold text-stone-900 dark:text-white text-sm">
                          {prod.name}
                        </h5>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                          {prod.description || 'Alho fresco de altíssima qualidade, pronto para facilitar seu dia a dia na cozinha.'}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-stone-700 space-y-1">
                          {prod.allowSubscription && (
                            <div className="flex justify-between items-baseline text-xs">
                              <span className="text-stone-500">Na Assinatura:</span>
                              <span className="font-black text-emerald-700 dark:text-emerald-400">
                                R$ {(prod.subscriptionPrice || 0).toFixed(2).replace('.', ',')}
                                <span className="text-[10px] font-normal text-stone-400">/pote</span>
                              </span>
                            </div>
                          )}
                          {prod.allowOneOff && (
                            <div className="flex justify-between items-baseline text-xs">
                              <span className="text-stone-500">Compra Avulsa:</span>
                              <span className="font-bold text-stone-700 dark:text-stone-300">
                                R$ {(prod.oneOffPrice || 0).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-4 mt-auto">
                        {prod.allowSubscription ? (
                          <button
                            type="button"
                            onClick={() => {
                              const s = prod.unit.includes('250') ? '250' : prod.unit.includes('1000') || prod.unit.includes('1kg') ? '1000' : '500';
                              setSubSize(s as '250' | '500' | '1000');
                              setShowNewSubForm(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition-colors"
                          >
                            <Repeat className="w-3 h-3" />
                            <span>Assinar</span>
                          </button>
                        ) : (
                          <div className="text-[10px] text-stone-400 text-center flex items-center justify-center italic">
                            Sem assinatura
                          </div>
                        )}

                        {prod.allowOneOff ? (
                          <button
                            type="button"
                            onClick={() => handlePlaceProductOrder(prod.unit, prod.name)}
                            disabled={isPlacingOrder}
                            className="px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3 text-emerald-600" />
                            <span>Avulso</span>
                          </button>
                        ) : (
                          <div className="text-[10px] text-stone-400 text-center flex items-center justify-center italic">
                            Apenas assinatura
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fazer Nova Assinatura de Alho */}
              <div className="rounded-2xl bg-white dark:bg-stone-800 p-5 sm:p-6 border border-emerald-600/30 shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Repeat className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-stone-900 dark:text-white">
                        Fazer Nova Assinatura ou Alterar Plano 📦
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Receba alho triturado fresquinho periodicamente no seu endereço com desconto exclusivo.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNewSubForm(!showNewSubForm)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <span>{showNewSubForm ? 'Recolher Opções' : 'Configurar Nova Assinatura'}</span>
                  </button>
                </div>

                {subSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/40 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{subSuccessMsg}</span>
                  </div>
                )}

                {showNewSubForm && (
                  <form onSubmit={handleCreateSubscription} className="pt-2 space-y-4 animate-in fade-in duration-150 text-xs">
                    {/* Size Selector */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1.5">
                        1. Escolha o Tamanho do Pote:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['250', '500', '1000'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSubSize(s)}
                            className={`p-3 rounded-xl border text-center transition-all ${
                              subSize === s
                                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-600/30'
                                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            <span className="block text-sm font-black">{s === '1000' ? '1kg' : `${s}g`}</span>
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-0.5">
                              R$ {settings.prices[s].toFixed(2).replace('.', ',')}/pote
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Frequency Selector */}
                    <div>
                      <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1.5">
                        2. Frequência de Entrega:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { freq: 4, label: 'Semanal', sub: '4 potes ao mês (1 por semana)' },
                          { freq: 2, label: 'Quinzenal', sub: '2 potes ao mês (a cada 15 dias)' },
                          { freq: 1, label: 'Mensal', sub: '1 pote ao mês' },
                        ].map((item) => (
                          <button
                            key={item.freq}
                            type="button"
                            onClick={() => setSubFreq(item.freq as 1 | 2 | 4)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              subFreq === item.freq
                                ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-600/30'
                                : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-850 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            <span className="block text-xs font-black">{item.label}</span>
                            <span className="text-[10px] text-stone-500 dark:text-stone-400 block mt-0.5">{item.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Date & Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                          3. Data da Primeira Entrega:
                        </label>
                        <input
                          type="date"
                          value={subStartDate}
                          onChange={(e) => setSubStartDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                          Observações de Entrega (Opcional):
                        </label>
                        <input
                          type="text"
                          value={deliveryDateNotes}
                          onChange={(e) => setDeliveryDateNotes(e.target.value)}
                          placeholder="Ex: Interfone 201, deixar na portaria..."
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Real-time Total Calculation and PIX Box */}
                    {(() => {
                      const potMultiplier = subFreq === 4 ? 4 : subFreq === 2 ? 2 : 1;
                      const unitPrice = settings.prices[subSize] || 0;
                      const totalMonthly = unitPrice * potMultiplier;

                      return (
                        <div className="p-4 rounded-xl bg-emerald-900 text-white space-y-3 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/80 pb-2.5">
                            <div>
                              <span className="text-[11px] text-emerald-300 uppercase font-bold tracking-wider block">
                                Resumo do Investimento Mensal
                              </span>
                              <span className="text-xs text-stone-200">
                                {potMultiplier} {potMultiplier > 1 ? 'potes' : 'pote'} de {subSize === '1000' ? '1kg' : `${subSize}g`} ({subFreq === 4 ? 'Semanal' : subFreq === 2 ? 'Quinzenal' : 'Mensal'})
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-black text-emerald-200">
                                R$ {totalMonthly.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-[10px] text-emerald-300 block">valor total no mês</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-950/80 p-3 rounded-lg border border-emerald-700/60">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                                Chave PIX do Dono (A Mi Gusto) para Pagamento:
                              </span>
                              <span className="font-mono text-xs font-black text-white">
                                {settings.pixKey || '21981142230'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={handleCopyPixKey}
                                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                              >
                                {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedPix ? 'Copiado!' : 'Copiar Chave PIX'}</span>
                              </button>
                              <a
                                href={`https://wa.me/55${(settings.whatsapp || '21999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `Olá Marcelo! Sou o cliente ${client.name} (${client.code}). Acabei de assinar o plano ${subSize}g (${subFreq === 4 ? 'Semanal' : subFreq === 2 ? 'Quinzenal' : 'Mensal'}) no valor total de R$ ${totalMonthly.toFixed(2).replace('.', ',')}. Segue o comprovante do PIX:`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Enviar Comprovante</span>
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowNewSubForm(false)}
                              className="px-4 py-2 rounded-xl border border-emerald-700 text-xs font-semibold text-emerald-200 hover:bg-emerald-800/50"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingSub}
                              className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.01] disabled:opacity-50"
                            >
                              {isSubmittingSub ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              <span>Já Realizei o Pagamento & Ativar Assinatura</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </form>
                )}
              </div>

              {/* Modificar Data de Recebimento do Produto */}
              <div className="rounded-2xl bg-white dark:bg-stone-800 p-5 sm:p-6 border border-stone-200 dark:border-stone-700 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-stone-900 dark:text-white">
                        Modificar Data de Recebimento do Produto 📅
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Vai viajar ou precisa adiantar sua entrega? Remarque o dia com 1 clique:
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowChangeDateModal(!showChangeDateModal)}
                    className="px-3.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                    <span>{showChangeDateModal ? 'Fechar Agendamento' : 'Alterar Data de Entrega'}</span>
                  </button>
                </div>

                {deliveryDateSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-600/40 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{deliveryDateSuccessMsg}</span>
                  </div>
                )}

                {showChangeDateModal && (
                  <form onSubmit={handleUpdateDeliveryDate} className="pt-2 space-y-3.5 animate-in fade-in duration-150 text-xs">
                    {/* Quick date shortcuts */}
                    <div>
                      <span className="block text-stone-600 dark:text-stone-400 font-semibold mb-1.5">
                        Atalhos Rápidos:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 1);
                            setNewDeliveryDateInput(d.toISOString().split('T')[0]);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-700 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-700 dark:hover:text-sky-300 font-bold text-xs transition-colors"
                        >
                          Amanhã
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 3);
                            setNewDeliveryDateInput(d.toISOString().split('T')[0]);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-700 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-700 dark:hover:text-sky-300 font-bold text-xs transition-colors"
                        >
                          Daqui a 3 dias
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 7);
                            setNewDeliveryDateInput(d.toISOString().split('T')[0]);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-700 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-700 dark:hover:text-sky-300 font-bold text-xs transition-colors"
                        >
                          Próxima Semana (+7 dias)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                          Selecione o Dia no Calendário: *
                        </label>
                        <input
                          type="date"
                          required
                          value={newDeliveryDateInput}
                          onChange={(e) => setNewDeliveryDateInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 dark:text-stone-300 font-bold mb-1">
                          Instruções Especiais de Recebimento:
                        </label>
                        <input
                          type="text"
                          value={deliveryDateNotes}
                          onChange={(e) => setDeliveryDateNotes(e.target.value)}
                          placeholder="Ex: Entregar após as 14h, deixar com vizinho do 102..."
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={() => setShowChangeDateModal(false)}
                        className="px-3.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingDeliveryDate}
                        className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
                      >
                        {isSavingDeliveryDate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Confirmar Nova Data</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Quick Re-Order Box */}
              <div className="rounded-2xl bg-white dark:bg-stone-800 p-5 border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                      Fazer Novo Pedido (Compra Avulsa)
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Acabou o alho antes da hora? Peça um pote extra para entrega no dia útil seguinte:
                    </p>
                  </div>
                </div>

                {orderSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-700/30 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{orderSuccessMsg}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-white/80 dark:bg-stone-800/80 p-2.5 rounded-lg border border-emerald-600/30">
                      <div>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400 block">Pague primeiro via PIX:</span>
                        <span className="font-mono font-bold text-xs text-stone-900 dark:text-white">{settings.pixKey || '21981142230'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleCopyPixKey}
                          className="px-2.5 py-1 rounded-md bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs"
                        >
                          {copiedPix ? 'Copiado!' : 'Copiar Chave'}
                        </button>
                        <a
                          href={`https://wa.me/55${(settings.whatsapp || '21999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Olá! Sou o cliente ${client.name} (${client.code}). Acabei de pedir 1 pote avulso extra de ${newOrderSize}g e vou enviar o comprovante do PIX:`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar Comprovante</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <select
                    value={newOrderSize}
                    onChange={(e) => setNewOrderSize(e.target.value as '250' | '500' | '1000')}
                    className="px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm font-bold"
                  >
                    <option value="250">250g – R$ {settings.avulsoPrices[250].toFixed(2).replace('.', ',')}</option>
                    <option value="500">500g – R$ {settings.avulsoPrices[500].toFixed(2).replace('.', ',')}</option>
                    <option value="1000">1kg – R$ {settings.avulsoPrices[1000].toFixed(2).replace('.', ',')}</option>
                  </select>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isPlacingOrder ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PlusCircle className="w-4 h-4" />
                    )}
                    <span>Pedir Agora (Avulso)</span>
                  </button>
                </div>
              </div>

              {/* Order History Table */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>Histórico de Compras ({client.hist.length})</span>
                  </h4>
                  <span className="text-[11px] text-stone-400">
                    Pedidos feitos por engano podem ser excluídos na coluna de Ações.
                  </span>
                </div>

                {orderDeleteMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{orderDeleteMsg}</span>
                  </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Data Compra</th>
                        <th className="py-2.5 px-3">Entrega</th>
                        <th className="py-2.5 px-3">Pote</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Status Entrega</th>
                        <th className="py-2.5 px-3 text-right">Valor</th>
                        <th className="py-2.5 px-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {client.hist.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-stone-400">
                            Nenhuma compra registrada ainda.
                          </td>
                        </tr>
                      ) : (
                        client.hist
                          .slice()
                          .reverse()
                          .map((order, idx) => {
                            const st = order.deliveryStatus || 'recebido';
                            return (
                              <tr key={order.id || idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                                <td className="py-2.5 px-3 font-medium">
                                  {order.date.split('-').reverse().join('/')}
                                </td>
                                <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400 font-medium">
                                  {order.deliveryDate
                                    ? order.deliveryDate.split('-').reverse().join('/')
                                    : '—'}
                                </td>
                                <td className="py-2.5 px-3 font-bold">{order.size}g</td>
                                <td className="py-2.5 px-3 capitalize">{order.type}</td>
                                <td className="py-2.5 px-3">
                                  {st === 'recebido' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                                      Confirmado
                                    </span>
                                  )}
                                  {st === 'preparando' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                      Em Moagem
                                    </span>
                                  )}
                                  {st === 'saiu_entrega' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 flex items-center gap-1 w-fit">
                                      <Bike className="w-3 h-3" />
                                      <span>Saiu p/ Entrega</span>
                                    </span>
                                  )}
                                  {st === 'entregue' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                      Entregue
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-semibold">
                                  R$ {order.val.toFixed(2).replace('.', ',')}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setOrderToDelete(order)}
                                    title="Excluir pedido feito por engano"
                                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span className="hidden sm:inline text-[11px] font-semibold text-rose-600 dark:text-rose-400">Excluir</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Comunidade A Mi Gusto · Apoio ao Cliente (Divulgação de Empresa do Cliente - Parceria de 3 Meses por R$ 100,00 - SEMPRE EM ÚLTIMO) */}
              <div className="rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-emerald-950 text-white p-5 sm:p-6 shadow-lg border border-emerald-800/50 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-800/80 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-600/30">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Comunidade A Mi Gusto · Apoio ao Cliente
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-black mt-0.5 text-white">
                        Divulgue sua Empresa ou Serviço na A Mi Gusto 🤝
                      </h4>
                    </div>
                  </div>

                  <span className="text-[11px] text-emerald-300 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-700/40">
                    Linha Direta com o Marcelo (Dono)
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  Você é nosso cliente e tem uma <strong>empresa, comércio, loja, ateliê ou presta algum serviço</strong>?
                  Aqui na A Mi Gusto nós gostamos de apoiar quem caminha com a gente!
                  Por uma contribuição simbólica de apenas <strong>R$ 100,00</strong>, divulgamos a sua empresa em destaque no meio da página principal do nosso site por <strong>3 meses inteiros</strong> (equivale a cerca de R$ 33 por mês).
                  Seu banner pode ter fotos ou vídeo do seu trabalho, descrição e botão com link direto para o seu WhatsApp, Instagram ou site!
                </p>

                {/* 3 Simple and Clear Benefit Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>R$ 100,00 Simbólico</span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Valor único e acessível para 3 meses completos de divulgação.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>3 Meses de Destaque</span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Exibição contínua no meio da Home Page para todos os clientes.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Fotos ou Vídeos</span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Banner adaptado para celular e computador com link para o seu contato.
                    </p>
                  </div>
                </div>

                {partnershipSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{partnershipSuccessMsg}</span>
                  </div>
                )}

                {/* Direct Line Actions */}
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <a
                    href={`https://wa.me/55${(settings.whatsapp || '21999999999').replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá Marcelo! Sou o cliente ${client.name} (código ${client.code}). Gostaria de divulgar minha empresa na página da A Mi Gusto pela parceria de 3 meses por R$ 100,00!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all hover:scale-[1.02]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Conversar com o Marcelo no WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowPartnershipForm(!showPartnershipForm)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors border border-white/20"
                  >
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>{showPartnershipForm ? 'Fechar Formulário' : 'Quero Divulgar Minha Empresa (Preencher Dados)'}</span>
                  </button>
                </div>

                {/* Friendly Company Details Form */}
                {showPartnershipForm && (
                  <form onSubmit={handleSendPartnershipInquiry} className="p-4 rounded-xl bg-stone-950/80 border border-emerald-700/40 space-y-3.5 mt-3 animate-in fade-in duration-150 text-xs">
                    <div>
                      <span className="font-bold text-white block text-sm">
                        Preencha os dados da sua empresa ou serviço:
                      </span>
                      <p className="text-stone-400 text-[11px] mt-0.5">
                        O Marcelo entrará em contato para pegar suas fotos/vídeos e montar o seu banner personalizado na Home Page.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-stone-300 block mb-1 font-semibold">Nome da sua Empresa ou Negócio *</label>
                        <input
                          type="text"
                          required
                          value={partnershipCompanyName}
                          onChange={(e) => setPartnershipCompanyName(e.target.value)}
                          placeholder="Ex: Ateliê Doce Sabor, Oficina do Beto..."
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                        />
                      </div>

                      <div>
                        <label className="text-stone-300 block mb-1 font-semibold">O que sua empresa faz ou oferece *</label>
                        <select
                          value={partnershipBusinessType}
                          onChange={(e) => setPartnershipBusinessType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white"
                        >
                          <option value="Comércio / Loja">Comércio / Loja de Produtos</option>
                          <option value="Restaurante / Gastronomia">Restaurante / Lanchonete / Gastronomia</option>
                          <option value="Doces & Bolos Caseiros">Doces, Bolos & Confeitaria</option>
                          <option value="Serviços Profissionais">Serviços Profissionais / Escritório</option>
                          <option value="Saúde & Beleza">Saúde, Beleza & Estética</option>
                          <option value="Artesanato & Moda">Artesanato & Moda</option>
                          <option value="Oficina & Manutenção">Oficina, Reparos & Manutenção</option>
                          <option value="Outro">Outro tipo de negócio</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-stone-300 block mb-1 font-semibold">Link ou WhatsApp da sua Empresa</label>
                        <input
                          type="text"
                          value={partnershipCompanyContact}
                          onChange={(e) => setPartnershipCompanyContact(e.target.value)}
                          placeholder="Ex: Link do Instagram, WhatsApp da loja ou site"
                          className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                        />
                      </div>

                      <div>
                        <label className="text-stone-300 block mb-1 font-semibold">Seu WhatsApp de Cliente (para retorno do Marcelo)</label>
                        <input
                          type="text"
                          readOnly
                          value={client.wpp}
                          className="w-full px-3 py-2 rounded-xl bg-stone-900/60 border border-stone-800 text-stone-400"
                        />
                      </div>
                    </div>

                    {/* Foto ou Logo da Empresa */}
                    <div>
                      <label className="text-stone-300 block mb-1 font-semibold">
                        Foto da Fachada, Logo ou Produto (Opcional)
                      </label>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-900 border border-stone-700">
                        {partnershipPhotoUrl ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-emerald-500 shrink-0">
                            <img src={partnershipPhotoUrl} alt="Logo preview" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-stone-800 text-stone-400 flex items-center justify-center shrink-0">
                            {isUploadingPartnershipPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{partnershipPhotoUrl ? 'Trocar Foto/Logo' : 'Enviar Foto do Celular'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isUploadingPartnershipPhoto}
                                className="hidden"
                                onChange={handlePartnershipPhotoUpload}
                              />
                            </label>
                            {partnershipPhotoUrl && (
                              <button
                                type="button"
                                onClick={() => setPartnershipPhotoUrl('')}
                                className="text-xs text-red-400 hover:underline flex items-center gap-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remover</span>
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400">
                            Anexe uma imagem da sua marca ou trabalho para o Marcelo preparar seu banner.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-stone-300 block mb-1 font-semibold">Conte um pouco sobre o que gostaria de divulgar</label>
                      <textarea
                        rows={2}
                        value={partnershipMsg}
                        onChange={(e) => setPartnershipMsg(e.target.value)}
                        placeholder="Ex: Gostaria de divulgar nossos bolos caseiros e kits de festa com foto e link para nosso WhatsApp."
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white placeholder-stone-500"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-amber-300 font-semibold">
                        💡 Valor simbólico: R$ 100,00 por 3 meses de divulgação
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPartnershipForm(false)}
                          className="px-3.5 py-1.5 rounded-lg border border-stone-700 text-stone-300 hover:bg-stone-800"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={isSendingPartnership}
                          className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          {isSendingPartnership ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Enviar Dados para o Marcelo</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Confirmação: Excluir Pedido Feito por Engano */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-stone-900 dark:text-white">
                Excluir Pedido Feito por Engano?
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Você está prestes a excluir o pedido de <strong>{orderToDelete.size}g ({orderToDelete.type === 'assinatura' ? 'Assinatura' : 'Compra Avulsa'})</strong> no valor de <strong>R$ {orderToDelete.val.toFixed(2).replace('.', ',')}</strong>, registrado em <strong>{orderToDelete.date.split('-').reverse().join('/')}</strong>.
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
                Esta ação cancelará o pedido e o removerá imediatamente do seu histórico e do controle de entregas.
              </p>
            </div>

            {orderDeleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {orderDeleteError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOrderToDelete(null);
                  setOrderDeleteError('');
                }}
                disabled={isDeletingOrder}
                className="flex-1 py-2.5 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Voltar / Manter Pedido
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteOrder(orderToDelete)}
                disabled={isDeletingOrder}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                {isDeletingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Sim, Excluir Pedido</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
