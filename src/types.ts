export type DeliveryStatus = 'recebido' | 'preparando' | 'saiu_entrega' | 'entregue';

export interface PurchaseItem {
  id?: string;
  date: string; // YYYY-MM-DD
  deliveryDate?: string; // YYYY-MM-DD
  size: '250' | '500' | '1000';
  type: 'assinatura' | 'avulsa';
  val: number;
  deliveryStatus?: DeliveryStatus; // 'recebido' | 'preparando' | 'saiu_entrega' | 'entregue'
  deliveryStatusUpdatedAt?: string;
  driverName?: string;
  deliveryDriver?: string;
  driverPhone?: string;
  estimatedMinutes?: number;
  deliveryNotes?: string;
}

export interface Client {
  id: string;
  code: string; // e.g. AMG001
  name: string;
  birth: string; // YYYY-MM-DD
  cep: string;
  street: string;
  num: string;
  comp?: string;
  bairro: string;
  city: string;
  uf: string;
  email: string;
  wpp: string;
  type: 'assinatura' | 'avulsa';
  size: '250' | '500' | '1000';
  freq: number; // 4 (semanal), 2 (quinzenal), 1 (mensal), 0 (avulsa)
  status: 'Ativo' | 'Pausado' | 'Cancelado' | 'Aguardando Pagamento' | 'Aguardando Validação';
  pdate: string; // initial purchase date
  ref?: string; // referred by code
  sent: number; // number of free 500g pots already sent
  pwh: string; // password hash
  plainPw?: string; // plain text password for owner recovery and assistance
  notes?: string;
  hist: PurchaseItem[];
  createdAt: string;
}

export interface PartnerBanner {
  id: string;
  partnerName: string; // Nome da empresa ou negócio
  clientCode?: string; // Código do cliente caso seja cliente da casa (ex: AMG...)
  title: string;
  description?: string;
  mediaType: 'image' | 'video';
  mediaUrl: string; // desktop / default media (image or video URL or base64)
  mobileMediaUrl?: string; // smartphone-optimized media (optional, falls back to mediaUrl)
  linkUrl?: string; // destination URL (e.g. partner website, Instagram, WhatsApp)
  buttonText?: string; // call-to-action button text
  badge?: string; // category tag (e.g. 'Comércio Local', 'Restaurante', 'Serviço', 'Saúde & Beleza')
  active: boolean;
  order?: number;
  price?: number; // valor simbólico (padrão R$ 100,00)
  durationMonths?: number; // duração da divulgação (padrão 3 meses)
  expiresAt?: string; // data de encerramento da veiculação de 3 meses
  createdAt: string;
}

export interface Product {
  id: string;
  name: string; // Ex: Alho Triturado Tradicional, Pasta de Alho, Alho Crocante
  description: string;
  unit: string; // Ex: 250g, 500g, 1kg, 350g, 1 pote
  category?: string; // Ex: 'Alho Fresco', 'Especialidades', 'Molhos'
  imageUrl?: string;
  allowSubscription: boolean; // Permitir plano recorrente
  allowOneOff: boolean; // Permitir compra avulsa
  subscriptionPrice: number; // Preço por pote no plano de assinatura
  oneOffPrice: number; // Preço na compra avulsa
  active: boolean; // Ativo no catálogo
  isPopular?: boolean; // Pote destaque / Mais vendido
  order?: number;
  createdAt: string;
  updatedAt?: string;
}

export type FinancialTransactionType = 'receita' | 'despesa';

export type FinancialCategory =
  | 'assinatura'
  | 'venda_avulsa'
  | 'parceria'
  | 'materia_prima'
  | 'embalagens'
  | 'rotulos'
  | 'combustivel'
  | 'combustivel_entrega'
  | 'equipamentos'
  | 'manutencao'
  | 'pro_labore'
  | 'marketing'
  | 'outros';

export interface FinancialTransaction {
  id: string;
  type: FinancialTransactionType;
  category: FinancialCategory;
  description: string;
  amount: number; // Valor em Reais (R$)
  date: string; // YYYY-MM-DD
  paymentMethod: 'pix' | 'dinheiro' | 'cartao' | 'transferencia' | 'boleto' | 'outro';
  status: 'confirmado' | 'pendente' | 'cancelado';
  clientCode?: string;
  clientName?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercent: number;
  subscriptionRevenue: number;
  oneOffRevenue: number;
  partnershipRevenue: number;
  mrr: number; // Receita Recorrente Mensal estimada
  pendingReceivables: number;
  projectedRevenue30Days: number;
  transactions: FinancialTransaction[];
}

export interface AppSettings {
  prices: {
    250: number;
    500: number;
    1000: number;
  };
  avulsoPrices: {
    250: number;
    500: number;
    1000: number;
  };
  goal: number; // default: 10
  whatsapp: string;
  ownerPasswordHash: string;
  pixKey?: string;
  partners?: PartnerBanner[];
  products?: Product[];
}

export interface DashboardStats {
  totalClients: number;
  totalPurchases: number;
  subscribersCount: number;
  oneOffCount: number;
  pendingPaymentsCount: number;
  awaitingValidationCount: number;
  monthlyRecurringRevenue: number;
  totalOneOffRevenue: number;
  pendingRewardPots: number;
  birthdayCountThisMonth: number;
  monthlySales: {
    month: string;
    label: string;
    total: number;
    subscriptions: number;
    oneOff: number;
    orderCount: number;
    volumeKg: number;
  }[];
  potDistribution: {
    name: string;
    size: string;
    count: number;
    revenue: number;
  }[];
  planDistribution: {
    name: string;
    count: number;
  }[];
  todayDeliveries: {
    orderId: string;
    clientCode: string;
    clientName: string;
    wpp: string;
    address: string;
    size: string;
    type: string;
    orderDate: string;
    deliveryDate: string;
    price: number;
    deliveryStatus: DeliveryStatus;
    driverName?: string;
    driverPhone?: string;
    estimatedMinutes?: number;
    deliveryNotes?: string;
  }[];
  upcomingDeliveries: {
    clientCode: string;
    clientName: string;
    wpp: string;
    address: string;
    size: string;
    freq: string;
    deliveryDate: string;
    price: number;
  }[];
  topReferrers: {
    code: string;
    name: string;
    count: number;
    rewardsEarned: number;
  }[];
  pendingRewardsList: {
    code: string;
    name: string;
    wpp: string;
    address: string;
    pendingCount: number;
  }[];
}

export type RealtimeEvent =
  | {
      type: 'DELIVERY_STATUS_CHANGED';
      clientCode: string;
      orderId: string;
      deliveryStatus: DeliveryStatus;
      details?: {
        driverName?: string;
        driverPhone?: string;
        estimatedMinutes?: number;
        deliveryNotes?: string;
      };
      updatedAt: string;
    }
  | {
      type: 'CLIENT_PAYMENT_SENT';
      clientCode: string;
      status: string;
      timestamp: string;
    }
  | {
      type: 'CLIENT_ACTIVATED';
      clientCode: string;
      timestamp: string;
    }
  | {
      type: 'NEW_ORDER_CREATED';
      clientCode: string;
      order: PurchaseItem;
      timestamp: string;
    }
  | {
      type: 'CLIENT_UPDATED';
      clientCode: string;
      timestamp: string;
    }
  | {
      type: 'PARTNERS_UPDATED';
      partners: PartnerBanner[];
      timestamp: string;
    }
  | {
      type: 'PRODUCTS_UPDATED';
      products: Product[];
      timestamp: string;
    }
  | {
      type: 'FINANCE_UPDATED';
      timestamp: string;
    }
  | {
      type: 'CONFIG_UPDATED';
      settings: AppSettings;
      timestamp: string;
    }
  | {
      type: 'TESTIMONIALS_UPDATED';
      testimonials: Testimonial[];
      timestamp: string;
    };

export interface Testimonial {
  id: string;
  name: string;
  roleOrProfile: string;
  neighborhood: string;
  city: string;
  planOrProduct: string;
  rating: number;
  date: string;
  content: string;
  verified: boolean;
  category: 'assinantes' | 'chefs' | 'familias';
  avatarUrl?: string;
  highlightTag?: string;
  helpfulCount: number;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
