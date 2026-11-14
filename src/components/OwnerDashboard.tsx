import React, { useState, useEffect, useMemo } from 'react';
import type {
  Client,
  AppSettings,
  DashboardStats,
  DeliveryStatus,
  PartnerBanner,
  Product,
  FinancialTransaction,
  FinancialSummary,
  Testimonial,
} from '../types.js';
import { api, createRealtimeSocket } from '../api.js';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Shield,
  X,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Gift,
  Search,
  DollarSign,
  Download,
  Copy,
  Check,
  Save,
  Edit3,
  Trash2,
  Plus,
  PlusCircle,
  Lock,
  MessageCircle,
  Truck,
  Cake,
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Eye,
  EyeOff,
  ShoppingBag,
  Weight,
  CheckCircle2,
  Radio,
  Send,
  Key,
  Sparkles,
  Clock,
  Mail,
  Handshake,
  Video,
  Image,
  Smartphone,
  Monitor,
  Upload,
  Camera,
  Package,
  Wallet,
  Receipt,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Star,
  MessageSquarePlus,
  RotateCcw,
  MapPin,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsUpdated: (newSettings: AppSettings) => void;
  onImpersonateClient?: (client: Client) => void;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

/** Client-side image compressor & resizer: handles high-res smartphone photos smoothly */
const compressAndResizeImage = (file: File, maxDim = 1200, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
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
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve(dataUrl);
        } catch {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const OwnerDashboard: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onSettingsUpdated,
  onImpersonateClient,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'metrics' | 'finance' | 'products' | 'testimonials' | 'clients' | 'client-view' | 'partners' | 'analytics' | 'prices'>('metrics');

  // Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Products Management States (Novos Produtos & Preços)
  const [products, setProducts] = useState<Product[]>(settings.products || []);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [isUploadingProductPhoto, setIsUploadingProductPhoto] = useState(false);
  const [isUploadingPartnerPhoto, setIsUploadingPartnerPhoto] = useState(false);
  const [editingProductData, setEditingProductData] = useState<Partial<Product>>({
    name: '',
    unit: '500g',
    category: 'Alho Fresco',
    description: '',
    imageUrl: '',
    allowSubscription: true,
    allowOneOff: true,
    subscriptionPrice: 20,
    oneOffPrice: 25,
    active: true,
    isPopular: false,
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSaveMsg, setProductSaveMsg] = useState('');
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Financial Management States (Área Financeira & Fluxo de Caixa)
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [isEditingTx, setIsEditingTx] = useState(false);
  const [editingTxData, setEditingTxData] = useState<Partial<FinancialTransaction>>({
    type: 'despesa',
    category: 'materia_prima',
    description: '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'pix',
    status: 'confirmado',
    notes: '',
  });
  const [isSavingTx, setIsSavingTx] = useState(false);
  const [txSaveMsg, setTxSaveMsg] = useState('');
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [financeFilterType, setFinanceFilterType] = useState<'all' | 'receita' | 'despesa' | 'pendente'>('all');
  const [financeFilterCategory, setFinanceFilterCategory] = useState<string>('all');
  const [financeSearchQuery, setFinanceSearchQuery] = useState('');
  const [financeMonthFilter, setFinanceMonthFilter] = useState('');
  const [isResettingFinance, setIsResettingFinance] = useState(false);

  // Testimonials Management States (Depoimentos Reais de Clientes)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isEditingTestimonial, setIsEditingTestimonial] = useState(false);
  const [isUploadingTestimonialPhoto, setIsUploadingTestimonialPhoto] = useState(false);
  const [editingTestimonialData, setEditingTestimonialData] = useState<Partial<Testimonial>>({
    name: '',
    roleOrProfile: 'Assinante A Mi Gusto',
    neighborhood: '',
    city: 'Rio de Janeiro',
    planOrProduct: 'Pote 500g (Assinatura Quinzenal)',
    rating: 5,
    date: 'Hoje',
    content: '',
    verified: true,
    category: 'assinantes',
    avatarUrl: '',
    highlightTag: 'Cliente Verificado ⭐',
    helpfulCount: 0,
    active: true,
  });
  const [isSavingTestimonial, setIsSavingTestimonial] = useState(false);
  const [testimonialSaveMsg, setTestimonialSaveMsg] = useState('');
  const [deletingTestimonialId, setDeletingTestimonialId] = useState<string | null>(null);

  // Partners Management States
  const [partners, setPartners] = useState<PartnerBanner[]>(settings.partners || []);
  const [isEditingPartner, setIsEditingPartner] = useState(false);
  const [editingPartnerData, setEditingPartnerData] = useState<Partial<PartnerBanner>>({
    partnerName: '',
    title: '',
    description: '',
    mediaType: 'image',
    mediaUrl: '',
    mobileMediaUrl: '',
    linkUrl: '',
    buttonText: 'Conhecer Parceiro',
    badge: 'Restaurante Parceiro',
    active: true,
  });
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [partnerSaveMsg, setPartnerSaveMsg] = useState('');
  const [deletingPartnerId, setDeletingPartnerId] = useState<string | null>(null);

  // Impersonation selector in "Ver como Cliente" tab
  const [selectedClientForViewCode, setSelectedClientForViewCode] = useState<string>('');

  // Selected client for modal edit
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Client>>({});
  const [newClientPassword, setNewClientPassword] = useState('');
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [clientSaveMsg, setClientSaveMsg] = useState('');

  // New purchase inside client modal
  const [newOrderDate, setNewOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [newOrderSize, setNewOrderSize] = useState<'250' | '500' | '1000'>('500');
  const [newOrderType, setNewOrderType] = useState<'assinatura' | 'avulsa'>('avulsa');

  // Prices form state
  const [priceForm, setPriceForm] = useState({
    sub250: String(settings.prices?.[250] ?? 13),
    sub500: String(settings.prices?.[500] ?? 20),
    sub1000: String(settings.prices?.[1000] ?? 36),
    av250: String(settings.avulsoPrices?.[250] ?? 15),
    av500: String(settings.avulsoPrices?.[500] ?? 25),
    av1000: String(settings.avulsoPrices?.[1000] ?? 40),
    goal: String(settings.goal ?? 10),
    whatsapp: settings.whatsapp || '21981142230',
    pixKey: settings.pixKey || '21981142230',
    newOwnerPassword: '',
  });
  const [priceSaveMsg, setPriceSaveMsg] = useState('');
  const [isSavingPrices, setIsSavingPrices] = useState(false);

  // CSV feedback
  const [csvCopied, setCsvCopied] = useState(false);
  const [activatingCode, setActivatingCode] = useState<string | null>(null);

  // Password Recovery & Reveal States (Requirement: Dono ver a senha do cliente)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [isModalPasswordRevealed, setIsModalPasswordRevealed] = useState(false);
  const [copiedPasswordCode, setCopiedPasswordCode] = useState<string | null>(null);
  const [modalPasswordCopied, setModalPasswordCopied] = useState(false);

  // Real-time iFood Delivery Tracking States (Requirement: Sincronização em tempo real)
  const [wsConnected, setWsConnected] = useState(true);
  const [updatingDeliveryId, setUpdatingDeliveryId] = useState<string | null>(null);
  const [driverDrafts, setDriverDrafts] = useState<Record<string, { driverName: string; driverPhone: string; estimatedMinutes: number }>>({});

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      refreshAll();

      // Connect to WebSocket for instant real-time synchronization between owner and client
      const cleanup = createRealtimeSocket((event) => {
        setWsConnected(true);
        if (event.type === 'PARTNERS_UPDATED') {
          setPartners(event.partners);
        } else if (event.type === 'PRODUCTS_UPDATED') {
          setProducts(event.products);
        } else if (event.type === 'TESTIMONIALS_UPDATED') {
          setTestimonials(event.testimonials);
        } else if (event.type === 'CONFIG_UPDATED') {
          onSettingsUpdated(event.settings);
        } else if (event.type === 'FINANCE_UPDATED') {
          api.getFinancialSummary().then(res => {
            setFinancialSummary(res);
            setFinancialTransactions(res.transactions);
          }).catch(console.error);
        } else {
          refreshAll();
        }
      });

      return () => {
        cleanup();
      };
    }
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    if (settings) {
      setPriceForm({
        sub250: String(settings.prices?.[250] ?? 13),
        sub500: String(settings.prices?.[500] ?? 20),
        sub1000: String(settings.prices?.[1000] ?? 36),
        av250: String(settings.avulsoPrices?.[250] ?? 15),
        av500: String(settings.avulsoPrices?.[500] ?? 25),
        av1000: String(settings.avulsoPrices?.[1000] ?? 40),
        goal: String(settings.goal ?? 10),
        whatsapp: settings.whatsapp || '21981142230',
        pixKey: settings.pixKey || '21981142230',
        newOwnerPassword: '',
      });
      if (settings.partners) {
        setPartners(settings.partners);
      }
      if (settings.products) {
        setProducts(settings.products);
      }
    }
  }, [settings]);

  const refreshAll = async () => {
    setIsLoadingData(true);
    try {
      const [sData, cData, pData, prodData, finData, testData] = await Promise.all([
        api.getStats(),
        api.getClients(),
        api.getPartners().catch(() => settings.partners || []),
        api.getProducts().catch(() => settings.products || []),
        api.getFinancialSummary().catch(() => null),
        api.getTestimonials().catch(() => []),
      ]);
      setStats(sData);
      setClients(cData);
      setPartners(pData);
      setProducts(prodData);
      setTestimonials(testData);
      setFinancialSummary(finData);
      if (finData?.transactions) {
        setFinancialTransactions(finData.transactions);
      }
      if (cData.length > 0 && !selectedClientForViewCode) {
        setSelectedClientForViewCode(cData[0].code);
      }
    } catch (err) {
      console.error('Error refreshing owner data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return financialTransactions.filter(tx => {
      if (financeFilterType === 'receita' && tx.type !== 'receita') return false;
      if (financeFilterType === 'despesa' && tx.type !== 'despesa') return false;
      if (financeFilterType === 'pendente' && tx.status !== 'pendente') return false;
      if (financeFilterCategory !== 'all' && tx.category !== financeFilterCategory) return false;
      if (financeMonthFilter && !tx.date.startsWith(financeMonthFilter)) return false;
      if (financeSearchQuery.trim()) {
        const q = financeSearchQuery.toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        const client = (tx.clientName || '').toLowerCase();
        const notes = (tx.notes || '').toLowerCase();
        const method = (tx.paymentMethod || '').toLowerCase();
        if (!desc.includes(q) && !client.includes(q) && !notes.includes(q) && !method.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [financialTransactions, financeFilterType, financeFilterCategory, financeMonthFilter, financeSearchQuery]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);
    try {
      await api.ownerLogin(passwordInput);
      setIsAuthenticated(true);
      setPasswordInput('');
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Senha incorreta');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const toggleRevealPassword = (code: string) => {
    setRevealedPasswords(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const handleCopyPassword = (pw: string, code: string) => {
    navigator.clipboard.writeText(pw);
    setCopiedPasswordCode(code);
    setTimeout(() => setCopiedPasswordCode(null), 2500);
  };

  const handleCopyModalPassword = (pw: string) => {
    navigator.clipboard.writeText(pw);
    setModalPasswordCopied(true);
    setTimeout(() => setModalPasswordCopied(false), 2500);
  };

  const handleUpdateDeliveryStage = async (
    clientCode: string,
    orderId: string,
    stage: DeliveryStatus,
    driverName?: string,
    driverPhone?: string,
    estimatedMinutes?: number,
    notes?: string
  ) => {
    setUpdatingDeliveryId(orderId);
    try {
      await api.updateDeliveryStatus(clientCode, orderId, {
        deliveryStatus: stage,
        driverName: driverName || 'Marcos Silva (Entregador A Mi Gusto)',
        driverPhone: driverPhone || '(21) 98765-4321',
        estimatedMinutes: estimatedMinutes || 25,
        deliveryNotes: notes,
      });
      await refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar entrega');
    } finally {
      setUpdatingDeliveryId(null);
    }
  };

  const handleOpenClient = (client: Client) => {
    setSelectedClient(client);
    setIsModalPasswordRevealed(false);
    setModalPasswordCopied(false);
    setEditFormData({ ...client });
    setNewClientPassword('');
    setClientSaveMsg('');
    setNewOrderSize(client.size);
    setNewOrderType(client.type);
  };

  const handleSaveClientChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setIsSavingClient(true);
    setClientSaveMsg('');
    try {
      const updated = await api.updateClient(selectedClient.code, {
        ...editFormData,
        newPassword: newClientPassword.trim() || undefined,
      });
      setSelectedClient(updated.client);
      setClientSaveMsg('Dados do cliente alterados com sucesso no banco de dados!');
      refreshAll();
    } catch (err: unknown) {
      setClientSaveMsg(err instanceof Error ? err.message : 'Erro ao salvar alterações');
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleDeleteClient = async (code: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente ${code}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await api.deleteClient(code);
      setSelectedClient(null);
      refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
    }
  };

  const handleAddClientOrder = async () => {
    if (!selectedClient) return;
    try {
      await api.addOrder(selectedClient.code, {
        size: newOrderSize,
        type: newOrderType,
        date: newOrderDate,
      });
      const updated = await api.getClient(selectedClient.code);
      setSelectedClient(updated);
      setEditFormData({ ...updated });
      refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao registrar compra');
    }
  };

  const handleRemoveClientOrder = async (orderId: string) => {
    if (!selectedClient) return;
    if (!confirm('Remover esta compra do histórico do cliente?')) return;
    try {
      await api.removeOrder(selectedClient.code, orderId);
      const updated = await api.getClient(selectedClient.code);
      setSelectedClient(updated);
      setEditFormData({ ...updated });
      refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao remover compra');
    }
  };

  const handleMarkRewardSent = async (code: string) => {
    try {
      await api.markRewardSent(code);
      refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao atualizar brinde');
    }
  };

  const handleSavePrices = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrices(true);
    setPriceSaveMsg('');

    const parseNum = (val: unknown, fallback: number): number => {
      if (val === undefined || val === null || val === '') return fallback;
      if (typeof val === 'number') return isNaN(val) ? fallback : val;
      const clean = String(val).replace(',', '.').trim();
      const n = parseFloat(clean);
      return isNaN(n) ? fallback : n;
    };

    try {
      const payload = {
        prices: {
          250: parseNum(priceForm.sub250, 13),
          500: parseNum(priceForm.sub500, 20),
          1000: parseNum(priceForm.sub1000, 36),
        },
        avulsoPrices: {
          250: parseNum(priceForm.av250, 15),
          500: parseNum(priceForm.av500, 25),
          1000: parseNum(priceForm.av1000, 40),
        },
        goal: Math.max(1, Math.round(parseNum(priceForm.goal, 10))),
        whatsapp: priceForm.whatsapp ? String(priceForm.whatsapp).replace(/\D/g, '') : '21981142230',
        pixKey: priceForm.pixKey?.trim() || '21981142230',
        newOwnerPassword: priceForm.newOwnerPassword?.trim() || undefined,
      };

      const updated = await api.updateConfig(payload);
      onSettingsUpdated(updated);
      setPriceSaveMsg('Tabela de preços e configurações salvas com sucesso!');
      setPriceForm(prev => ({
        ...prev,
        sub250: String(payload.prices[250]),
        sub500: String(payload.prices[500]),
        sub1000: String(payload.prices[1000]),
        av250: String(payload.avulsoPrices[250]),
        av500: String(payload.avulsoPrices[500]),
        av1000: String(payload.avulsoPrices[1000]),
        goal: String(payload.goal),
        whatsapp: payload.whatsapp,
        pixKey: payload.pixKey,
        newOwnerPassword: '',
      }));
      await refreshAll();
    } catch (err: unknown) {
      console.error('Error saving prices:', err);
      setPriceSaveMsg(err instanceof Error ? err.message : 'Erro ao salvar configurações');
    } finally {
      setIsSavingPrices(false);
    }
  };

  const handleOpenNewPartner = () => {
    const exp = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setEditingPartnerData({
      partnerName: '',
      clientCode: '',
      title: '',
      description: '',
      mediaType: 'image',
      mediaUrl: '',
      mobileMediaUrl: '',
      linkUrl: '',
      buttonText: 'Conhecer Empresa',
      badge: 'Empresa Parceira',
      price: 100,
      durationMonths: 3,
      expiresAt: exp,
      active: true,
      order: partners.length + 1,
    });
    setPartnerSaveMsg('');
    setIsEditingPartner(true);
  };

  const handleEditPartner = (p: PartnerBanner) => {
    setEditingPartnerData({ ...p });
    setPartnerSaveMsg('');
    setIsEditingPartner(true);
  };

  const handlePartnerFileUpload = async (file: File, target: 'desktop' | 'mobile') => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setIsUploadingPartnerPhoto(true);
    try {
      if (isVideo) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setEditingPartnerData(prev => ({
            ...prev,
            mediaType: 'video',
            [target === 'desktop' ? 'mediaUrl' : 'mobileMediaUrl']: dataUrl,
          }));
          setIsUploadingPartnerPhoto(false);
        };
        reader.readAsDataURL(file);
      } else {
        const dataUrl = await compressAndResizeImage(file, 1400, 0.85);
        setEditingPartnerData(prev => ({
          ...prev,
          mediaType: 'image',
          [target === 'desktop' ? 'mediaUrl' : 'mobileMediaUrl']: dataUrl,
        }));
        setIsUploadingPartnerPhoto(false);
      }
    } catch (err) {
      console.error('Erro ao processar mídia de parceiro:', err);
      setIsUploadingPartnerPhoto(false);
      alert('Não foi possível carregar a imagem. Tente outro arquivo.');
    }
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartnerData.partnerName || !editingPartnerData.title || !editingPartnerData.mediaUrl) {
      setPartnerSaveMsg('Preencha o nome do parceiro, título e adicione uma imagem ou vídeo.');
      return;
    }
    setIsSavingPartner(true);
    setPartnerSaveMsg('');
    try {
      await api.savePartner(editingPartnerData);
      setPartnerSaveMsg('Banner de parceiro salvo com sucesso!');
      await refreshAll();
      setTimeout(() => {
        setIsEditingPartner(false);
        setPartnerSaveMsg('');
      }, 1200);
    } catch (err: unknown) {
      setPartnerSaveMsg(err instanceof Error ? err.message : 'Erro ao salvar parceiro');
    } finally {
      setIsSavingPartner(false);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este banner de parceiro?')) return;
    setDeletingPartnerId(id);
    try {
      await api.deletePartner(id);
      await refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir parceiro');
    } finally {
      setDeletingPartnerId(null);
    }
  };

  const handleTogglePartnerActive = async (p: PartnerBanner) => {
    try {
      await api.savePartner({ id: p.id, active: !p.active });
      await refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao alternar status do parceiro');
    }
  };

  // ==========================================
  // PRODUCTS MANAGEMENT HANDLERS
  // ==========================================
  const handleOpenNewProduct = () => {
    setEditingProductData({
      name: '',
      unit: '500g',
      category: 'Alho Fresco',
      description: '',
      imageUrl: '',
      allowSubscription: true,
      allowOneOff: true,
      subscriptionPrice: 20,
      oneOffPrice: 25,
      active: true,
      isPopular: false,
      order: products.length + 1,
    });
    setProductSaveMsg('');
    setIsEditingProduct(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProductData({
      ...prod,
      subscriptionPrice: prod.subscriptionPrice ?? 20,
      oneOffPrice: prod.oneOffPrice ?? 25,
      allowSubscription: prod.allowSubscription !== false,
      allowOneOff: prod.allowOneOff !== false,
      active: prod.active !== false,
    });
    setProductSaveMsg('');
    setIsEditingProduct(true);
  };

  const handleProductFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingProductPhoto(true);
    try {
      const dataUrl = await compressAndResizeImage(file, 1000, 0.85);
      setEditingProductData(prev => ({
        ...prev,
        imageUrl: dataUrl,
      }));
    } catch (err) {
      console.error('Erro ao processar foto do produto:', err);
      alert('Não foi possível carregar a imagem. Tente outro arquivo.');
    } finally {
      setIsUploadingProductPhoto(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductData.name?.trim() || !editingProductData.unit?.trim()) {
      setProductSaveMsg('Nome e unidade do produto são obrigatórios.');
      return;
    }
    if (editingProductData.allowSubscription === false && editingProductData.allowOneOff === false) {
      setProductSaveMsg('O produto deve ter ao menos uma modalidade ativa (Assinatura ou Compra Avulsa).');
      return;
    }
    setIsSavingProduct(true);
    setProductSaveMsg('');
    try {
      const payload: Partial<Product> = {
        ...editingProductData,
        name: editingProductData.name.trim(),
        unit: editingProductData.unit.trim(),
        description: editingProductData.description?.trim() || '',
        imageUrl: editingProductData.imageUrl?.trim() || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        subscriptionPrice: Number(editingProductData.subscriptionPrice) || 0,
        oneOffPrice: Number(editingProductData.oneOffPrice) || 0,
        allowSubscription: editingProductData.allowSubscription !== false,
        allowOneOff: editingProductData.allowOneOff !== false,
        active: editingProductData.active !== false,
      };
      await api.saveProduct(payload);
      setProductSaveMsg('Produto salvo com sucesso!');
      await refreshAll();
      setTimeout(() => {
        setIsEditingProduct(false);
        setProductSaveMsg('');
      }, 1000);
    } catch (err: unknown) {
      setProductSaveMsg(err instanceof Error ? err.message : 'Erro ao salvar produto');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleToggleProductActive = async (prod: Product) => {
    try {
      await api.saveProduct({ id: prod.id, active: !prod.active });
      await refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao alternar status do produto');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto do catálogo?')) return;
    setDeletingProductId(id);
    try {
      await api.deleteProduct(id);
      await refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir produto');
    } finally {
      setDeletingProductId(null);
    }
  };

  // ==========================================
  // FINANCIAL MANAGEMENT HANDLERS
  // ==========================================
  const handleOpenNewTx = (type: 'receita' | 'despesa' = 'despesa') => {
    setEditingTxData({
      type,
      category: type === 'despesa' ? 'materia_prima' : 'venda_avulsa',
      description: '',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'pix',
      status: 'confirmado',
      notes: '',
    });
    setTxSaveMsg('');
    setIsEditingTx(true);
  };

  const handleEditTx = (tx: FinancialTransaction) => {
    setEditingTxData({ ...tx });
    setTxSaveMsg('');
    setIsEditingTx(true);
  };

  const handleSaveFinancialTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTxData.description || editingTxData.amount === undefined || isNaN(Number(editingTxData.amount))) {
      setTxSaveMsg('Informe a descrição e um valor numérico válido.');
      return;
    }
    setIsSavingTx(true);
    setTxSaveMsg('');
    try {
      await api.saveFinancialTransaction({
        ...editingTxData,
        amount: Number(editingTxData.amount),
      });
      setTxSaveMsg('Lançamento financeiro registrado com sucesso!');
      await refreshAll();
      setTimeout(() => {
        setIsEditingTx(false);
        setTxSaveMsg('');
      }, 1000);
    } catch (err: unknown) {
      setTxSaveMsg(err instanceof Error ? err.message : 'Erro ao salvar lançamento');
    } finally {
      setIsSavingTx(false);
    }
  };

  const handleDeleteFinancialTx = async (id: string) => {
    if (!confirm('Deseja realmente excluir este lançamento financeiro? Esta ação não pode ser desfeita.')) return;
    setDeletingTxId(id);
    try {
      await api.deleteFinancialTransaction(id);
      await refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir lançamento');
    } finally {
      setDeletingTxId(null);
    }
  };

  const handleConfirmPixTx = async (tx: FinancialTransaction) => {
    try {
      await api.saveFinancialTransaction({ id: tx.id, status: 'confirmado' });
      await refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao confirmar pagamento PIX');
    }
  };

  const handleResetFinance = async () => {
    if (!confirm('Tem certeza que deseja ZERAR todos os lançamentos da Área Financeira para começar do zero?')) {
      return;
    }
    setIsResettingFinance(true);
    try {
      await api.resetFinancialTransactions();
      await refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao zerar área financeira');
    } finally {
      setIsResettingFinance(false);
    }
  };

  // ==========================================
  // TESTIMONIALS MANAGEMENT HANDLERS
  // ==========================================
  const handleOpenNewTestimonial = () => {
    setEditingTestimonialData({
      name: '',
      roleOrProfile: 'Assinante A Mi Gusto',
      neighborhood: '',
      city: 'Rio de Janeiro',
      planOrProduct: 'Pote 500g (Assinatura Quinzenal)',
      rating: 5,
      date: 'Hoje',
      content: '',
      verified: true,
      category: 'assinantes',
      avatarUrl: '',
      highlightTag: 'Cliente Verificado ⭐',
      helpfulCount: 0,
      active: true,
    });
    setTestimonialSaveMsg('');
    setIsEditingTestimonial(true);
  };

  const handleEditTestimonial = (item: Testimonial) => {
    setEditingTestimonialData({
      ...item,
      active: item.active !== false,
      verified: item.verified !== false,
      rating: item.rating || 5,
    });
    setTestimonialSaveMsg('');
    setIsEditingTestimonial(true);
  };

  const handleTestimonialPhotoUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingTestimonialPhoto(true);
    try {
      const dataUrl = await compressAndResizeImage(file, 500, 0.85);
      setEditingTestimonialData(prev => ({
        ...prev,
        avatarUrl: dataUrl,
      }));
    } catch (err) {
      console.error('Erro ao processar foto do depoimento:', err);
      alert('Não foi possível carregar a foto. Tente outro arquivo.');
    } finally {
      setIsUploadingTestimonialPhoto(false);
    }
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonialData.name?.trim() || !editingTestimonialData.content?.trim()) {
      setTestimonialSaveMsg('Preencha o nome do cliente e o texto do depoimento.');
      return;
    }
    setIsSavingTestimonial(true);
    setTestimonialSaveMsg('');
    try {
      const payload: Partial<Testimonial> = {
        ...editingTestimonialData,
        name: editingTestimonialData.name.trim(),
        roleOrProfile: editingTestimonialData.roleOrProfile?.trim() || 'Cliente A Mi Gusto',
        neighborhood: editingTestimonialData.neighborhood?.trim() || 'Rio de Janeiro',
        city: editingTestimonialData.city?.trim() || 'Rio de Janeiro',
        planOrProduct: editingTestimonialData.planOrProduct?.trim() || 'Pote 500g',
        rating: Number(editingTestimonialData.rating) || 5,
        date: editingTestimonialData.date?.trim() || 'Hoje',
        content: editingTestimonialData.content.trim(),
        verified: editingTestimonialData.verified !== false,
        category: editingTestimonialData.category || 'assinantes',
        avatarUrl: editingTestimonialData.avatarUrl?.trim() || '',
        highlightTag: editingTestimonialData.highlightTag?.trim() || '',
        helpfulCount: Number(editingTestimonialData.helpfulCount) || 0,
        active: editingTestimonialData.active !== false,
      };
      if (payload.id) {
        await api.updateTestimonial(payload.id, payload);
      } else {
        await api.saveTestimonial(payload);
      }
      setTestimonialSaveMsg('Depoimento salvo com sucesso!');
      await refreshAll();
      setTimeout(() => {
        setIsEditingTestimonial(false);
        setTestimonialSaveMsg('');
      }, 900);
    } catch (err: unknown) {
      setTestimonialSaveMsg(err instanceof Error ? err.message : 'Erro ao salvar depoimento');
    } finally {
      setIsSavingTestimonial(false);
    }
  };

  const handleToggleTestimonialActive = async (item: Testimonial) => {
    try {
      await api.updateTestimonial(item.id, { active: item.active === false });
      await refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao alterar visibilidade do depoimento');
    }
  };

  const handleToggleTestimonialVerified = async (item: Testimonial) => {
    try {
      await api.updateTestimonial(item.id, { verified: !item.verified });
      await refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao alterar selo verificado');
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Deseja realmente excluir este depoimento? Ele será removido da página principal.')) return;
    setDeletingTestimonialId(id);
    try {
      await api.deleteTestimonial(id);
      await refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir depoimento');
    } finally {
      setDeletingTestimonialId(null);
    }
  };

  const handleCopyCsv = async () => {
    try {
      const res = await fetch('/api/export-csv');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCsvCopied(true);
      setTimeout(() => setCsvCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivateClient = async (code: string) => {
    setActivatingCode(code);
    try {
      await api.activateClient(code);
      await refreshAll();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao ativar plano do cliente');
    } finally {
      setActivatingCode(null);
    }
  };

  const filteredClients = clients.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQ =
      !q ||
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.wpp.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.bairro.toLowerCase().includes(q);

    const matchesType = !typeFilter || c.type === typeFilter;
    const matchesStatus = !statusFilter || c.status === statusFilter;

    return matchesQ && matchesType && matchesStatus;
  });

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Currently inspected client for "Ver como Cliente" tab
  const viewedClient = clients.find(c => c.code === selectedClientForViewCode) || clients[0] || null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-6xl bg-white dark:bg-stone-900 rounded-none sm:rounded-3xl shadow-2xl border-0 sm:border border-stone-200 dark:border-stone-800 overflow-hidden my-0 sm:my-4 relative h-full sm:h-auto max-h-screen sm:max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-emerald-950 text-white flex items-center justify-between gap-2 shrink-0 border-b border-emerald-900/60">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-800 text-emerald-300 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold truncate">Painel do Dono · Business Intelligence</h2>
              <p className="text-[10px] sm:text-[11px] text-emerald-300 truncate">
                Entregas, financeiro, depoimentos, clientes, catálogo e preços
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isAuthenticated && (
              <button
                onClick={refreshAll}
                className="p-2 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-900 transition-colors"
                title="Atualizar dados do servidor"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-900 transition-colors"
              aria-label="Fechar painel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">
          {!isAuthenticated ? (
            /* Password Auth Form */
            <div className="max-w-md mx-auto py-10 space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                  Acesso Restrito do Proprietário
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Digite a senha de administrador da loja:
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3.5">
                <input
                  type="password"
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Senha do Dono"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                />

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isAuthenticating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Entrar na Área do Dono</span>
                </button>
              </form>
            </div>
          ) : (
            /* Logged-in Admin Area */
            <div className="space-y-6">
              {/* Tab Navigation - Horizontally swipeable on mobile */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl overflow-x-auto no-scrollbar touch-pan-x flex-nowrap sm:flex-wrap -mx-1 px-1.5 sm:mx-0">
                  <button
                    onClick={() => setActiveTab('metrics')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                      activeTab === 'metrics'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    Painel & Entregas
                  </button>
                  <button
                    onClick={() => setActiveTab('finance')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      activeTab === 'finance'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Área Financeira</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('testimonials')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      activeTab === 'testimonials'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>Depoimentos ({testimonials.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('products')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      activeTab === 'products'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    <span>Produtos ({products.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('clients')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                      activeTab === 'clients'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    Clientes ({clients.filter(c => c.code !== 'AMG001').length})
                  </button>
                  <button
                    onClick={() => setActiveTab('client-view')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      activeTab === 'client-view'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver como Cliente</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('partners')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      activeTab === 'partners'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    <span>Parceiros ({partners.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      activeTab === 'analytics'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Gráficos</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('prices')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                      activeTab === 'prices'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    Preços Gerais
                  </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="/api/export-csv"
                    download="a-mi-gusto-clientes.csv"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar CSV</span>
                  </a>
                  <button
                    onClick={handleCopyCsv}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-semibold text-stone-700 dark:text-stone-200 transition-colors"
                  >
                    {csvCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{csvCopied ? 'Copiado!' : 'Copiar CSV'}</span>
                  </button>
                </div>
              </div>

              {/* Tab 1: Overview & Delivery Operations */}
              {activeTab === 'metrics' && stats && (
                <div className="space-y-6">
                  {/* Alert: Pending PIX Payments */}
                  {stats.pendingPaymentsCount > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500/50 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-amber-950 dark:text-amber-100 flex items-center gap-2">
                            <span>{stats.pendingPaymentsCount} Pagamento(s) PIX Pendente(s)</span>
                            {stats.awaitingValidationCount > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-200 font-extrabold tracking-wide animate-pulse">
                                {stats.awaitingValidationCount} Informado(s) pelo Cliente
                              </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 uppercase font-extrabold tracking-wide">
                              Pague Primeiro
                            </span>
                          </h4>
                          <p className="text-xs text-amber-800 dark:text-amber-300">
                            {stats.awaitingValidationCount > 0
                              ? `${stats.awaitingValidationCount} cliente(s) já clicaram em "Já realizei o pagamento" e aguardam sua conferência do PIX para ativar a entrega!`
                              : 'Clientes aguardando pagamento do PIX para liberação e agendamento da entrega.'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setStatusFilter(stats.awaitingValidationCount > 0 ? 'Aguardando Validação' : 'Aguardando Pagamento');
                          setActiveTab('clients');
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        {stats.awaitingValidationCount > 0 ? 'Validar Pagamentos' : 'Ver Clientes e Ativar'}
                      </button>
                    </div>
                  )}

                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700">
                      <span className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-emerald-700" /> Total Clientes
                      </span>
                      <span className="text-2xl font-black text-stone-900 dark:text-white mt-1 block tabular-nums">
                        {stats.totalClients}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {stats.subscribersCount} assinantes · {stats.oneOffCount} avulsos
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700">
                      <span className="text-[11px] text-stone-500 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-700" /> Receita Mensal (MRR)
                      </span>
                      <span className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1 block tabular-nums">
                        {formatBRL(stats.monthlyRecurringRevenue)}
                      </span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        assinaturas ativas
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700">
                      <span className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-emerald-700" /> Potes Brinde a Enviar
                      </span>
                      <span className={`text-2xl font-black mt-1 block tabular-nums ${stats.pendingRewardPots > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-900 dark:text-white'}`}>
                        {stats.pendingRewardPots}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        potes de 500g pendentes
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700">
                      <span className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Cake className="w-3.5 h-3.5 text-emerald-700" /> Aniversariantes do Mês
                      </span>
                      <span className="text-2xl font-black text-stone-900 dark:text-white mt-1 block tabular-nums">
                        {stats.birthdayCountThisMonth}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        neste mês vigente
                      </span>
                    </div>
                  </div>

                  {/* Quick Recharts Overview Widget */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-700" />
                        <span>Faturamento dos Últimos 6 Meses (Recharts)</span>
                      </h3>
                      <button
                        onClick={() => setActiveTab('analytics')}
                        className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Ver Análise Detalhada</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="h-48 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.monthlySales}>
                          <defs>
                            <linearGradient id="totalRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                          <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                          <YAxis stroke="#888888" fontSize={11} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                          <Tooltip
                            formatter={(value: any) => [formatBRL(Number(value) || 0), 'Faturamento']}
                            labelFormatter={(label) => `Mês: ${label}`}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#totalRevenueGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Central de Entregas Estilo iFood em Tempo Real */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-stone-800 border-2 border-emerald-800/20 dark:border-stone-700 space-y-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-700/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                            <Truck className="w-5 h-5 text-emerald-700" />
                            <span>Central de Entregas iFood (Tempo Real)</span>
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {stats.todayDeliveries.length} pedido(s) ativo(s)
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Gerencie a moagem e despacho das entregas. Toda mudança é sincronizada ao vivo com o cliente via WebSocket.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                          <span>Ao Vivo (Sincronizado)</span>
                        </div>
                      </div>
                    </div>

                    {stats.todayDeliveries.length === 0 ? (
                      <div className="py-8 text-center text-stone-400 space-y-2">
                        <Truck className="w-8 h-8 mx-auto stroke-1 opacity-50" />
                        <p className="text-xs italic">Nenhuma entrega ativa no momento. Pedidos novos e aprovados aparecerão aqui automaticamente.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {stats.todayDeliveries.map((del) => {
                          const orderId = del.orderId || `ord-${del.clientCode}`;
                          const currentStage = del.deliveryStatus || 'recebido';
                          const isUpdating = updatingDeliveryId === orderId;

                          // Stage progress percentage
                          const stageProgress =
                            currentStage === 'entregue'
                              ? 100
                              : currentStage === 'saiu_entrega'
                              ? 75
                              : currentStage === 'preparando'
                              ? 50
                              : 25;

                          const draftDriver = driverDrafts[orderId]?.driverName ?? (del.driverName || 'Marcos Silva (Entregador)');
                          const draftMinutes = driverDrafts[orderId]?.estimatedMinutes ?? (del.estimatedMinutes || 25);

                          return (
                            <div
                              key={orderId}
                              className="p-4 sm:p-5 rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/40 space-y-4 transition-all hover:border-emerald-700/40 shadow-xs"
                            >
                              {/* Order & Client Info Header */}
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs font-black text-emerald-800 dark:text-emerald-300 bg-white dark:bg-stone-800 px-2 py-0.5 rounded-lg border border-stone-200 dark:border-stone-700">
                                      {del.clientCode}
                                    </span>
                                    <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                                      {del.clientName}
                                    </h4>
                                    <span className="text-[11px] text-stone-500 font-mono">
                                      {del.wpp}
                                    </span>
                                  </div>
                                  <p className="text-xs text-stone-600 dark:text-stone-300">
                                    📍 <strong>Endereço:</strong> {del.address}
                                  </p>
                                  <p className="text-xs text-stone-500">
                                    📦 <strong>Item:</strong> Pote de <strong>{del.size}</strong> ({del.type}) · <strong className="text-emerald-800 dark:text-emerald-400">{formatBRL(del.price)}</strong>
                                    {del.deliveryNotes ? ` · Obs: ${del.deliveryNotes}` : ''}
                                  </p>
                                </div>

                                <div className="text-right flex flex-col items-end gap-1">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs ${
                                      currentStage === 'entregue'
                                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100'
                                        : currentStage === 'saiu_entrega'
                                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 animate-pulse border border-amber-300'
                                        : currentStage === 'preparando'
                                        ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
                                        : 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200'
                                    }`}
                                  >
                                    <span className="w-2 h-2 rounded-full bg-current" />
                                    <span>
                                      {currentStage === 'entregue'
                                        ? 'Entregue'
                                        : currentStage === 'saiu_entrega'
                                        ? 'Saiu para Entrega'
                                        : currentStage === 'preparando'
                                        ? 'Moagem / Preparo'
                                        : 'Confirmado'}
                                    </span>
                                  </span>
                                  <span className="text-[10px] text-stone-400">
                                    Previsão de entrega: {del.deliveryDate.split('-').reverse().join('/')}
                                  </span>
                                </div>
                              </div>

                              {/* iFood 4-Stage Stepper Bar */}
                              <div className="space-y-2 pt-1">
                                <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold">
                                  <div
                                    className={`p-2 rounded-xl transition-all ${
                                      stageProgress >= 25
                                        ? 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 font-extrabold border border-emerald-400/50'
                                        : 'bg-stone-100 text-stone-400 dark:bg-stone-800'
                                    }`}
                                  >
                                    <span className="block text-sm">📋</span>
                                    <span>1. Confirmado</span>
                                  </div>

                                  <div
                                    className={`p-2 rounded-xl transition-all ${
                                      stageProgress >= 50
                                        ? 'bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-200 font-extrabold border border-blue-400/50'
                                        : 'bg-stone-100 text-stone-400 dark:bg-stone-800'
                                    }`}
                                  >
                                    <span className="block text-sm">🧄</span>
                                    <span>2. Em Preparo</span>
                                  </div>

                                  <div
                                    className={`p-2 rounded-xl transition-all ${
                                      stageProgress >= 75
                                        ? 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 font-extrabold border border-amber-400/50 animate-pulse'
                                        : 'bg-stone-100 text-stone-400 dark:bg-stone-800'
                                    }`}
                                  >
                                    <span className="block text-sm">🛵</span>
                                    <span>3. Saiu p/ Entrega</span>
                                  </div>

                                  <div
                                    className={`p-2 rounded-xl transition-all ${
                                      stageProgress >= 100
                                        ? 'bg-emerald-200 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-100 font-extrabold border border-emerald-500'
                                        : 'bg-stone-100 text-stone-400 dark:bg-stone-800'
                                    }`}
                                  >
                                    <span className="block text-sm">✅</span>
                                    <span>4. Entregue</span>
                                  </div>
                                </div>

                                {/* Progress Track */}
                                <div className="w-full bg-stone-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-600 h-full transition-all duration-500 rounded-full"
                                    style={{ width: `${stageProgress}%` }}
                                  />
                                </div>
                              </div>

                              {/* Driver and Stage Controls */}
                              <div className="p-3 bg-white dark:bg-stone-800/90 rounded-xl border border-stone-200 dark:border-stone-700/80 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                                  <div className="sm:col-span-5">
                                    <label className="text-[10px] font-bold text-stone-500 block mb-0.5">
                                      Nome do Entregador
                                    </label>
                                    <input
                                      type="text"
                                      value={draftDriver}
                                      onChange={(e) =>
                                        setDriverDrafts({
                                          ...driverDrafts,
                                          [orderId]: {
                                            driverName: e.target.value,
                                            driverPhone: driverDrafts[orderId]?.driverPhone || '(21) 98765-4321',
                                            estimatedMinutes: draftMinutes,
                                          },
                                        })
                                      }
                                      placeholder="Ex: Marcos Silva"
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-semibold"
                                    />
                                  </div>

                                  <div className="sm:col-span-3">
                                    <label className="text-[10px] font-bold text-stone-500 block mb-0.5">
                                      Previsão (Minutos)
                                    </label>
                                    <input
                                      type="number"
                                      value={draftMinutes}
                                      onChange={(e) =>
                                        setDriverDrafts({
                                          ...driverDrafts,
                                          [orderId]: {
                                            driverName: draftDriver,
                                            driverPhone: driverDrafts[orderId]?.driverPhone || '(21) 98765-4321',
                                            estimatedMinutes: Number(e.target.value),
                                          },
                                        })
                                      }
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-xs font-semibold"
                                    />
                                  </div>

                                  <div className="sm:col-span-4 flex items-center justify-end gap-1.5 pt-2 sm:pt-4">
                                    <a
                                      href={`https://wa.me/55${del.wpp.replace(/\D/g, '')}?text=${encodeURIComponent(
                                        currentStage === 'saiu_entrega'
                                          ? `Olá ${del.clientName.split(' ')[0]}! Seu alho triturado A Mi Gusto de ${del.size} acabou de sair para entrega com ${draftDriver}. Previsão de chegada: ${draftMinutes} minutos! Acompanhe ao vivo pelo aplicativo.`
                                          : currentStage === 'preparando'
                                          ? `Olá ${del.clientName.split(' ')[0]}! Seu alho triturado A Mi Gusto de ${del.size} está sendo moído fresquinho agora mesmo na nossa cozinha. Logo sairá para entrega!`
                                          : currentStage === 'entregue'
                                          ? `Olá ${del.clientName.split(' ')[0]}! Seu pote de alho triturado A Mi Gusto foi entregue com sucesso no seu endereço. Bom apetite!`
                                          : `Olá ${del.clientName.split(' ')[0]}! Seu pedido de alho triturado A Mi Gusto está confirmado.`
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      <span>Avisar no WhatsApp</span>
                                    </a>
                                  </div>
                                </div>

                                {/* 1-Click Fast Action Buttons to advance stages */}
                                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-700/60">
                                  <span className="text-[11px] font-bold text-stone-500 mr-1">
                                    Mudar Etapa ao Vivo:
                                  </span>

                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() =>
                                      handleUpdateDeliveryStage(del.clientCode, orderId, 'recebido', draftDriver, '(21) 98765-4321', draftMinutes)
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      currentStage === 'recebido'
                                        ? 'bg-stone-300 dark:bg-stone-700 text-stone-900 dark:text-white'
                                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                                    }`}
                                  >
                                    📋 1. Confirmado
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() =>
                                      handleUpdateDeliveryStage(del.clientCode, orderId, 'preparando', draftDriver, '(21) 98765-4321', draftMinutes, 'Alho sendo triturado e embalado.')
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      currentStage === 'preparando'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 hover:bg-blue-200'
                                    }`}
                                  >
                                    🧄 2. Iniciar Moagem (Preparo)
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() =>
                                      handleUpdateDeliveryStage(del.clientCode, orderId, 'saiu_entrega', draftDriver, '(21) 98765-4321', draftMinutes, `Saiu com ${draftDriver}. Previsão: ${draftMinutes} min.`)
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      currentStage === 'saiu_entrega'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-200'
                                    }`}
                                  >
                                    🛵 3. Despachar (Saiu p/ Entrega)
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() =>
                                      handleUpdateDeliveryStage(del.clientCode, orderId, 'entregue', draftDriver, '(21) 98765-4321', 0, 'Entregue com sucesso.')
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      currentStage === 'entregue'
                                        ? 'bg-emerald-700 text-white shadow-xs'
                                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-200'
                                    }`}
                                  >
                                    ✅ 4. Confirmar Entregue
                                  </button>

                                  {isUpdating && <Loader2 className="w-4 h-4 text-emerald-700 animate-spin ml-1" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Upcoming Deliveries in 7 Days */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-3">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-700" />
                      <span>Próximas Entregas de Assinaturas (Próximos 7 Dias)</span>
                    </h3>

                    {stats.upcomingDeliveries.length === 0 ? (
                      <p className="text-xs text-stone-500 italic py-2">
                        Nenhuma assinatura programada para os próximos 7 dias.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="text-stone-500 border-b border-stone-100 dark:border-stone-700">
                            <tr>
                              <th className="py-2 px-2">Data</th>
                              <th className="py-2 px-2">Cliente</th>
                              <th className="py-2 px-2">Endereço / Bairro</th>
                              <th className="py-2 px-2">Pote</th>
                              <th className="py-2 px-2">Frequência</th>
                              <th className="py-2 px-2 text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                            {stats.upcomingDeliveries.map((item, idx) => (
                              <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                                <td className="py-2 px-2 font-bold text-emerald-700 dark:text-emerald-400">
                                  {item.deliveryDate.split('-').reverse().join('/')}
                                </td>
                                <td className="py-2 px-2 font-semibold">
                                  {item.clientName} ({item.clientCode})
                                </td>
                                <td className="py-2 px-2 text-stone-600 dark:text-stone-300">
                                  {item.address}
                                </td>
                                <td className="py-2 px-2 font-bold">{item.size}</td>
                                <td className="py-2 px-2 text-stone-500">{item.freq}</td>
                                <td className="py-2 px-2 text-right font-mono font-semibold">
                                  {formatBRL(item.price)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Recharts Full Analytics */}
              {activeTab === 'analytics' && stats && (
                <div className="space-y-6">
                  {/* Chart 1: Subscriptions vs One-off Revenue Comparison */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          <span>Faturamento Mensal: Assinaturas vs. Compras Avulsas</span>
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Comparativo detalhado de receita recorrente vs vendas pontuais nos últimos 6 meses.
                        </p>
                      </div>
                      <div className="text-xs font-bold text-stone-700 dark:text-stone-300">
                        Receita Total Acumulada: {formatBRL(stats.monthlySales.reduce((acc, m) => acc + m.total, 0))}
                      </div>
                    </div>

                    <div className="h-64 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.monthlySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                          <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                          <YAxis stroke="#888888" fontSize={11} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                          <Tooltip
                            formatter={(value: any, name: any) => [
                              formatBRL(Number(value) || 0),
                              name === 'subscriptions' ? 'Assinaturas' : name === 'oneOff' ? 'Venda Avulsa' : 'Total',
                            ]}
                            contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                          />
                          <Legend
                            formatter={(value) => (value === 'subscriptions' ? 'Assinaturas (Recorrente)' : 'Vendas Avulsas')}
                            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                          />
                          <Bar dataKey="subscriptions" fill="#10b981" radius={[6, 6, 0, 0]} name="subscriptions" />
                          <Bar dataKey="oneOff" fill="#3b82f6" radius={[6, 6, 0, 0]} name="oneOff" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2 & 3: Deliveries Volume & Pot Distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Deliveries Count & Volume in Kg */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4 text-emerald-700" />
                          <span>Volume de Pedidos por Mês</span>
                        </h4>
                        <span className="text-xs text-stone-500">
                          Total: {stats.monthlySales.reduce((acc, m) => acc + m.orderCount, 0)} entregas
                        </span>
                      </div>

                      <div className="h-56 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.monthlySales}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                            <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} />
                            <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                            <Tooltip
                              formatter={(value: any, name: any) => [
                                name === 'orderCount' ? `${value} pedidos` : `${value} kg`,
                                name === 'orderCount' ? 'Quantidade de Pedidos' : 'Alho Entregue (kg)',
                              ]}
                              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                            />
                            <Legend
                              formatter={(value) => (value === 'orderCount' ? 'Qtd. Pedidos' : 'Peso Total (Kg)')}
                              wrapperStyle={{ fontSize: '12px' }}
                            />
                            <Bar dataKey="orderCount" fill="#059669" radius={[6, 6, 0, 0]} name="orderCount" />
                            <Bar dataKey="volumeKg" fill="#d97706" radius={[6, 6, 0, 0]} name="volumeKg" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Pot Size Distribution */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                          <Weight className="w-4 h-4 text-emerald-700" />
                          <span>Distribuição por Tamanho de Pote</span>
                        </h4>
                        <span className="text-xs text-stone-500">250g vs 500g vs 1kg</span>
                      </div>

                      <div className="h-56 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.potDistribution}
                              dataKey="count"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={75}
                              innerRadius={38}
                              paddingAngle={4}
                              label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                              labelLine={false}
                            >
                              {stats.potDistribution.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any, _name: any, item: any) => [
                                `${value} pedidos (${formatBRL(item.payload.revenue)})`,
                                item.payload.name,
                              ]}
                              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Client Base Management */}
              {activeTab === 'clients' && (
                <div className="space-y-4">
                  {/* Search and Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6 relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nome, código, WhatsApp, e-mail ou bairro..."
                        className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm"
                      >
                        <option value="">Todas as Modalidades</option>
                        <option value="assinatura">Assinaturas</option>
                        <option value="avulsa">Compras Avulsas</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm"
                      >
                        <option value="">Todos os Status</option>
                        <option value="Aguardando Validação">Aguardando Validação ({stats?.awaitingValidationCount ?? 0})</option>
                        <option value="Aguardando Pagamento">Aguardando Pagamento</option>
                        <option value="Ativo">Ativo</option>
                        <option value="Pausado">Pausado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  {/* Clients Table */}
                  <div className="rounded-2xl border border-stone-200 dark:border-stone-800 overflow-x-auto bg-white dark:bg-stone-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-stone-50 dark:bg-stone-700/60 text-stone-600 dark:text-stone-300 font-bold border-b border-stone-200 dark:border-stone-700">
                        <tr>
                          <th className="py-3 px-3">Código</th>
                          <th className="py-3 px-3">Cliente / Contato</th>
                          <th className="py-3 px-3">Senha (Recuperação)</th>
                          <th className="py-3 px-3">Endereço</th>
                          <th className="py-3 px-3">Plano / Pote</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3">Compras</th>
                          <th className="py-3 px-3 text-right">Ações do Dono</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                        {filteredClients.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-6 text-center text-stone-400">
                              Nenhum cliente encontrado com os filtros aplicados.
                            </td>
                          </tr>
                        ) : (
                          filteredClients.map((client) => (
                            <tr key={client.code} className="hover:bg-stone-50/80 dark:hover:bg-stone-700/40">
                              <td className="py-3 px-3 font-mono font-bold text-emerald-800 dark:text-emerald-300">
                                {client.code}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-stone-900 dark:text-white">
                                    {client.name}
                                  </span>
                                  {client.code === 'AMG001' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                      Conta Master do Dono · Fora da Contabilidade
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-stone-500 block">
                                  {client.wpp} · {client.email}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5 font-mono text-xs">
                                  <span className="font-bold text-stone-800 dark:text-stone-200 bg-stone-100 dark:bg-stone-700/60 px-2 py-0.5 rounded-md">
                                    {revealedPasswords[client.code] ? (client.plainPw || '123456') : '••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleRevealPassword(client.code)}
                                    className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                                    title={revealedPasswords[client.code] ? 'Ocultar senha' : 'Ver senha do cliente para recuperação'}
                                  >
                                    {revealedPasswords[client.code] ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPassword(client.plainPw || '123456', client.code)}
                                    className="p-1 text-stone-400 hover:text-emerald-600 transition-colors"
                                    title="Copiar senha do cliente"
                                  >
                                    {copiedPasswordCode === client.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-stone-600 dark:text-stone-300 max-w-[200px] truncate">
                                {client.street}, {client.num} – {client.bairro}, {client.city}/{client.uf}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-stone-800 dark:text-stone-200">
                                  {client.size}g
                                </span>
                                <span className="text-[11px] text-stone-500 block capitalize">
                                  {client.type === 'avulsa'
                                    ? 'Avulsa'
                                    : client.freq === 4
                                    ? 'Semanal'
                                    : client.freq === 2
                                    ? 'Quinzenal'
                                    : 'Mensal'}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    client.status === 'Ativo'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : client.status === 'Aguardando Validação'
                                      ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-400 font-extrabold animate-pulse'
                                      : client.status === 'Aguardando Pagamento'
                                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-400/60'
                                      : client.status === 'Pausado'
                                      ? 'bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  }`}
                                >
                                  {client.status === 'Aguardando Validação'
                                    ? 'Pago (Validar PIX)'
                                    : client.status === 'Aguardando Pagamento'
                                    ? 'Aguardando PIX'
                                    : client.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 tabular-nums font-semibold">
                                {client.hist.length}
                              </td>
                              <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                                {(client.status === 'Aguardando Pagamento' || client.status === 'Aguardando Validação') && (
                                  <button
                                    onClick={() => handleActivateClient(client.code)}
                                    disabled={activatingCode === client.code}
                                    className={`px-2.5 py-1 rounded-lg text-white font-bold text-xs shadow-xs inline-flex items-center gap-1 transition-colors ${
                                      client.status === 'Aguardando Validação'
                                        ? 'bg-indigo-600 hover:bg-indigo-500 animate-pulse'
                                        : 'bg-emerald-600 hover:bg-emerald-500'
                                    }`}
                                    title="Confirmar PIX e Ativar Plano"
                                  >
                                    {activatingCode === client.code ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    )}
                                    <span>{client.status === 'Aguardando Validação' ? 'Validar & Ativar' : 'Ativar Plano'}</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenClient(client)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                                  title="Editar dados e compras"
                                >
                                  Abrir Ficha
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedClientForViewCode(client.code);
                                    setActiveTab('client-view');
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-xs font-semibold transition-colors"
                                  title="Ver portal deste cliente"
                                >
                                  Ver Painel
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: Direct Client View & Impersonation ("Ver / Editar como Cliente") */}
              {activeTab === 'client-view' && (
                <div className="space-y-6">
                  {/* Client Selector Bar */}
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-700/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
                      <div>
                        <span className="text-xs font-bold text-stone-900 dark:text-white block">
                          Visualização e Controle como Cliente
                        </span>
                        <span className="text-[11px] text-stone-500">
                          Selecione qualquer cliente para inspecionar e alterar exatamente o que ele vê:
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedClientForViewCode}
                        onChange={(e) => setSelectedClientForViewCode(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-bold"
                      >
                        {clients.map(c => (
                          <option key={c.code} value={c.code}>
                            {c.name} ({c.code}) - {c.size}g {c.type}
                          </option>
                        ))}
                      </select>

                      {viewedClient && onImpersonateClient && (
                        <button
                          onClick={() => {
                            onImpersonateClient(viewedClient);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                          title="Abrir diretamente no portal do cliente"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Acessar no Portal</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rendered View of Client's Dashboard with live action capabilities */}
                  {viewedClient ? (
                    <div className="space-y-5 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 bg-white dark:bg-stone-800">
                      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-700/60 pb-3">
                        <div>
                          <h3 className="text-xl font-bold text-stone-900 dark:text-white">
                            Olá, {viewedClient.name}! 🧄
                          </h3>
                          <p className="text-xs text-stone-500">
                            Código: <strong>{viewedClient.code}</strong> · Status: <strong className={viewedClient.status === 'Aguardando Pagamento' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}>{viewedClient.status}</strong> · WhatsApp: {viewedClient.wpp}
                          </p>
                        </div>

                        <button
                          onClick={() => handleOpenClient(viewedClient)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar Tudo Deste Cliente</span>
                        </button>
                      </div>

                      {/* Pending PIX Activation Alert Banner */}
                      {viewedClient.status === 'Aguardando Pagamento' && (
                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500/50 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                              <DollarSign className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                                Plano Aguardando Pagamento PIX (R$ {(viewedClient.type === 'avulsa' ? settings.avulsoPrices[viewedClient.size] : settings.prices[viewedClient.size]).toFixed(2).replace('.', ',')})
                              </h4>
                              <p className="text-xs text-amber-800 dark:text-amber-400">
                                O cliente aguarda confirmação do pagamento. Ao clicar abaixo, o plano muda para Ativo e a entrega é agendada para o dia útil seguinte.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleActivateClient(viewedClient.code)}
                            disabled={activatingCode === viewedClient.code}
                            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
                          >
                            {activatingCode === viewedClient.code ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            <span>Confirmar PIX e Ativar Plano Agora</span>
                          </button>
                        </div>
                      )}

                      {/* KPI cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-3 bg-stone-50 dark:bg-stone-700/40 rounded-xl">
                          <span className="text-[10px] text-stone-500 block">Pote & Modalidade</span>
                          <span className="text-base font-bold text-stone-900 dark:text-white mt-0.5 block">{viewedClient.size}g</span>
                          <span className="text-[10px] text-emerald-700 font-semibold">{viewedClient.type}</span>
                        </div>
                        <div className="p-3 bg-stone-50 dark:bg-stone-700/40 rounded-xl">
                          <span className="text-[10px] text-stone-500 block">Valor por Entrega</span>
                          <span className="text-base font-bold text-emerald-800 dark:text-emerald-400 mt-0.5 block tabular-nums">
                            {formatBRL(viewedClient.type === 'avulsa' ? settings.avulsoPrices[viewedClient.size] : settings.prices[viewedClient.size])}
                          </span>
                        </div>
                        <div className="p-3 bg-stone-50 dark:bg-stone-700/40 rounded-xl">
                          <span className="text-[10px] text-stone-500 block">Total de Compras</span>
                          <span className="text-base font-bold text-stone-900 dark:text-white mt-0.5 block tabular-nums">{viewedClient.hist.length}</span>
                        </div>
                        <div className="p-3 bg-stone-50 dark:bg-stone-700/40 rounded-xl">
                          <span className="text-[10px] text-stone-500 block">Potes Grátis Ganhos</span>
                          <span className="text-base font-bold text-amber-600 mt-0.5 block tabular-nums">
                            {Math.floor(clients.filter(c => c.ref === viewedClient.code).length / (settings.goal || 10))}
                          </span>
                        </div>
                      </div>

                      {/* Purchases History table with direct delete/add */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                            Histórico de Compras Registradas ({viewedClient.hist.length})
                          </h4>
                          <span className="text-[11px] text-stone-400">O dono pode alterar ou lançar novas compras diretamente</span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-stone-50 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                              <tr>
                                <th className="py-2 px-2.5">Data Compra</th>
                                <th className="py-2 px-2.5">Data Entrega</th>
                                <th className="py-2 px-2.5">Pote</th>
                                <th className="py-2 px-2.5">Tipo</th>
                                <th className="py-2 px-2.5 text-right">Valor</th>
                                <th className="py-2 px-2.5 text-right">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
                              {viewedClient.hist.map((h, i) => (
                                <tr key={h.id || i}>
                                  <td className="py-2 px-2.5">{h.date.split('-').reverse().join('/')}</td>
                                  <td className="py-2 px-2.5 text-emerald-700 font-semibold">{h.deliveryDate?.split('-').reverse().join('/') || '—'}</td>
                                  <td className="py-2 px-2.5 font-bold">{h.size}g</td>
                                  <td className="py-2 px-2.5 capitalize">{h.type}</td>
                                  <td className="py-2 px-2.5 text-right font-mono font-semibold">{formatBRL(h.val)}</td>
                                  <td className="py-2 px-2.5 text-right">
                                    <button
                                      onClick={() => handleRemoveClientOrder(h.id || String(i))}
                                      className="text-red-500 hover:text-red-700 p-1"
                                      title="Remover compra"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Add purchase on the fly */}
                        <div className="p-3 bg-stone-50 dark:bg-stone-700/30 rounded-xl flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-stone-700 dark:text-stone-300">Lançar Compra para este cliente:</span>
                          <input
                            type="date"
                            value={newOrderDate}
                            onChange={(e) => setNewOrderDate(e.target.value)}
                            className="px-2 py-1 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                          />
                          <select
                            value={newOrderSize}
                            onChange={(e) => setNewOrderSize(e.target.value as '250' | '500' | '1000')}
                            className="px-2 py-1 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 font-bold"
                          >
                            <option value="250">250g</option>
                            <option value="500">500g</option>
                            <option value="1000">1kg</option>
                          </select>
                          <select
                            value={newOrderType}
                            onChange={(e) => setNewOrderType(e.target.value as 'assinatura' | 'avulsa')}
                            className="px-2 py-1 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800"
                          >
                            <option value="avulsa">Avulsa</option>
                            <option value="assinatura">Assinatura</option>
                          </select>
                          <button
                            onClick={async () => {
                              try {
                                await api.addOrder(viewedClient.code, {
                                  size: newOrderSize,
                                  type: newOrderType,
                                  date: newOrderDate,
                                });
                                refreshAll();
                              } catch (err: unknown) {
                                alert(err instanceof Error ? err.message : 'Erro ao lançar pedido');
                              }
                            }}
                            className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Registrar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-stone-400">
                      Nenhum cliente cadastrado ainda.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Price Management */}
              {activeTab === 'prices' && (
                <form onSubmit={handleSavePrices} className="space-y-6 max-w-2xl bg-white dark:bg-stone-800 p-6 rounded-2xl border border-stone-200 dark:border-stone-700">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-white">
                      Tabela de Preços e Regras de Negócio
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      Altere os preços das assinaturas, compras avulsas e chave PIX da A Mi Gusto. As alterações são sincronizadas imediatamente com o catálogo e com a área do cliente.
                    </p>
                  </div>

                  {priceSaveMsg && (
                    <div className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2.5 transition-all animate-in fade-in duration-150 ${
                      priceSaveMsg.includes('sucesso')
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-xs'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 shadow-xs'
                    }`}>
                      {priceSaveMsg.includes('sucesso') ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                      <span>{priceSaveMsg}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      Preço da Assinatura (por entrega)
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1 font-semibold">Pote 250g (R$)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required
                          value={priceForm.sub250}
                          onChange={(e) => setPriceForm({ ...priceForm, sub250: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1 font-semibold">Pote 500g (R$)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required
                          value={priceForm.sub500}
                          onChange={(e) => setPriceForm({ ...priceForm, sub500: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1 font-semibold">Pote 1kg (R$)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required
                          value={priceForm.sub1000}
                          onChange={(e) => setPriceForm({ ...priceForm, sub1000: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-stone-200 dark:border-stone-700">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      Preço da Compra Avulsa (pedido único)
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1 font-semibold">Pote 250g (R$)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required
                          value={priceForm.av250}
                          onChange={(e) => setPriceForm({ ...priceForm, av250: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1 font-semibold">Pote 500g (R$)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required
                          value={priceForm.av500}
                          onChange={(e) => setPriceForm({ ...priceForm, av500: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1 font-semibold">Pote 1kg (R$)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required
                          value={priceForm.av1000}
                          onChange={(e) => setPriceForm({ ...priceForm, av1000: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200 dark:border-stone-700">
                    <div>
                      <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1 font-semibold">
                        Meta de Indicações para 1 Pote Grátis (500g)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={priceForm.goal}
                        onChange={(e) => setPriceForm({ ...priceForm, goal: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1 font-semibold">
                        WhatsApp Oficial da Loja (com DDD)
                      </label>
                      <input
                        type="text"
                        value={priceForm.whatsapp}
                        onChange={(e) => setPriceForm({ ...priceForm, whatsapp: e.target.value })}
                        placeholder="21981142230"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1 font-semibold flex items-center justify-between">
                        <span>Chave PIX da Loja Oficial</span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Oficial: 21981142230</span>
                      </label>
                      <input
                        type="text"
                        value={priceForm.pixKey}
                        onChange={(e) => setPriceForm({ ...priceForm, pixKey: e.target.value })}
                        placeholder="21981142230"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm font-mono font-bold text-emerald-800 dark:text-emerald-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-stone-600 dark:text-stone-300 mb-1 font-semibold">
                        Alterar Senha do Dono <span className="text-[10px] text-stone-400">(vazio mantém a atual)</span>
                      </label>
                      <input
                        type="password"
                        value={priceForm.newOwnerPassword}
                        onChange={(e) => setPriceForm({ ...priceForm, newOwnerPassword: e.target.value })}
                        placeholder="Nova senha (min. 4 chars)"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingPrices}
                    className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingPrices ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Salvar Configurações de Preços</span>
                  </button>
                </form>
              )}

              {/* Partners & Banners Tab Panel */}
              {activeTab === 'partners' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                          <Handshake className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                          <span>Divulgação de Empresas & Parceiros (R$ 100 / 3 meses)</span>
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {partners.length} banner(s)
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-xl">
                        Divulgue as empresas e serviços dos clientes da A Mi Gusto no meio da Home Page. Cada parceria tem duração de 3 meses pelo valor simbólico de R$ 100,00. Você pode enviar fotos ou vídeos para computador e celular.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenNewPartner}
                      className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:scale-[1.02]"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Novo Banner de Empresa</span>
                    </button>
                  </div>

                  {/* List of Partners */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {partners.length === 0 ? (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl p-6">
                        <Handshake className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300">Nenhum banner cadastrado ainda</h4>
                        <p className="text-xs text-stone-500 mt-1">Clique no botão acima para adicionar seu primeiro parceiro na home page.</p>
                      </div>
                    ) : (
                      partners.map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className={`rounded-2xl border transition-all overflow-hidden bg-white dark:bg-stone-850 shadow-sm flex flex-col justify-between ${
                            p.active !== false
                              ? 'border-emerald-600/40 ring-1 ring-emerald-600/20'
                              : 'border-stone-200 dark:border-stone-800 opacity-60'
                          }`}
                        >
                          <div className="relative h-44 bg-stone-900 overflow-hidden group">
                            {p.mediaType === 'video' ? (
                              <video
                                src={p.mediaUrl}
                                muted
                                loop
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={p.mediaUrl}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            )}

                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                              {p.badge && (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-800 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                  {p.badge}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs">
                                {p.mediaType === 'video' ? <Video className="w-3 h-3 text-amber-400" /> : <Image className="w-3 h-3 text-sky-400" />}
                                <span>{p.mediaType === 'video' ? 'Vídeo' : 'Imagem'}</span>
                              </span>
                            </div>

                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full text-white text-[10px] backdrop-blur-xs">
                              <Monitor className="w-3 h-3" />
                              <span>Desktop</span>
                              {p.mobileMediaUrl && (
                                <>
                                  <span className="text-stone-400">·</span>
                                  <Smartphone className="w-3 h-3 text-emerald-400" />
                                  <span>Celular</span>
                                </>
                              )}
                            </div>

                            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white drop-shadow-md">
                              <div className="truncate flex items-center gap-1.5">
                                <span className="text-xs font-black truncate">{p.partnerName}</span>
                                {p.clientCode && (
                                  <span className="text-[10px] bg-white/25 px-1.5 py-0.2 rounded font-mono">
                                    {p.clientCode}
                                  </span>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                p.active !== false ? 'bg-emerald-600 text-white' : 'bg-stone-600 text-stone-200'
                              }`}>
                                {p.active !== false ? 'Ativo na Home' : 'Pausado'}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                  R$ {(p.price ?? 100).toFixed(2).replace('.', ',')} · {p.durationMonths ?? 3} meses
                                </span>
                                {p.expiresAt && (
                                  <span className="text-[10px] text-stone-400">
                                    Até {p.expiresAt.split('-').reverse().join('/')}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-stone-900 dark:text-white leading-snug">
                                {p.title}
                              </h4>
                              {p.description && (
                                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                                  {p.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                              <button
                                type="button"
                                onClick={() => handleTogglePartnerActive(p)}
                                className={`text-[11px] font-semibold underline ${
                                  p.active !== false ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {p.active !== false ? 'Pausar Exibição' : 'Ativar na Home'}
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditPartner(p)}
                                  className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750 font-semibold flex items-center gap-1 text-xs"
                                  title="Editar banner"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePartner(p.id)}
                                  disabled={deletingPartnerId === p.id}
                                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1"
                                  title="Excluir banner"
                                >
                                  {deletingPartnerId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                  <span>Excluir</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Área Financeira & Fluxo de Caixa */}
              {activeTab === 'finance' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                          <Wallet className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                          <span>Gestão Financeira & Fluxo de Caixa</span>
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {filteredTransactions.length} lançamento(s)
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
                        Controle completo do caixa da A Mi Gusto: registre entradas de vendas/assinaturas, despesas com alho Ceasa, embalagens e frete. Você pode editar, excluir ou zerar o caixa a qualquer momento.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {financialTransactions.length > 0 && (
                        <button
                          type="button"
                          onClick={handleResetFinance}
                          disabled={isResettingFinance}
                          className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Zerar todos os lançamentos financeiros"
                        >
                          {isResettingFinance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          <span>Zerar Caixa</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenNewTx('despesa')}
                        className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        <TrendingDown className="w-4 h-4" />
                        <span>+ Despesa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenNewTx('receita')}
                        className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>+ Receita</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary KPI Cards - 2 cols on mobile, 5 cols on desktop */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
                    {/* Faturamento Bruto */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-xs">
                      <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                        <span className="font-semibold">Receita Total</span>
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                        R$ {(financialSummary?.totalRevenue || 0).toFixed(2)}
                      </div>
                      <div className="mt-2 text-[11px] text-stone-500 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Assinaturas:</span>
                          <span className="font-bold text-stone-700 dark:text-stone-300">R$ {(financialSummary?.subscriptionRevenue || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avulsas:</span>
                          <span className="font-bold text-stone-700 dark:text-stone-300">R$ {(financialSummary?.oneOffRevenue || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Parcerias:</span>
                          <span className="font-bold text-stone-700 dark:text-stone-300">R$ {(financialSummary?.partnershipRevenue || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Despesas Operacionais */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-xs">
                      <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                        <span className="font-semibold">Despesas Totais</span>
                        <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
                          <ArrowDownRight className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl font-extrabold text-red-600 dark:text-red-400">
                        R$ {(financialSummary?.totalExpenses || 0).toFixed(2)}
                      </div>
                      <p className="mt-2 text-[11px] text-stone-500">
                        Custos com alho, potes BPA-free, logística e rótulos
                      </p>
                    </div>

                    {/* Lucro Líquido Real */}
                    <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                      <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs mb-1">
                        <span className="font-bold">Lucro Líquido</span>
                        <div className="w-7 h-7 rounded-lg bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>
                      <div className={`text-xl font-extrabold ${
                        (financialSummary?.netProfit || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600'
                      }`}>
                        R$ {(financialSummary?.netProfit || 0).toFixed(2)}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                          Margem: {(financialSummary?.profitMarginPercent || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* MRR Assinaturas */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 shadow-xs">
                      <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                        <span className="font-semibold">MRR (Mensal)</span>
                        <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl font-extrabold text-purple-700 dark:text-purple-300">
                        R$ {(financialSummary?.mrr || 0).toFixed(2)}
                      </div>
                      <p className="mt-2 text-[11px] text-stone-500">
                        Receita recorrente garantida por assinaturas ativas
                      </p>
                    </div>

                    {/* Pendentes / PIX a Receber */}
                    <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-xs">
                      <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs mb-1">
                        <span className="font-bold">A Receber (PIX)</span>
                        <div className="w-7 h-7 rounded-lg bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-xl font-extrabold text-amber-700 dark:text-amber-300">
                        R$ {(financialSummary?.pendingReceivables || 0).toFixed(2)}
                      </div>
                      <p className="mt-2 text-[11px] text-amber-800 dark:text-amber-400">
                        Aguardando confirmação de pagamento
                      </p>
                    </div>
                  </div>

                  {/* Filters & Actions Bar */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-stone-850 border border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Filter by Type */}
                      <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setFinanceFilterType('all')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            financeFilterType === 'all'
                              ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                              : 'text-stone-600 dark:text-stone-400'
                          }`}
                        >
                          Todos ({financialTransactions.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFinanceFilterType('receita')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all text-emerald-600 ${
                            financeFilterType === 'receita'
                              ? 'bg-white dark:bg-stone-700 shadow-xs'
                              : ''
                          }`}
                        >
                          Receitas (+)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFinanceFilterType('despesa')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all text-red-600 ${
                            financeFilterType === 'despesa'
                              ? 'bg-white dark:bg-stone-700 shadow-xs'
                              : ''
                          }`}
                        >
                          Despesas (-)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFinanceFilterType('pendente')}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all text-amber-600 ${
                            financeFilterType === 'pendente'
                              ? 'bg-white dark:bg-stone-700 shadow-xs'
                              : ''
                          }`}
                        >
                          Pendentes (PIX)
                        </button>
                      </div>

                      {/* Filter by Category */}
                      <select
                        value={financeFilterCategory}
                        onChange={(e) => setFinanceFilterCategory(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-200"
                      >
                        <option value="all">Todas as Categorias</option>
                        <option value="materia_prima">Alho Matéria-Prima (Ceasa)</option>
                        <option value="embalagens">Potes & Embalagens BPA</option>
                        <option value="rotulos">Rótulos & Comunicação</option>
                        <option value="combustivel">Combustível & Frete</option>
                        <option value="assinatura">Receita de Assinaturas</option>
                        <option value="venda_avulsa">Receita Venda Avulsa</option>
                        <option value="parceria">Receita de Parcerias</option>
                        <option value="outros">Outros Lançamentos</option>
                      </select>

                      {/* Month Filter */}
                      <input
                        type="month"
                        value={financeMonthFilter}
                        onChange={(e) => setFinanceMonthFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-200"
                        title="Filtrar por mês"
                      />
                      {financeMonthFilter && (
                        <button
                          type="button"
                          onClick={() => setFinanceMonthFilter('')}
                          className="text-[11px] text-stone-500 hover:text-stone-800 underline"
                        >
                          Limpar mês
                        </button>
                      )}
                    </div>

                    {/* Search */}
                    <div className="relative min-w-[200px] flex-1 max-w-xs">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={financeSearchQuery}
                        onChange={(e) => setFinanceSearchQuery(e.target.value)}
                        placeholder="Buscar por cliente, descrição..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Financial Transactions List (Mobile Cards + Desktop Table) */}
                  <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-850 overflow-hidden shadow-xs">
                    <div className="p-3.5 sm:p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                        <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                          Livro Caixa & Movimentações
                        </h4>
                      </div>
                      <span className="text-[11px] sm:text-xs text-stone-500">
                        {filteredTransactions.length} lançamento(s)
                      </span>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="md:hidden divide-y divide-stone-100 dark:divide-stone-800">
                      {filteredTransactions.length === 0 ? (
                        <div className="py-10 px-4 text-center space-y-2">
                          <Wallet className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
                          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                            Caixa zerado e pronto para administrar!
                          </p>
                          <p className="text-[11px] text-stone-400">
                            Clique em "+ Receita" ou "+ Despesa" acima para registrar seu primeiro lançamento.
                          </p>
                        </div>
                      ) : (
                        filteredTransactions.map((tx) => (
                          <div key={tx.id} className="p-3.5 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    tx.type === 'receita'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                  }`}>
                                    {tx.type === 'receita' ? '+ Receita' : '- Despesa'}
                                  </span>
                                  <span className="text-[10px] font-mono text-stone-400">{tx.date}</span>
                                  <span className="text-[10px] uppercase font-bold text-stone-500">· {tx.paymentMethod || 'PIX'}</span>
                                </div>
                                <div className="font-bold text-xs text-stone-900 dark:text-white leading-snug">
                                  {tx.description}
                                </div>
                                {tx.clientName && (
                                  <div className="text-[11px] text-stone-500">
                                    Cliente: {tx.clientName} {tx.clientCode ? `(${tx.clientCode})` : ''}
                                  </div>
                                )}
                              </div>
                              <div className={`font-extrabold text-sm whitespace-nowrap ${
                                tx.type === 'receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                                {tx.type === 'receita' ? '+' : '-'} R$ {Number(tx.amount || 0).toFixed(2)}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <div>
                                {tx.status === 'confirmado' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Confirmado</span>
                                  </span>
                                ) : tx.status === 'pendente' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>Aguardando PIX</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">
                                    Cancelado
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {tx.status === 'pendente' && (
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmPixTx(tx)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Confirmar</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleEditTx(tx)}
                                  className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-[11px] font-semibold flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFinancialTx(tx.id)}
                                  disabled={deletingTxId === tx.id}
                                  className="p-1.5 rounded-lg text-red-600 bg-red-50 dark:bg-red-950/30"
                                >
                                  {deletingTxId === tx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 font-semibold border-b border-stone-200 dark:border-stone-800">
                          <tr>
                            <th className="py-2.5 px-4">Data</th>
                            <th className="py-2.5 px-4">Tipo & Categoria</th>
                            <th className="py-2.5 px-4">Descrição / Origem</th>
                            <th className="py-2.5 px-4">Forma</th>
                            <th className="py-2.5 px-4">Status</th>
                            <th className="py-2.5 px-4 text-right">Valor</th>
                            <th className="py-2.5 px-4 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                          {filteredTransactions.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-10 text-center text-stone-400">
                                Caixa zerado e pronto para administrar! Clique em "+ Receita" ou "+ Despesa" acima para começar.
                              </td>
                            </tr>
                          ) : (
                            filteredTransactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors">
                                <td className="py-3 px-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                                  {tx.date}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      tx.type === 'receita'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                    }`}>
                                      {tx.type === 'receita' ? '+ Receita' : '- Despesa'}
                                    </span>
                                    <span className="text-[11px] text-stone-600 dark:text-stone-400">
                                      {tx.category === 'materia_prima' && 'Alho Ceasa'}
                                      {tx.category === 'embalagens' && 'Embalagens'}
                                      {tx.category === 'rotulos' && 'Rótulos'}
                                      {tx.category === 'combustivel' && 'Combustível'}
                                      {tx.category === 'combustivel_entrega' && 'Combustível'}
                                      {tx.category === 'assinatura' && 'Assinatura'}
                                      {tx.category === 'venda_avulsa' && 'Venda Avulsa'}
                                      {tx.category === 'parceria' && 'Banner Home'}
                                      {tx.category === 'manutencao' && 'Manutenção'}
                                      {tx.category === 'marketing' && 'Marketing'}
                                      {tx.category === 'outros' && 'Geral'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-stone-900 dark:text-white">
                                    {tx.description}
                                  </div>
                                  {tx.clientName && (
                                    <div className="text-[11px] text-stone-500 flex items-center gap-1">
                                      <span>Cliente: {tx.clientName}</span>
                                      {tx.clientCode && <span className="font-mono text-[10px] bg-stone-100 dark:bg-stone-800 px-1 rounded">({tx.clientCode})</span>}
                                    </div>
                                  )}
                                  {tx.notes && (
                                    <div className="text-[10px] text-stone-400 italic mt-0.5">
                                      {tx.notes}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4 uppercase text-[10px] font-bold text-stone-500 whitespace-nowrap">
                                  {tx.paymentMethod || 'PIX'}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  {tx.status === 'confirmado' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 w-fit">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Confirmado</span>
                                    </span>
                                  ) : tx.status === 'pendente' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1 w-fit">
                                      <Clock className="w-3 h-3" />
                                      <span>Aguardando PIX</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                                      Cancelado
                                    </span>
                                  )}
                                </td>
                                <td className={`py-3 px-4 text-right font-extrabold text-sm whitespace-nowrap ${
                                  tx.type === 'receita'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {tx.type === 'receita' ? '+' : '-'} R$ {Number(tx.amount || 0).toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1">
                                    {tx.status === 'pendente' && (
                                      <button
                                        type="button"
                                        onClick={() => handleConfirmPixTx(tx)}
                                        className="px-2 py-1 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-0.5"
                                        title="Confirmar pagamento PIX"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>Confirmar</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleEditTx(tx)}
                                      className="p-1 rounded-md text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
                                      title="Editar lançamento"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteFinancialTx(tx.id)}
                                      disabled={deletingTxId === tx.id}
                                      className="p-1 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                      title="Excluir lançamento"
                                    >
                                      {deletingTxId === tx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Produtos & Cardápio Tab */}
              {activeTab === 'products' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                          <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          <span>Catálogo de Produtos & Precificação</span>
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {products.length} produto(s)
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
                        Cadastre novos itens no cardápio da A Mi Gusto (alho, pastas, conservas, molhos, outros tamanhos). Você pode definir se o item aceita assinatura semanal/quinzenal/mensal, compra avulsa ou ambas, e alterar os valores quando quiser!
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenNewProduct}
                      className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ Cadastrar Novo Produto</span>
                    </button>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {products.length === 0 ? (
                      <div className="col-span-full py-12 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-3xl p-6">
                        <Package className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300">Nenhum produto cadastrado</h4>
                        <p className="text-xs text-stone-500 mt-1">Clique no botão acima para adicionar seu primeiro produto no cardápio.</p>
                      </div>
                    ) : (
                      products.map((prod) => (
                        <div
                          key={prod.id}
                          className={`rounded-2xl border transition-all overflow-hidden bg-white dark:bg-stone-850 shadow-sm flex flex-col justify-between ${
                            prod.active !== false
                              ? 'border-stone-200 dark:border-stone-800 hover:border-emerald-600/40'
                              : 'border-stone-200 dark:border-stone-800 opacity-60'
                          }`}
                        >
                          <div>
                            {/* Image Header */}
                            <div className="relative h-44 bg-stone-100 dark:bg-stone-800 overflow-hidden">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                                  <Package className="w-10 h-10 mb-1" />
                                  <span className="text-[11px]">Sem foto cadastrada</span>
                                </div>
                              )}

                              <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-stone-900/90 text-stone-800 dark:text-stone-200 shadow-xs">
                                  {prod.category}
                                </span>
                                {prod.isPopular && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                                    ★ Popular
                                  </span>
                                )}
                              </div>

                              <div className="absolute top-2.5 right-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  prod.active !== false
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-stone-700 text-white'
                                } shadow-xs`}>
                                  {prod.active !== false ? 'Ativo na Loja' : 'Pausado'}
                                </span>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="p-4 space-y-3">
                              <div>
                                <div className="flex items-center justify-between">
                                  <h4 className="font-extrabold text-sm text-stone-900 dark:text-white">
                                    {prod.name}
                                  </h4>
                                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                                    {prod.unit}
                                  </span>
                                </div>
                                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">
                                  {prod.description || 'Produto natural, selecionado e embalado sem conservantes.'}
                                </p>
                              </div>

                              {/* Price Badges */}
                              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 dark:border-stone-800">
                                <div className={`p-2 rounded-xl text-center ${
                                  prod.allowSubscription
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 opacity-40'
                                }`}>
                                  <div className="text-[10px] text-stone-500 font-semibold uppercase">Assinatura</div>
                                  <div className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                                    {prod.allowSubscription ? `R$ ${(prod.subscriptionPrice || 0).toFixed(2)}` : 'Indisponível'}
                                  </div>
                                </div>

                                <div className={`p-2 rounded-xl text-center ${
                                  prod.allowOneOff
                                    ? 'bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700'
                                    : 'bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 opacity-40'
                                }`}>
                                  <div className="text-[10px] text-stone-500 font-semibold uppercase">Avulso</div>
                                  <div className="text-sm font-extrabold text-stone-800 dark:text-stone-200">
                                    {prod.allowOneOff ? `R$ ${(prod.oneOffPrice || 0).toFixed(2)}` : 'Indisponível'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleProductActive(prod)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${
                                prod.active !== false
                                  ? 'text-stone-600 hover:text-stone-900 dark:text-stone-300 hover:bg-stone-200/50'
                                  : 'text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200'
                              }`}
                            >
                              {prod.active !== false ? 'Pausar' : 'Ativar'}
                            </button>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditProduct(prod)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod.id)}
                                disabled={deletingProductId === prod.id}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                title="Excluir produto"
                              >
                                {deletingProductId === prod.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Depoimentos Reais de Clientes Tab */}
              {activeTab === 'testimonials' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                          <Star className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                          <span>Gerenciar Depoimentos Reais de Clientes</span>
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {testimonials.length} depoimento(s)
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-2xl">
                        Edite, altere textos, estrelas, fotos, bairros, destaques ou oculte/exclua qualquer depoimento exibido na página principal da A Mi Gusto. Todas as alterações atualizam o site em tempo real.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenNewTestimonial}
                      className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                    >
                      <MessageSquarePlus className="w-4 h-4" />
                      <span>+ Novo Depoimento</span>
                    </button>
                  </div>

                  {/* Testimonials Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {testimonials.length === 0 ? (
                      <div className="col-span-full py-12 text-center border border-dashed border-stone-300 dark:border-stone-700 rounded-2xl text-stone-500 text-xs">
                        Nenhum depoimento cadastrado. Clique em "+ Novo Depoimento" para adicionar.
                      </div>
                    ) : (
                      testimonials.map((t) => (
                        <div
                          key={t.id}
                          className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                            t.active !== false
                              ? 'bg-white dark:bg-stone-850 border-stone-200 dark:border-stone-700 shadow-xs'
                              : 'bg-stone-100/70 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800 opacity-70'
                          }`}
                        >
                          <div className="space-y-2.5">
                            {/* Status + Stars + Tag */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-0.5 text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${
                                      i < (t.rating || 5)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-stone-300 dark:text-stone-700'
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  t.active !== false
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                                }`}>
                                  {t.active !== false ? 'Visível na Home' : 'Oculto'}
                                </span>
                              </div>
                            </div>

                            {/* Author */}
                            <div className="flex items-center gap-2.5">
                              {t.avatarUrl ? (
                                <img
                                  src={t.avatarUrl}
                                  alt={t.name}
                                  className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                                  {t.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="font-extrabold text-sm text-stone-900 dark:text-white truncate">
                                    {t.name}
                                  </span>
                                  {t.verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                </div>
                                <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                                  {t.roleOrProfile}
                                </div>
                              </div>
                            </div>

                            {t.highlightTag && (
                              <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                {t.highlightTag}
                              </span>
                            )}

                            <p className="text-xs text-stone-700 dark:text-stone-300 italic leading-relaxed line-clamp-4">
                              "{t.content}"
                            </p>

                            <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-stone-500 dark:text-stone-400 pt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-emerald-600" />
                                {t.neighborhood}, {t.city}
                              </span>
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                {t.planOrProduct}
                              </span>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleTestimonialActive(t)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                  t.active !== false
                                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                }`}
                              >
                                {t.active !== false ? 'Ocultar' : 'Exibir'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleTestimonialVerified(t)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                  t.verified
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                                }`}
                                title="Alternar selo de Cliente Verificado"
                              >
                                {t.verified ? '✓ Verificado' : 'Não verif.'}
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditTestimonial(t)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTestimonial(t.id)}
                                disabled={deletingTestimonialId === t.id}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                title="Excluir depoimento"
                              >
                                {deletingTestimonialId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Partner Banner Edit/Add Modal */}
        {isEditingPartner && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 overflow-y-auto animate-in fade-in duration-150">
            <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 my-6 max-h-[90vh] overflow-y-auto relative">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                    <Handshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-white">
                      {editingPartnerData.id ? 'Editar Banner de Parceiro' : 'Adicionar Novo Parceiro na Home'}
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Configure a mídia para smartphone e desktop, títulos e links do parceiro
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingPartner(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {partnerSaveMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  {partnerSaveMsg}
                </div>
              )}

              <form onSubmit={handleSavePartner} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-bold block mb-1">Nome da Empresa / Negócio *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Restaurante Fogão a Lenha"
                      value={editingPartnerData.partnerName || ''}
                      onChange={(e) => setEditingPartnerData({ ...editingPartnerData, partnerName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Código do Cliente da Casa (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: AMG001"
                      value={editingPartnerData.clientCode || ''}
                      onChange={(e) => setEditingPartnerData({ ...editingPartnerData, clientCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Categoria / Selo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Empresa Parceira, Comércio Local, Restaurante"
                      value={editingPartnerData.badge || ''}
                      onChange={(e) => setEditingPartnerData({ ...editingPartnerData, badge: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold block mb-1">Valor Simbólico (R$)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="100"
                        value={editingPartnerData.price ?? 100}
                        onChange={(e) => setEditingPartnerData({ ...editingPartnerData, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold block mb-1">Duração (Meses)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="3"
                        value={editingPartnerData.durationMonths ?? 3}
                        onChange={(e) => {
                          const months = Number(e.target.value) || 3;
                          const exp = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                          setEditingPartnerData({ ...editingPartnerData, durationMonths: months, expiresAt: exp });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold block mb-1">Título Chamativo do Banner *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Culinária Autêntica com o Alho Triturado A Mi Gusto"
                      value={editingPartnerData.title || ''}
                      onChange={(e) => setEditingPartnerData({ ...editingPartnerData, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold block mb-1">Descrição / Subtítulo</label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Pratos nobres e cortes especiais temperados exclusivamente com o frescor do nosso alho puro artesanal."
                      value={editingPartnerData.description || ''}
                      onChange={(e) => setEditingPartnerData({ ...editingPartnerData, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold block mb-1">Tipo de Mídia Principal</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="mediaType"
                          value="image"
                          checked={editingPartnerData.mediaType !== 'video'}
                          onChange={() => setEditingPartnerData({ ...editingPartnerData, mediaType: 'image' })}
                          className="text-emerald-700"
                        />
                        <span className="font-semibold flex items-center gap-1">
                          <Image className="w-3.5 h-3.5 text-sky-600" /> Imagem (Foto)
                        </span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="mediaType"
                          value="video"
                          checked={editingPartnerData.mediaType === 'video'}
                          onChange={() => setEditingPartnerData({ ...editingPartnerData, mediaType: 'video' })}
                          className="text-emerald-700"
                        />
                        <span className="font-semibold flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-amber-600" /> Vídeo (MP4/WebM)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Desktop Media Input & File Upload */}
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
                        <Monitor className="w-4 h-4 text-emerald-700" />
                        <span>Mídia para Computador (Desktop) *</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {editingPartnerData.mediaUrl && (
                          <button
                            type="button"
                            onClick={() => setEditingPartnerData({ ...editingPartnerData, mediaUrl: '' })}
                            className="text-[11px] text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remover</span>
                          </button>
                        )}
                        <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1">
                          {isUploadingPartnerPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          <span>{isUploadingPartnerPhoto ? 'Enviando...' : 'Enviar Arquivo'}</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            disabled={isUploadingPartnerPhoto}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handlePartnerFileUpload(e.target.files[0], 'desktop');
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Cole a URL da imagem/vídeo ou use o botão 'Enviar Arquivo' acima"
                      value={editingPartnerData.mediaUrl || ''}
                      onChange={(e) => setEditingPartnerData({ ...editingPartnerData, mediaUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono text-[11px]"
                    />

                    {editingPartnerData.mediaUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 h-28 bg-stone-900 flex items-center justify-center">
                        {editingPartnerData.mediaType === 'video' ? (
                          <video src={editingPartnerData.mediaUrl} controls className="h-full max-w-full object-contain" />
                        ) : (
                          <img src={editingPartnerData.mediaUrl} alt="Preview desktop" className="h-full max-w-full object-contain" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mobile Media Input & File Upload */}
                  <div className="sm:col-span-2 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
                        <Smartphone className="w-4 h-4 text-emerald-700" />
                        <span>Mídia Específica para Smartphone / Celular (Opcional)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {editingPartnerData.mobileMediaUrl && (
                          <button
                            type="button"
                            onClick={() => setEditingPartnerData({ ...editingPartnerData, mobileMediaUrl: '' })}
                            className="text-[11px] text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remover</span>
                          </button>
                        )}
                        <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-stone-700 hover:bg-stone-600 text-white font-semibold text-[11px] flex items-center gap-1">
                          {isUploadingPartnerPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                          <span>{isUploadingPartnerPhoto ? 'Enviando...' : 'Enviar Arquivo Celular'}</span>
                          <input
                            type="file"
                            accept="image/*,video/*"
                            disabled={isUploadingPartnerPhoto}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handlePartnerFileUpload(e.target.files[0], 'mobile');
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="URL ou arquivo para smartphone (se vazio, usa a mídia do computador adaptada)"
                      value={editingPartnerData.mobileMediaUrl || ''}
                      onChange={(e) => setEditingPartnerData({ ...editingPartnerData, mobileMediaUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 font-mono text-[11px]"
                    />

                    {editingPartnerData.mobileMediaUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 h-28 bg-stone-900 flex items-center justify-center">
                        {editingPartnerData.mediaType === 'video' ? (
                          <video src={editingPartnerData.mobileMediaUrl} controls className="h-full max-w-full object-contain" />
                        ) : (
                          <img src={editingPartnerData.mobileMediaUrl} alt="Preview celular" className="h-full max-w-full object-contain" />
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Link de Redirecionamento (Opcional)</label>
                    <input
                      type="text"
                      placeholder="https://instagram.com/parceiro ou WhatsApp"
                      value={editingPartnerData.linkUrl || ''}
                      onChange={(e) => setEditingPartnerData({ ...editingPartnerData, linkUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>

                  <div>
                    <label className="font-bold block mb-1">Texto do Botão</label>
                    <input
                      type="text"
                      placeholder="Ex: Conhecer Parceiro, Ver Cardápio"
                      value={editingPartnerData.buttonText || 'Conhecer Parceiro'}
                      onChange={(e) => setEditingPartnerData({ ...editingPartnerData, buttonText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingPartnerData.active !== false}
                        onChange={(e) => setEditingPartnerData({ ...editingPartnerData, active: e.target.checked })}
                        className="rounded-md text-emerald-700 w-4 h-4"
                      />
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        Ativar exibição imediata deste banner no meio da Home Page
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingPartner(false)}
                    className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingPartner}
                    className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md"
                  >
                    {isSavingPartner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Salvar Banner de Parceiro</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {selectedClient && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 overflow-y-auto animate-in fade-in duration-150">
            <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-5 my-6 max-h-[85vh] overflow-y-auto relative">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white">
                    Ficha de {selectedClient.name} · <span className="font-mono text-emerald-800 dark:text-emerald-400">{selectedClient.code}</span>
                  </h3>
                  <span className="text-xs text-stone-500">
                    Cadastrado em {selectedClient.pdate.split('-').reverse().join('/')} · {selectedClient.hist.length} compra(s)
                  </span>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {clientSaveMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-700/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  {clientSaveMsg}
                </div>
              )}

              {/* Password Recovery & Reveal Card for Owner (Requirement: Dono ver a senha para recuperação) */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                    <span>Senha de Acesso do Cliente (Para Recuperação)</span>
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-lg font-black text-stone-900 dark:text-white tracking-wider">
                      {isModalPasswordRevealed ? (selectedClient.plainPw || '123456') : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsModalPasswordRevealed(!isModalPasswordRevealed)}
                      className="p-1 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors"
                      title={isModalPasswordRevealed ? 'Ocultar senha' : 'Ver senha do cliente'}
                    >
                      {isModalPasswordRevealed ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleCopyModalPassword(selectedClient.plainPw || '123456')}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold flex items-center gap-1 shadow-xs hover:bg-stone-50"
                  >
                    {modalPasswordCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{modalPasswordCopied ? 'Copiada!' : 'Copiar Senha'}</span>
                  </button>

                  <a
                    href={`https://wa.me/55${selectedClient.wpp.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá ${selectedClient.name.split(' ')[0]}! Segue a sua senha de acesso à sua Área do Cliente na A Mi Gusto:\n\n🔑 *Senha:* ${selectedClient.plainPw || '123456'}\n📋 *Código:* ${selectedClient.code}\n\nAcesse seu portal em: ${typeof window !== 'undefined' ? window.location.origin : 'https://amigusto.com.br'}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Enviar no WhatsApp</span>
                  </a>
                </div>
              </div>

              <form onSubmit={handleSaveClientChanges} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold block mb-1">Nome Completo</label>
                    <input
                      type="text"
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Data Nascimento</label>
                    <input
                      type="date"
                      value={editFormData.birth || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, birth: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={editFormData.wpp || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, wpp: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">E-mail</label>
                    <input
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-semibold block mb-1">Endereço Completo</label>
                    <div className="grid grid-cols-6 gap-2">
                      <input
                        type="text"
                        placeholder="Rua"
                        value={editFormData.street || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, street: e.target.value })}
                        className="col-span-3 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                      />
                      <input
                        type="text"
                        placeholder="Nº"
                        value={editFormData.num || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, num: e.target.value })}
                        className="col-span-1 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                      />
                      <input
                        type="text"
                        placeholder="Bairro"
                        value={editFormData.bairro || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, bairro: e.target.value })}
                        className="col-span-2 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Modalidade & Pote</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editFormData.type || 'assinatura'}
                        onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as 'assinatura' | 'avulsa' })}
                        className="px-2 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                      >
                        <option value="assinatura">Assinatura</option>
                        <option value="avulsa">Avulsa</option>
                      </select>
                      <select
                        value={editFormData.size || '500'}
                        onChange={(e) => setEditFormData({ ...editFormData, size: e.target.value as '250' | '500' | '1000' })}
                        className="px-2 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                      >
                        <option value="250">250g</option>
                        <option value="500">500g</option>
                        <option value="1000">1kg</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Status da Assinatura</label>
                    <select
                      value={editFormData.status || 'Ativo'}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as Client['status'] })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Aguardando Validação">Aguardando Validação (Pago pelo Cliente)</option>
                      <option value="Aguardando Pagamento">Aguardando Pagamento (Pendente PIX)</option>
                      <option value="Pausado">Pausado</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Nova Senha do Cliente (opcional)</label>
                    <input
                      type="text"
                      value={newClientPassword}
                      onChange={(e) => setNewClientPassword(e.target.value)}
                      placeholder="Deixe em branco para manter"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Observações Internas</label>
                    <input
                      type="text"
                      value={editFormData.notes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      placeholder="Ex: Deixar na portaria com Seu Zé"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteClient(selectedClient.code)}
                    className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Cliente</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {onImpersonateClient && (
                      <button
                        type="button"
                        onClick={() => {
                          onImpersonateClient(selectedClient);
                          setSelectedClient(null);
                          onClose();
                        }}
                        className="px-3.5 py-2 rounded-xl border border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Entrar no Dashboard Deste Cliente</span>
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={isSavingClient}
                      className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                    >
                      {isSavingClient ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Order History Manager */}
              <div className="pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Histórico de Pedidos ({selectedClient.hist.length})
                </h4>

                <div className="max-h-40 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-700">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50 dark:bg-stone-800 text-stone-500">
                      <tr>
                        <th className="py-2 px-2.5">Compra</th>
                        <th className="py-2 px-2.5">Entrega</th>
                        <th className="py-2 px-2.5">Pote</th>
                        <th className="py-2 px-2.5">Tipo</th>
                        <th className="py-2 px-2.5">Valor</th>
                        <th className="py-2 px-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
                      {selectedClient.hist.map((order, idx) => (
                        <tr key={order.id || idx}>
                          <td className="py-1.5 px-2.5">{order.date.split('-').reverse().join('/')}</td>
                          <td className="py-1.5 px-2.5 text-emerald-700">{order.deliveryDate?.split('-').reverse().join('/') || '—'}</td>
                          <td className="py-1.5 px-2.5 font-bold">{order.size}g</td>
                          <td className="py-1.5 px-2.5 capitalize">{order.type}</td>
                          <td className="py-1.5 px-2.5 font-mono">{formatBRL(order.val)}</td>
                          <td className="py-1.5 px-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveClientOrder(order.id || String(idx))}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remover"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add new order row */}
                <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                  <input
                    type="date"
                    value={newOrderDate}
                    onChange={(e) => setNewOrderDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                  <select
                    value={newOrderSize}
                    onChange={(e) => setNewOrderSize(e.target.value as '250' | '500' | '1000')}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                  >
                    <option value="250">250g</option>
                    <option value="500">500g</option>
                    <option value="1000">1kg</option>
                  </select>
                  <select
                    value={newOrderType}
                    onChange={(e) => setNewOrderType(e.target.value as 'assinatura' | 'avulsa')}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  >
                    <option value="assinatura">Assinatura</option>
                    <option value="avulsa">Avulsa</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddClientOrder}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lançar Nova Compra</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Edit / Create Modal */}
        {isEditingProduct && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 overflow-y-auto animate-in fade-in duration-150">
            <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 my-6 max-h-[90vh] overflow-y-auto relative">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-white">
                      {editingProductData.id ? 'Editar Produto & Valores' : 'Cadastrar Novo Produto'}
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Configure nome, categoria, fotos e defina os preços para assinatura e compra avulsa
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingProduct(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {productSaveMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  productSaveMsg.includes('sucesso')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{productSaveMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                {/* Nome & Categoria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Alho Roxo Descascado"
                      value={editingProductData.name || ''}
                      onChange={(e) => setEditingProductData({ ...editingProductData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Categoria
                    </label>
                    <select
                      value={editingProductData.category || 'Alho Fresco'}
                      onChange={(e) => setEditingProductData({ ...editingProductData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                    >
                      <option value="Alho Fresco">Alho Fresco Selecionado</option>
                      <option value="Pastas & Cremes">Pasta / Creme de Alho</option>
                      <option value="Molhos Especiais">Molhos Artesanais</option>
                      <option value="Temperos Naturais">Temperos Naturais</option>
                      <option value="Conservas & Picles">Conservas & Picles</option>
                      <option value="Outro">Outro Produto</option>
                    </select>
                  </div>
                </div>

                {/* Unidade / Peso & Descrição */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Unidade / Peso *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 250g, 500g, 1kg, Pote 300g"
                      value={editingProductData.unit || ''}
                      onChange={(e) => setEditingProductData({ ...editingProductData, unit: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-bold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Descrição Resumida
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Dentes inteiros de alho roxo natural, descascados a mão"
                      value={editingProductData.description || ''}
                      onChange={(e) => setEditingProductData({ ...editingProductData, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Imagem do Produto com Upload e Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-stone-700 dark:text-stone-300">
                      Foto do Produto *
                    </label>
                    {editingProductData.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingProductData({ ...editingProductData, imageUrl: '' })}
                        className="text-[11px] text-red-600 hover:text-red-700 dark:text-red-400 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remover Foto</span>
                      </button>
                    )}
                  </div>

                  {/* Upload Box / Image Preview */}
                  <div className="p-3.5 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/40 hover:border-emerald-600 transition-colors">
                    {editingProductData.imageUrl ? (
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 shrink-0 shadow-inner">
                          <img
                            src={editingProductData.imageUrl}
                            alt="Preview do produto"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-2 text-center sm:text-left flex-1">
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Foto Carregada com Sucesso</span>
                          </div>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            Esta foto será exibida com destaque para os clientes na loja e na assinatura.
                          </p>
                          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all active:scale-95">
                            {isUploadingProductPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                            <span>{isUploadingProductPhoto ? 'Processando Foto...' : 'Trocar Foto do Aparelho'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingProductPhoto}
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) handleProductFileUpload(e.target.files[0]);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-5 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-2 shadow-xs">
                          {isUploadingProductPhoto ? (
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                          ) : (
                            <Camera className="w-6 h-6" />
                          )}
                        </div>
                        <p className="font-extrabold text-stone-900 dark:text-white text-xs">
                          Adicionar Foto do Produto
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-3 max-w-xs">
                          Tire uma foto direta do celular ou escolha do rolo de fotos / computador.
                        </p>

                        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95">
                          <Upload className="w-4 h-4" />
                          <span>{isUploadingProductPhoto ? 'Processando Foto...' : 'Carregar Foto do Computador ou Celular'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingProductPhoto}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleProductFileUpload(e.target.files[0]);
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Direct URL input fallback */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">
                      Ou cole o link direto da imagem (URL da internet):
                    </label>
                    <input
                      type="url"
                      placeholder="https://... link da imagem do produto"
                      value={editingProductData.imageUrl || ''}
                      onChange={(e) => setEditingProductData({ ...editingProductData, imageUrl: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs"
                    />
                  </div>

                  {/* Quick image presets */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 pt-1">
                    <span className="font-semibold">Fotos prontas da A Mi Gusto:</span>
                    <button
                      type="button"
                      onClick={() => setEditingProductData({ ...editingProductData, imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80' })}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium cursor-pointer"
                    >
                      Pote 500g
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProductData({ ...editingProductData, imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80' })}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium cursor-pointer"
                    >
                      Alho Roxo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProductData({ ...editingProductData, imageUrl: 'https://images.unsplash.com/photo-1588691896695-1f9172288331?auto=format&fit=crop&w=600&q=80' })}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium cursor-pointer"
                    >
                      Dentes Selecionados
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProductData({ ...editingProductData, imageUrl: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=600&q=80' })}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium cursor-pointer"
                    >
                      Pasta / Molho
                    </button>
                  </div>
                </div>

                {/* Modalidades de Venda & Preços */}
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-3">
                  <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Modalidades de Comercialização & Preços</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Assinatura */}
                    <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingProductData.allowSubscription !== false}
                          onChange={(e) => setEditingProductData({ ...editingProductData, allowSubscription: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span className="font-bold text-stone-800 dark:text-stone-200">
                          Disponível para Assinatura
                        </span>
                      </label>
                      <p className="text-[11px] text-stone-500">
                        O cliente pode assinar para entrega semanal, quinzenal ou mensal.
                      </p>
                      {editingProductData.allowSubscription !== false && (
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                            Preço Assinatura (R$)
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required={editingProductData.allowSubscription}
                            value={editingProductData.subscriptionPrice ?? 20}
                            onChange={(e) => setEditingProductData({ ...editingProductData, subscriptionPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-extrabold text-emerald-700 dark:text-emerald-400 text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Avulso */}
                    <div className="p-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingProductData.allowOneOff !== false}
                          onChange={(e) => setEditingProductData({ ...editingProductData, allowOneOff: e.target.checked })}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span className="font-bold text-stone-800 dark:text-stone-200">
                          Disponível para Compra Avulsa
                        </span>
                      </label>
                      <p className="text-[11px] text-stone-500">
                        Venda avulsa para pedidos individuais sem recorrência obrigatória.
                      </p>
                      {editingProductData.allowOneOff !== false && (
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-0.5">
                            Preço Compra Avulsa (R$)
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required={editingProductData.allowOneOff}
                            value={editingProductData.oneOffPrice ?? 25}
                            onChange={(e) => setEditingProductData({ ...editingProductData, oneOffPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-extrabold text-stone-800 dark:text-stone-200 text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Opções extras */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProductData.isPopular || false}
                      onChange={(e) => setEditingProductData({ ...editingProductData, isPopular: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded"
                    />
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      ★ Destacar como Mais Vendido / Popular
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProductData.active !== false}
                      onChange={(e) => setEditingProductData({ ...editingProductData, active: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      Produto Ativo na Loja
                    </span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingProduct(false)}
                    className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProduct}
                    className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md"
                  >
                    {isSavingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Salvar Produto & Preços</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Financial Transaction Edit / Create Modal */}
        {isEditingTx && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 overflow-y-auto animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4 my-6 max-h-[90vh] overflow-y-auto relative">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    editingTxData.type === 'receita'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  }`}>
                    {editingTxData.type === 'receita' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-white">
                      {editingTxData.id ? 'Editar Lançamento Financeiro' : 'Novo Lançamento Financeiro'}
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Registre receitas de clientes ou custos com matéria-prima, embalagens e frete
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingTx(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {txSaveMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  txSaveMsg.includes('sucesso')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{txSaveMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveFinancialTx} className="space-y-3.5 text-xs">
                {/* Tipo de Transação: Receita ou Despesa */}
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Tipo de Lançamento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTxData({ ...editingTxData, type: 'despesa', category: 'materia_prima' })}
                      className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                        editingTxData.type === 'despesa'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      <TrendingDown className="w-4 h-4" />
                      <span>Despesa Operacional (-)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTxData({ ...editingTxData, type: 'receita', category: 'venda_avulsa' })}
                      className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                        editingTxData.type === 'receita'
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Receita / Entrada (+)</span>
                    </button>
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Categoria do Lançamento *
                  </label>
                  <select
                    value={editingTxData.category || (editingTxData.type === 'despesa' ? 'materia_prima' : 'venda_avulsa')}
                    onChange={(e) => setEditingTxData({ ...editingTxData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-medium"
                  >
                    {editingTxData.type === 'despesa' ? (
                      <>
                        <option value="materia_prima">Alho Matéria-Prima (Ceasa / Produtor)</option>
                        <option value="embalagens">Potes & Embalagens BPA-free</option>
                        <option value="rotulos">Rótulos, Etiquetas & Impressões</option>
                        <option value="combustivel">Combustível & Frete de Entrega</option>
                        <option value="manutencao">Manutenção & Utensílios de Cozinha</option>
                        <option value="marketing">Marketing, Anúncios & Divulgação</option>
                        <option value="outros">Outras Despesas Operacionais</option>
                      </>
                    ) : (
                      <>
                        <option value="assinatura">Receita de Assinaturas</option>
                        <option value="venda_avulsa">Receita de Venda Avulsa</option>
                        <option value="parceria">Receita de Parcerias (Banner Home)</option>
                        <option value="outros">Outras Receitas</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Descrição / Histórico *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={editingTxData.type === 'despesa' ? 'Ex: 50kg Alho Ceasa Pavilhão 21' : 'Ex: Venda 3 potes avulsos'}
                    value={editingTxData.description || ''}
                    onChange={(e) => setEditingTxData({ ...editingTxData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                  />
                </div>

                {/* Valor & Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0,00"
                      value={editingTxData.amount ?? ''}
                      onChange={(e) => setEditingTxData({ ...editingTxData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-extrabold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Data da Movimentação *
                    </label>
                    <input
                      type="date"
                      required
                      value={editingTxData.date || new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setEditingTxData({ ...editingTxData, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-medium"
                    />
                  </div>
                </div>

                {/* Forma de Pagamento & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={editingTxData.paymentMethod || 'pix'}
                      onChange={(e) => setEditingTxData({ ...editingTxData, paymentMethod: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white uppercase font-bold"
                    >
                      <option value="pix">PIX</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao">Cartão de Crédito / Débito</option>
                      <option value="boleto">Boleto Bancário</option>
                      <option value="transferencia">Transferência TED / DOC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Status da Transação
                    </label>
                    <select
                      value={editingTxData.status || 'confirmado'}
                      onChange={(e) => setEditingTxData({ ...editingTxData, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-bold"
                    >
                      <option value="confirmado">Confirmado / Pago</option>
                      <option value="pendente">Pendente (Aguardando PIX)</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                {/* Cliente ou Fornecedor & Observações */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Cliente / Fornecedor (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: João Silva ou Distribuidora Ceasa"
                      value={editingTxData.clientName || ''}
                      onChange={(e) => setEditingTxData({ ...editingTxData, clientName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Observações / Anotações
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Nota fiscal 4821, lote 02"
                      value={editingTxData.notes || ''}
                      onChange={(e) => setEditingTxData({ ...editingTxData, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingTx(false)}
                    className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTx}
                    className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md"
                  >
                    {isSavingTx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Salvar Lançamento</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Testimonial Edit / Create Modal */}
        {isEditingTestimonial && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-4 sm:p-6 space-y-4 my-4 max-h-[92vh] overflow-y-auto relative">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white">
                      {editingTestimonialData.id ? 'Editar Depoimento de Cliente' : 'Adicionar Novo Depoimento'}
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Alterações são aplicadas instantaneamente na Home Page da A Mi Gusto
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditingTestimonial(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {testimonialSaveMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  testimonialSaveMsg.includes('sucesso')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{testimonialSaveMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveTestimonial} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Dra. Camila Brandão"
                      value={editingTestimonialData.name || ''}
                      onChange={(e) => setEditingTestimonialData({ ...editingTestimonialData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Perfil / Ocupação
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Chef Executivo, Assinante..."
                      value={editingTestimonialData.roleOrProfile || ''}
                      onChange={(e) => setEditingTestimonialData({ ...editingTestimonialData, roleOrProfile: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Copacabana"
                      value={editingTestimonialData.neighborhood || ''}
                      onChange={(e) => setEditingTestimonialData({ ...editingTestimonialData, neighborhood: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Rio de Janeiro"
                      value={editingTestimonialData.city || ''}
                      onChange={(e) => setEditingTestimonialData({ ...editingTestimonialData, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Categoria
                    </label>
                    <select
                      value={editingTestimonialData.category || 'assinantes'}
                      onChange={(e) => setEditingTestimonialData({ ...editingTestimonialData, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs"
                    >
                      <option value="assinantes">Assinantes Periódicos</option>
                      <option value="chefs">Chefs & Restaurantes</option>
                      <option value="familias">Cozinha de Família</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Nota (Estrelas)
                    </label>
                    <div className="flex items-center gap-1 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setEditingTestimonialData({ ...editingTestimonialData, rating: star })}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 sm:w-5 sm:h-5 ${
                              star <= (editingTestimonialData.rating || 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-stone-300 dark:text-stone-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Pote / Plano Utilizado
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Pote 500g (Assinatura Quinzenal)"
                      value={editingTestimonialData.planOrProduct || ''}
                      onChange={(e) => setEditingTestimonialData({ ...editingTestimonialData, planOrProduct: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Selo de Destaque (Canto do Card)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Cliente Verificada, Restaurante Parceiro"
                      value={editingTestimonialData.highlightTag || ''}
                      onChange={(e) => setEditingTestimonialData({ ...editingTestimonialData, highlightTag: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Data Exibida
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Há 3 dias, Hoje"
                      value={editingTestimonialData.date || ''}
                      onChange={(e) => setEditingTestimonialData({ ...editingTestimonialData, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                      Curtidas (Útil)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingTestimonialData.helpfulCount ?? 0}
                      onChange={(e) => setEditingTestimonialData({ ...editingTestimonialData, helpfulCount: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs"
                    />
                  </div>
                </div>

                {/* Foto do Cliente */}
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Foto do Cliente ou Prato (Opcional)
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                    {editingTestimonialData.avatarUrl ? (
                      <img
                        src={editingTestimonialData.avatarUrl}
                        alt="Avatar preview"
                        className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-500 flex items-center justify-center shrink-0">
                        {isUploadingTestimonialPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{editingTestimonialData.avatarUrl ? 'Trocar Foto' : 'Carregar Foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingTestimonialPhoto}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleTestimonialPhotoUpload(e.target.files[0]);
                            }}
                          />
                        </label>
                        {editingTestimonialData.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => setEditingTestimonialData({ ...editingTestimonialData, avatarUrl: '' })}
                            className="text-xs text-red-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remover</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="Ou cole a URL da foto (https://...)"
                        value={editingTestimonialData.avatarUrl || ''}
                        onChange={(e) => setEditingTestimonialData({ ...editingTestimonialData, avatarUrl: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Texto do Depoimento */}
                <div>
                  <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Texto do Depoimento *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Escreva ou edite o depoimento completo do cliente..."
                    value={editingTestimonialData.content || ''}
                    onChange={(e) => setEditingTestimonialData({ ...editingTestimonialData, content: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white text-base sm:text-xs resize-none"
                  />
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTestimonialData.verified !== false}
                      onChange={(e) => setEditingTestimonialData({ ...editingTestimonialData, verified: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      Selo Cliente Verificado
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTestimonialData.active !== false}
                      onChange={(e) => setEditingTestimonialData({ ...editingTestimonialData, active: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      Exibir na Página Principal
                    </span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingTestimonial(false)}
                    className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTestimonial}
                    className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    {isSavingTestimonial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Salvar Depoimento</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
