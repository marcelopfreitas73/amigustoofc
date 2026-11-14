import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  Client,
  AppSettings,
  DashboardStats,
  PurchaseItem,
  DeliveryStatus,
  PartnerBanner,
  Product,
  FinancialTransaction,
  FinancialSummary,
  Testimonial,
} from '../types.js';

const DATA_DIR = path.resolve('data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
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
    active: true,
    createdAt: new Date().toISOString(),
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
    active: true,
    createdAt: new Date().toISOString(),
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
    active: true,
    createdAt: new Date().toISOString(),
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
    active: true,
    createdAt: new Date().toISOString(),
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
    active: true,
    createdAt: new Date().toISOString(),
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
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_PARTNERS: PartnerBanner[] = [
  {
    id: 'p-01',
    partnerName: "Bistrô & Parrilla D'Ouro",
    title: "Culinária Autêntica & Carnes Nobres da Nossa Região",
    description: "Empresa parceira de cliente A Mi Gusto. Conheça pratos artesanais e cortes nobres preparados com carinho e sabor de verdade.",
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    mobileMediaUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    linkUrl: 'https://wa.me/5521999999999',
    buttonText: 'Conhecer Empresa & Cardápio',
    badge: 'Empresa Parceira',
    active: true,
    order: 1,
    price: 100,
    durationMonths: 3,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-02',
    partnerName: 'Empório & Mercearia Carioca',
    title: 'Produtos Selecionados & Ponto de Retirada na Zona Sul',
    description: "Comércio parceiro divulgado na A Mi Gusto. Queijos artesanais, temperos e retirada expressa para a comunidade.",
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    mobileMediaUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80',
    linkUrl: 'https://wa.me/5521999999999',
    buttonText: 'Ver Produtos & Horários',
    badge: 'Comércio Local',
    active: true,
    order: 2,
    price: 100,
    durationMonths: 3,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-250',
    name: 'Alho Triturado Tradicional 250g',
    description: '100% puro e fresco, sem conservantes químicos. Pote prático para uso no dia a dia.',
    unit: '250g',
    category: 'Alho Fresco',
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
    allowSubscription: true,
    allowOneOff: true,
    subscriptionPrice: 13,
    oneOffPrice: 15,
    active: true,
    isPopular: false,
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-500',
    name: 'Alho Triturado Tradicional 500g',
    description: 'O tamanho mais pedido pelas famílias e quem ama cozinhar. Rendimento ideal com aroma marcante.',
    unit: '500g',
    category: 'Alho Fresco',
    imageUrl: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=600&q=80',
    allowSubscription: true,
    allowOneOff: true,
    subscriptionPrice: 20,
    oneOffPrice: 25,
    active: true,
    isPopular: true,
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-1000',
    name: 'Alho Triturado Gourmet & Chef 1kg',
    description: 'Pote econômico de 1kg para quem cozinha muito, restaurantes, churrascos e famílias grandes.',
    unit: '1kg',
    category: 'Alho Fresco',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    allowSubscription: true,
    allowOneOff: true,
    subscriptionPrice: 36,
    oneOffPrice: 40,
    active: true,
    isPopular: false,
    order: 3,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_FINANCIAL_TRANSACTIONS: FinancialTransaction[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  prices: { 250: 13, 500: 20, 1000: 36 },
  avulsoPrices: { 250: 15, 500: 25, 1000: 40 },
  goal: 10,
  whatsapp: '21981142230',
  ownerPasswordHash: '', // Will be set on first login if empty
  pixKey: '21981142230',
  partners: DEFAULT_PARTNERS,
  products: DEFAULT_PRODUCTS,
};

export const hashPassword = (input: string): string => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

const addDays = (d: string, n: number): string => {
  const x = new Date(d + 'T12:00:00');
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};

export const nextDeliveryDate = (orderDate: string): string => {
  return addDays(orderDate, 1);
};

export const formatCurrency = (val: number): string => {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface DatabaseSchema {
  settings: AppSettings;
  clients: Client[];
  products: Product[];
  financialTransactions: FinancialTransaction[];
  testimonials: Testimonial[];
}

// Initial seed data: AMG001 belongs to the system owner (Marcelo Pereira), without demonstration clients
const todayStr = new Date().toISOString().slice(0, 10);
const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c-amg001',
    code: 'AMG001',
    name: 'Marcelo Pereira (Dono A Mi Gusto)',
    birth: '1985-05-10',
    cep: '22041-001',
    street: 'Rua Barata Ribeiro',
    num: '450',
    comp: 'Sala 101',
    bairro: 'Copacabana',
    city: 'Rio de Janeiro',
    uf: 'RJ',
    email: 'marcelopereira528@gmail.com',
    wpp: '(21) 99999-9999',
    type: 'assinatura',
    size: '500',
    freq: 2, // quinzenal
    status: 'Ativo',
    pdate: todayStr,
    ref: '',
    sent: 0,
    pwh: hashPassword('c-amg001:123456'),
    plainPw: '123456',
    notes: 'Conta master do proprietário do sistema A Mi Gusto.',
    hist: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c-amg002',
    code: 'AMG002',
    name: 'Veronica Venancio da Silva',
    birth: '1988-06-15',
    cep: '22041-001',
    street: 'Avenida Atlântica',
    num: '1500',
    comp: '',
    bairro: 'Copacabana',
    city: 'Rio de Janeiro',
    uf: 'RJ',
    email: 'veronicavenancio74@gmail.com',
    wpp: '(21) 98628-5865',
    type: 'assinatura',
    size: '500',
    freq: 2, // quinzenal
    status: 'Ativo',
    pdate: todayStr,
    ref: '',
    sent: 0,
    pwh: hashPassword('c-amg002:123456'),
    plainPw: '123456',
    notes: 'Cliente cadastrada no sistema A Mi Gusto.',
    hist: [
      {
        id: 'ord-veronica-01',
        date: todayStr,
        deliveryDate: nextDeliveryDate(todayStr),
        size: '500',
        type: 'assinatura',
        val: 20,
        deliveryStatus: 'recebido',
        deliveryStatusUpdatedAt: new Date().toISOString(),
        driverName: 'Marcos Silva (Entregador A Mi Gusto)',
        driverPhone: '(21) 98765-4321',
        estimatedMinutes: 25,
        deliveryNotes: 'Entrega inicial agendada.',
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      settings: { ...DEFAULT_SETTINGS },
      clients: [...INITIAL_CLIENTS],
      products: [...DEFAULT_PRODUCTS],
      financialTransactions: [...DEFAULT_FINANCIAL_TRANSACTIONS],
      testimonials: [...DEFAULT_TESTIMONIALS],
    };
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.settings && Array.isArray(parsed.clients)) {
          this.data = parsed;
          let changed = false;

          // Ensure settings.partners exists
          if (!this.data.settings.partners || this.data.settings.partners.length === 0) {
            this.data.settings.partners = [...DEFAULT_PARTNERS];
            changed = true;
          }

          // Ensure products exist
          if (!this.data.products || this.data.products.length === 0) {
            this.data.products = [...DEFAULT_PRODUCTS];
            changed = true;
          }
          this.data.settings.products = this.data.products;

          // Ensure financial transactions array exists (starts zeroed so owner administers from scratch)
          if (!Array.isArray(this.data.financialTransactions)) {
            this.data.financialTransactions = [];
            changed = true;
          }

          // Ensure client Veronica Venancio da Silva (AMG002) is present
          let veronicaClient = this.data.clients.find(c => c.code === 'AMG002' || c.email === 'veronicavenancio74@gmail.com');
          if (!veronicaClient) {
            this.data.clients.push({ ...INITIAL_CLIENTS[1] });
            changed = true;
          }

          // Ensure AMG001 has the owner profile
          let ownerClient = this.data.clients.find(c => c.code === 'AMG001');
          if (!ownerClient) {
            this.data.clients.unshift({ ...INITIAL_CLIENTS[0] });
            changed = true;
          } else {
            if (ownerClient.email !== 'marcelopereira528@gmail.com' || ownerClient.name !== 'Marcelo Pereira (Dono A Mi Gusto)') {
              ownerClient.name = 'Marcelo Pereira (Dono A Mi Gusto)';
              ownerClient.email = 'marcelopereira528@gmail.com';
              ownerClient.notes = 'Conta master do proprietário do sistema A Mi Gusto.';
              ownerClient.plainPw = '123456';
              ownerClient.pwh = hashPassword(`${ownerClient.id || 'c-amg001'}:123456`);
              changed = true;
            }
            if (!ownerClient.plainPw) {
              ownerClient.plainPw = '123456';
              changed = true;
            }
          }

          // Ensure PIX key is configured to official store PIX: 21981142230
          if (!this.data.settings.pixKey || this.data.settings.pixKey === 'contato@amigusto.com.br') {
            this.data.settings.pixKey = '21981142230';
            changed = true;
          }

          // Exclude AMG001 (system owner) from accounting ledger
          if (this.data.financialTransactions) {
            const initialLen = this.data.financialTransactions.length;
            this.data.financialTransactions = this.data.financialTransactions.filter(t => t.clientCode !== 'AMG001');
            if (this.data.financialTransactions.length !== initialLen) {
              changed = true;
            }
          }

          // Ensure testimonials exist
          if (!this.data.testimonials || !Array.isArray(this.data.testimonials) || this.data.testimonials.length === 0) {
            this.data.testimonials = [...DEFAULT_TESTIMONIALS];
            changed = true;
          }

          if (changed) {
            this.persist();
          }
          return;
        }
      } catch (err) {
        console.error('Error reading database file, resetting to initial state', err);
      }
    }

    this.persist();
  }

  private persist() {
    try {
      const tmp = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public getSettings(): AppSettings {
    return { ...this.data.settings };
  }

  public updateSettings(newSettings: Partial<AppSettings>): AppSettings {
    const updatedPrices = {
      ...this.data.settings.prices,
      ...(newSettings.prices || {}),
    };
    const updatedAvulsoPrices = {
      ...this.data.settings.avulsoPrices,
      ...(newSettings.avulsoPrices || {}),
    };

    this.data.settings = {
      ...this.data.settings,
      ...newSettings,
      prices: updatedPrices,
      avulsoPrices: updatedAvulsoPrices,
      pixKey: newSettings.pixKey !== undefined ? String(newSettings.pixKey).trim() : (this.data.settings.pixKey || '21981142230'),
      partners: newSettings.partners !== undefined ? newSettings.partners : this.data.settings.partners,
    };

    // Synchronize product catalog prices with general prices
    if (this.data.products && this.data.products.length > 0) {
      for (const prod of this.data.products) {
        if (prod.unit === '250g' || prod.id === 'prod-250') {
          if (updatedPrices[250] !== undefined) prod.subscriptionPrice = Number(updatedPrices[250]);
          if (updatedAvulsoPrices[250] !== undefined) prod.oneOffPrice = Number(updatedAvulsoPrices[250]);
        } else if (prod.unit === '500g' || prod.id === 'prod-500') {
          if (updatedPrices[500] !== undefined) prod.subscriptionPrice = Number(updatedPrices[500]);
          if (updatedAvulsoPrices[500] !== undefined) prod.oneOffPrice = Number(updatedAvulsoPrices[500]);
        } else if (prod.unit === '1kg' || prod.unit === '1000g' || prod.id === 'prod-1000') {
          if (updatedPrices[1000] !== undefined) prod.subscriptionPrice = Number(updatedPrices[1000]);
          if (updatedAvulsoPrices[1000] !== undefined) prod.oneOffPrice = Number(updatedAvulsoPrices[1000]);
        }
      }
      this.data.settings.products = this.data.products;
    }

    this.persist();
    return this.getSettings();
  }

  public getPartners(): PartnerBanner[] {
    return this.data.settings.partners || [];
  }

  public addPartner(partner: Omit<PartnerBanner, 'id' | 'createdAt'>): PartnerBanner {
    if (!this.data.settings.partners) {
      this.data.settings.partners = [];
    }
    const duration = partner.durationMonths ?? 3;
    const expires = partner.expiresAt || new Date(Date.now() + duration * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const newPartner: PartnerBanner = {
      ...partner,
      id: 'p-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      price: partner.price ?? 100,
      durationMonths: duration,
      expiresAt: expires,
      order: partner.order || this.data.settings.partners.length + 1,
      createdAt: new Date().toISOString(),
    };
    this.data.settings.partners.push(newPartner);
    this.persist();
    return newPartner;
  }

  public updatePartner(id: string, updates: Partial<PartnerBanner>): PartnerBanner | null {
    if (!this.data.settings.partners) return null;
    const idx = this.data.settings.partners.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.settings.partners[idx] = {
      ...this.data.settings.partners[idx],
      ...updates,
    };
    this.persist();
    return this.data.settings.partners[idx];
  }

  public deletePartner(id: string): boolean {
    if (!this.data.settings.partners) return false;
    const initialLen = this.data.settings.partners.length;
    this.data.settings.partners = this.data.settings.partners.filter(p => p.id !== id);
    const removed = this.data.settings.partners.length < initialLen;
    if (removed) {
      this.persist();
    }
    return removed;
  }

  // ==========================================
  // PRODUCTS MANAGEMENT (Cadastro & Alteração)
  // ==========================================
  public getProducts(): Product[] {
    if (!this.data.products || this.data.products.length === 0) {
      this.data.products = [...DEFAULT_PRODUCTS];
      this.persist();
    }
    return [...this.data.products].sort((a, b) => (a.order || 99) - (b.order || 99));
  }

  public saveProduct(productData: Partial<Product>): Product {
    if (!this.data.products) {
      this.data.products = [...DEFAULT_PRODUCTS];
    }

    const parseSafeNum = (val: any, fallback: number = 0): number => {
      if (typeof val === 'number') return isNaN(val) ? fallback : val;
      if (!val) return fallback;
      const n = Number(String(val).replace(',', '.').trim());
      return isNaN(n) ? fallback : n;
    };

    let product: Product;
    if (productData.id) {
      const idx = this.data.products.findIndex(p => p.id === productData.id);
      if (idx !== -1) {
        product = {
          ...this.data.products[idx],
          ...productData,
          subscriptionPrice: parseSafeNum(productData.subscriptionPrice, this.data.products[idx].subscriptionPrice),
          oneOffPrice: parseSafeNum(productData.oneOffPrice, this.data.products[idx].oneOffPrice),
          updatedAt: new Date().toISOString(),
        } as Product;
        this.data.products[idx] = product;
      } else {
        product = {
          id: productData.id,
          name: productData.name || 'Novo Produto',
          description: productData.description || '',
          unit: productData.unit || '500g',
          category: productData.category || 'Alho Fresco',
          imageUrl: productData.imageUrl || '',
          allowSubscription: productData.allowSubscription !== false,
          allowOneOff: productData.allowOneOff !== false,
          subscriptionPrice: parseSafeNum(productData.subscriptionPrice, 20),
          oneOffPrice: parseSafeNum(productData.oneOffPrice, 25),
          active: productData.active !== false,
          isPopular: Boolean(productData.isPopular),
          order: productData.order || this.data.products.length + 1,
          createdAt: new Date().toISOString(),
        };
        this.data.products.push(product);
      }
    } else {
      product = {
        id: `prod-${Date.now()}`,
        name: productData.name || 'Novo Produto',
        description: productData.description || '',
        unit: productData.unit || '500g',
        category: productData.category || 'Alho Fresco',
        imageUrl: productData.imageUrl || '',
        allowSubscription: productData.allowSubscription !== false,
        allowOneOff: productData.allowOneOff !== false,
        subscriptionPrice: parseSafeNum(productData.subscriptionPrice, 20),
        oneOffPrice: parseSafeNum(productData.oneOffPrice, 25),
        active: productData.active !== false,
        isPopular: Boolean(productData.isPopular),
        order: this.data.products.length + 1,
        createdAt: new Date().toISOString(),
      };
      this.data.products.push(product);
    }

    // Keep default settings in sync if standard sizes are edited
    if (product.unit === '250g' || product.id === 'prod-250') {
      this.data.settings.prices[250] = product.subscriptionPrice;
      this.data.settings.avulsoPrices[250] = product.oneOffPrice;
    } else if (product.unit === '500g' || product.id === 'prod-500') {
      this.data.settings.prices[500] = product.subscriptionPrice;
      this.data.settings.avulsoPrices[500] = product.oneOffPrice;
    } else if (product.unit === '1kg' || product.id === 'prod-1000') {
      this.data.settings.prices[1000] = product.subscriptionPrice;
      this.data.settings.avulsoPrices[1000] = product.oneOffPrice;
    }

    this.data.settings.products = this.data.products;
    this.persist();
    return product;
  }

  public deleteProduct(id: string): boolean {
    if (!this.data.products) return false;
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.data.settings.products = this.data.products;
      this.persist();
      return true;
    }
    return false;
  }

  // ==========================================
  // TESTIMONIALS (Depoimentos Reais de Clientes)
  // ==========================================
  public getTestimonials(): Testimonial[] {
    if (!this.data.testimonials || !Array.isArray(this.data.testimonials)) {
      this.data.testimonials = [...DEFAULT_TESTIMONIALS];
      this.persist();
    }
    return this.data.testimonials;
  }

  public getTestimonialById(id: string): Testimonial | undefined {
    return this.getTestimonials().find(t => t.id === id);
  }

  public saveTestimonial(testimonialData: Partial<Testimonial>): Testimonial {
    if (!this.data.testimonials || !Array.isArray(this.data.testimonials)) {
      this.data.testimonials = [...DEFAULT_TESTIMONIALS];
    }

    const safeRating = Math.min(5, Math.max(1, Number(testimonialData.rating) || 5));
    let testimonial: Testimonial;

    if (testimonialData.id) {
      const idx = this.data.testimonials.findIndex(t => t.id === testimonialData.id);
      if (idx !== -1) {
        testimonial = {
          ...this.data.testimonials[idx],
          ...testimonialData,
          rating: safeRating,
          helpfulCount: typeof testimonialData.helpfulCount === 'number' ? testimonialData.helpfulCount : this.data.testimonials[idx].helpfulCount,
          updatedAt: new Date().toISOString(),
        } as Testimonial;
        this.data.testimonials[idx] = testimonial;
      } else {
        testimonial = {
          id: testimonialData.id,
          name: testimonialData.name || 'Cliente A Mi Gusto',
          roleOrProfile: testimonialData.roleOrProfile || 'Cliente',
          neighborhood: testimonialData.neighborhood || 'Rio de Janeiro',
          city: testimonialData.city || 'Rio de Janeiro',
          planOrProduct: testimonialData.planOrProduct || 'Pote 500g',
          rating: safeRating,
          date: testimonialData.date || 'Hoje',
          content: testimonialData.content || '',
          verified: testimonialData.verified !== false,
          category: testimonialData.category || 'assinantes',
          avatarUrl: testimonialData.avatarUrl || '',
          highlightTag: testimonialData.highlightTag || '',
          helpfulCount: Number(testimonialData.helpfulCount) || 0,
          active: testimonialData.active !== false,
          createdAt: new Date().toISOString(),
        };
        this.data.testimonials.unshift(testimonial);
      }
    } else {
      testimonial = {
        id: `test-${Date.now()}`,
        name: testimonialData.name || 'Cliente A Mi Gusto',
        roleOrProfile: testimonialData.roleOrProfile || 'Cliente',
        neighborhood: testimonialData.neighborhood || 'Rio de Janeiro',
        city: testimonialData.city || 'Rio de Janeiro',
        planOrProduct: testimonialData.planOrProduct || 'Pote 500g',
        rating: safeRating,
        date: testimonialData.date || 'Hoje',
        content: testimonialData.content || '',
        verified: testimonialData.verified !== false,
        category: testimonialData.category || 'assinantes',
        avatarUrl: testimonialData.avatarUrl || '',
        highlightTag: testimonialData.highlightTag || 'Novo Depoimento ⭐',
        helpfulCount: 0,
        active: testimonialData.active !== false,
        createdAt: new Date().toISOString(),
      };
      this.data.testimonials.unshift(testimonial);
    }

    this.persist();
    return testimonial;
  }

  public deleteTestimonial(id: string): boolean {
    if (!this.data.testimonials) return false;
    const initialLen = this.data.testimonials.length;
    this.data.testimonials = this.data.testimonials.filter(t => t.id !== id);
    if (this.data.testimonials.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public likeTestimonial(id: string): number {
    const list = this.getTestimonials();
    const item = list.find(t => t.id === id);
    if (item) {
      item.helpfulCount = (item.helpfulCount || 0) + 1;
      this.persist();
      return item.helpfulCount;
    }
    return 0;
  }

  // ==========================================
  // FINANCIAL TRANSACTIONS & SUMMARY
  // ==========================================
  public getFinancialTransactions(): FinancialTransaction[] {
    if (!this.data.financialTransactions) {
      this.data.financialTransactions = [...DEFAULT_FINANCIAL_TRANSACTIONS];
      this.persist();
    }
    return [...this.data.financialTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public saveFinancialTransaction(txData: Partial<FinancialTransaction>): FinancialTransaction {
    if (!this.data.financialTransactions) {
      this.data.financialTransactions = [...DEFAULT_FINANCIAL_TRANSACTIONS];
    }

    let tx: FinancialTransaction;
    if (txData.id) {
      const idx = this.data.financialTransactions.findIndex(t => t.id === txData.id);
      if (idx !== -1) {
        tx = {
          ...this.data.financialTransactions[idx],
          ...txData,
          amount: Number(txData.amount ?? this.data.financialTransactions[idx].amount),
          updatedAt: new Date().toISOString(),
        } as FinancialTransaction;
        this.data.financialTransactions[idx] = tx;
      } else {
        tx = {
          id: txData.id,
          type: txData.type || 'receita',
          category: txData.category || 'venda_avulsa',
          description: txData.description || 'Lançamento Financeiro',
          amount: Number(txData.amount) || 0,
          date: txData.date || new Date().toISOString().slice(0, 10),
          paymentMethod: txData.paymentMethod || 'pix',
          status: txData.status || 'confirmado',
          clientCode: txData.clientCode,
          clientName: txData.clientName,
          notes: txData.notes,
          createdAt: new Date().toISOString(),
        };
        this.data.financialTransactions.push(tx);
      }
    } else {
      tx = {
        id: `tx-${Date.now()}`,
        type: txData.type || 'receita',
        category: txData.category || 'venda_avulsa',
        description: txData.description || 'Lançamento Financeiro',
        amount: Number(txData.amount) || 0,
        date: txData.date || new Date().toISOString().slice(0, 10),
        paymentMethod: txData.paymentMethod || 'pix',
        status: txData.status || 'confirmado',
        clientCode: txData.clientCode,
        clientName: txData.clientName,
        notes: txData.notes,
        createdAt: new Date().toISOString(),
      };
      this.data.financialTransactions.push(tx);
    }

    this.persist();
    return tx;
  }

  public deleteFinancialTransaction(id: string): boolean {
    if (!this.data.financialTransactions) return false;
    const initialLen = this.data.financialTransactions.length;
    this.data.financialTransactions = this.data.financialTransactions.filter(t => t.id !== id);
    if (this.data.financialTransactions.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public clearFinancialTransactions(): void {
    this.data.financialTransactions = [];
    this.persist();
  }

  public getFinancialSummary(filters?: { month?: string }): FinancialSummary {
    // AMG001 is the system owner, not a customer. Exclude AMG001 from business revenue and accounting.
    const allTxs = this.getFinancialTransactions().filter(t => t.clientCode !== 'AMG001');
    let txs = allTxs;
    if (filters?.month) {
      txs = allTxs.filter(t => t.date.startsWith(filters.month!));
    }

    let totalRevenue = 0;
    let totalExpenses = 0;
    let subscriptionRevenue = 0;
    let oneOffRevenue = 0;
    let partnershipRevenue = 0;
    let pendingReceivables = 0;

    for (const tx of txs) {
      if (tx.status === 'cancelado') continue;
      if (tx.status === 'pendente') {
        if (tx.type === 'receita') pendingReceivables += tx.amount;
        continue;
      }
      if (tx.type === 'receita') {
        totalRevenue += tx.amount;
        if (tx.category === 'assinatura') subscriptionRevenue += tx.amount;
        else if (tx.category === 'venda_avulsa') oneOffRevenue += tx.amount;
        else if (tx.category === 'parceria') partnershipRevenue += tx.amount;
      } else if (tx.type === 'despesa') {
        totalExpenses += tx.amount;
      }
    }

    const netProfit = totalRevenue - totalExpenses;
    const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Calculate MRR from active subscribers (excluding AMG001 owner account)
    let mrr = 0;
    for (const c of this.data.clients) {
      if (c.code === 'AMG001') continue;
      if (c.type === 'assinatura' && (c.status === 'Ativo' || c.status === 'Aguardando Validação')) {
        const potPrice = this.data.settings.prices[c.size] || 20;
        const multiplier = c.freq === 4 ? 4 : c.freq === 2 ? 2 : 1;
        mrr += potPrice * multiplier;
      }
    }

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
      subscriptionRevenue,
      oneOffRevenue,
      partnershipRevenue,
      mrr,
      pendingReceivables,
      projectedRevenue30Days: mrr + (oneOffRevenue * 0.8),
      transactions: txs,
    };
  }

  public getClients(q?: string, type?: string, status?: string): Client[] {
    let list = [...this.data.clients];
    if (q) {
      const query = q.toLowerCase().trim();
      list = list.filter(
        c =>
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.wpp.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.bairro.toLowerCase().includes(query)
      );
    }
    if (type) {
      list = list.filter(c => c.type === type);
    }
    if (status) {
      list = list.filter(c => c.status === status);
    }
    return list;
  }

  public getClientByCode(code: string): Client | null {
    const target = code.trim().toUpperCase();
    return this.data.clients.find(c => c.code.toUpperCase() === target) || null;
  }

  public getClientByIdOrEmail(identifier: string): Client | null {
    const id = identifier.trim().toLowerCase();
    const cleanPhone = id.replace(/\D/g, '');
    return (
      this.data.clients.find(c => {
        if (c.code.toLowerCase() === id) return true;
        if (c.email.toLowerCase() === id) return true;
        if (cleanPhone.length >= 8 && c.wpp.replace(/\D/g, '').includes(cleanPhone)) return true;
        return false;
      }) || null
    );
  }

  public getNextCode(): string {
    const numbers = this.data.clients.map(c => {
      const match = c.code.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `AMG${String(max + 1).padStart(3, '0')}`;
  }

  public createClient(clientData: Omit<Client, 'id' | 'code' | 'sent' | 'hist' | 'createdAt'>, customPassword?: string): { client: Client; plainPassword: string } {
    const code = this.getNextCode();
    const id = 'c-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const plainPassword = customPassword || String(100000 + Math.floor(Math.random() * 900000));
    const pwh = hashPassword(`${id}:${plainPassword}`);

    const isAvulso = clientData.type === 'avulsa';
    const size = clientData.size;
    const unitPrice = isAvulso
      ? this.data.settings.avulsoPrices[size]
      : this.data.settings.prices[size];

    const pdate = clientData.pdate || new Date().toISOString().slice(0, 10);
    const deliveryDate = nextDeliveryDate(pdate);

    const firstOrder: PurchaseItem = {
      id: 'ord-' + Date.now(),
      date: pdate,
      deliveryDate,
      size,
      type: clientData.type,
      val: unitPrice,
      deliveryStatus: 'recebido',
      deliveryStatusUpdatedAt: new Date().toISOString(),
      deliveryNotes: 'Aguardando validação de pagamento e início do preparo.',
    };

    const newClient: Client = {
      ...clientData,
      status: clientData.status || 'Aguardando Pagamento',
      id,
      code,
      sent: 0,
      pwh,
      plainPw: plainPassword,
      notes: clientData.notes || '',
      hist: [firstOrder],
      createdAt: new Date().toISOString(),
    };

    this.data.clients.push(newClient);
    this.persist();
    return { client: newClient, plainPassword };
  }

  public activateClient(code: string): Client | null {
    const client = this.getClientByCode(code);
    if (!client) return null;
    client.status = 'Ativo';
    const today = new Date().toISOString().slice(0, 10);
    if (client.hist.length > 0) {
      const last = client.hist[client.hist.length - 1];
      last.deliveryDate = nextDeliveryDate(today);
      if (last.deliveryStatus === 'recebido' || !last.deliveryStatus) {
        last.deliveryStatus = 'preparando';
        last.deliveryStatusUpdatedAt = new Date().toISOString();
      }
    }
    this.persist();
    return client;
  }

  public markPaymentSent(code: string): Client | null {
    const client = this.getClientByCode(code);
    if (!client) return null;
    client.status = 'Aguardando Validação';
    this.persist();
    return client;
  }

  public updateClient(code: string, updates: Partial<Client>, newPassword?: string): Client | null {
    const idx = this.data.clients.findIndex(c => c.code.toUpperCase() === code.toUpperCase());
    if (idx === -1) return null;

    const current = this.data.clients[idx];
    let pwh = current.pwh;
    let plainPw = current.plainPw;
    if (newPassword && newPassword.trim()) {
      plainPw = newPassword.trim();
      pwh = hashPassword(`${current.id}:${plainPw}`);
    }

    const updated: Client = {
      ...current,
      ...updates,
      pwh,
      plainPw,
    };

    this.data.clients[idx] = updated;
    this.persist();
    return updated;
  }

  public updateDeliveryStatus(
    clientCode: string,
    orderId: string,
    deliveryStatus: DeliveryStatus,
    details?: {
      driverName?: string;
      driverPhone?: string;
      estimatedMinutes?: number;
      deliveryNotes?: string;
    }
  ): { client: Client; order: PurchaseItem } | null {
    const client = this.getClientByCode(clientCode);
    if (!client) return null;

    let targetOrder = client.hist.find(o => o.id === orderId);
    if (!targetOrder && client.hist.length > 0) {
      targetOrder = client.hist[client.hist.length - 1];
    }
    if (!targetOrder) return null;

    targetOrder.deliveryStatus = deliveryStatus;
    targetOrder.deliveryStatusUpdatedAt = new Date().toISOString();
    if (details) {
      if (details.driverName !== undefined) targetOrder.driverName = details.driverName;
      if (details.driverPhone !== undefined) targetOrder.driverPhone = details.driverPhone;
      if (details.estimatedMinutes !== undefined) targetOrder.estimatedMinutes = details.estimatedMinutes;
      if (details.deliveryNotes !== undefined) targetOrder.deliveryNotes = details.deliveryNotes;
    }

    this.persist();
    return { client, order: targetOrder };
  }

  public deleteClient(code: string): boolean {
    const prevLen = this.data.clients.length;
    this.data.clients = this.data.clients.filter(c => c.code.toUpperCase() !== code.toUpperCase());
    if (this.data.clients.length !== prevLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public addOrder(clientCode: string, orderData: { size?: '250' | '500' | '1000'; date?: string; deliveryDate?: string; type?: 'assinatura' | 'avulsa'; notes?: string }): PurchaseItem | null {
    const client = this.getClientByCode(clientCode);
    if (!client) return null;

    const size = orderData.size || client.size;
    const type = orderData.type || 'avulsa';
    const val = type === 'avulsa'
      ? this.data.settings.avulsoPrices[size]
      : this.data.settings.prices[size];

    const date = orderData.date || new Date().toISOString().slice(0, 10);
    const deliveryDate = orderData.deliveryDate || nextDeliveryDate(date);

    const newOrder: PurchaseItem = {
      id: 'ord-' + Date.now(),
      date,
      deliveryDate,
      size,
      type,
      val,
      deliveryStatus: 'recebido',
      deliveryStatusUpdatedAt: new Date().toISOString(),
      deliveryNotes: orderData.notes || (type === 'avulsa' ? 'Compra avulsa registrada.' : 'Pedido de assinatura programado.'),
    };

    client.hist.push(newOrder);
    client.hist.sort((a, b) => (a.date < b.date ? -1 : 1));

    // Financial ledger sync (skip AMG001 owner account to keep company ledger clean)
    if (client.code !== 'AMG001') {
      this.saveFinancialTransaction({
        id: `tx-order-${newOrder.id}`,
        type: 'receita',
        category: type === 'assinatura' ? 'assinatura' : 'venda_avulsa',
        description: `Pedido ${size}g (${type === 'assinatura' ? 'Assinatura' : 'Compra Avulsa'}) - ${client.name}`,
        amount: val,
        date,
        paymentMethod: 'pix',
        status: 'confirmado',
        clientCode: client.code,
        clientName: client.name,
        notes: newOrder.deliveryNotes,
      });
    }

    this.persist();
    return newOrder;
  }

  public updateClientDeliveryDate(clientCode: string, newDeliveryDate: string, notes?: string): { client: Client; updatedOrder?: PurchaseItem } | null {
    const client = this.getClientByCode(clientCode);
    if (!client) return null;

    client.pdate = newDeliveryDate;
    let targetOrder = client.hist.slice().reverse().find(o => o.deliveryStatus !== 'entregue') || client.hist[client.hist.length - 1];

    if (targetOrder) {
      targetOrder.deliveryDate = newDeliveryDate;
      if (notes) {
        targetOrder.deliveryNotes = notes;
      }
      targetOrder.deliveryStatusUpdatedAt = new Date().toISOString();
    } else {
      const size = client.size || '500';
      const val = client.type === 'assinatura' ? (this.data.settings.prices[size] || 20) : (this.data.settings.avulsoPrices[size] || 25);
      const newOrder: PurchaseItem = {
        id: 'ord-' + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        deliveryDate: newDeliveryDate,
        size,
        type: client.type || 'assinatura',
        val,
        deliveryStatus: 'recebido',
        deliveryStatusUpdatedAt: new Date().toISOString(),
        deliveryNotes: notes || 'Data de recebimento agendada pelo cliente.',
      };
      client.hist.push(newOrder);
      targetOrder = newOrder;
    }

    this.persist();
    return { client, updatedOrder: targetOrder };
  }

  public createSubscription(clientCode: string, data: { size: '250' | '500' | '1000'; freq: number; startDate?: string; notes?: string }): { client: Client; order: PurchaseItem } | null {
    const client = this.getClientByCode(clientCode);
    if (!client) return null;

    client.type = 'assinatura';
    client.size = data.size;
    client.freq = data.freq;
    client.status = 'Aguardando Validação';
    const today = new Date().toISOString().slice(0, 10);
    const deliveryDate = data.startDate || nextDeliveryDate(today);
    client.pdate = deliveryDate;

    const unitPrice = this.data.settings.prices[data.size] || 20;
    const newOrder: PurchaseItem = {
      id: 'ord-' + Date.now(),
      date: today,
      deliveryDate,
      size: data.size,
      type: 'assinatura',
      val: unitPrice,
      deliveryStatus: 'recebido',
      deliveryStatusUpdatedAt: new Date().toISOString(),
      deliveryNotes: data.notes || `Nova assinatura: pote de ${data.size}g freq ${data.freq}x/mês.`,
    };

    client.hist.push(newOrder);

    // Financial ledger sync (calculates monthly total for plan, skip AMG001 owner account)
    if (client.code !== 'AMG001') {
      const potCount = data.freq === 4 ? 4 : data.freq === 2 ? 2 : 1;
      const totalMonthly = unitPrice * potCount;
      this.saveFinancialTransaction({
        id: `tx-order-${newOrder.id}`,
        type: 'receita',
        category: 'assinatura',
        description: `Nova Assinatura ${data.size}g (${data.freq === 4 ? 'Semanal' : data.freq === 2 ? 'Quinzenal' : 'Mensal'}) - ${client.name}`,
        amount: totalMonthly,
        date: today,
        paymentMethod: 'pix',
        status: 'pendente',
        clientCode: client.code,
        clientName: client.name,
        notes: `Valor total mensal com ${potCount} potes de ${data.size}g. Início previsto: ${deliveryDate}. Aguardando validação do PIX.`,
      });
    }

    this.persist();
    return { client, order: newOrder };
  }

  public removeOrder(clientCode: string, orderIdOrIndex: string | number): boolean {
    const client = this.getClientByCode(clientCode);
    if (!client) return false;

    let removedOrder: PurchaseItem | undefined;
    if (typeof orderIdOrIndex === 'number') {
      if (orderIdOrIndex >= 0 && orderIdOrIndex < client.hist.length) {
        removedOrder = client.hist.splice(orderIdOrIndex, 1)[0];
      }
    } else {
      const idx = client.hist.findIndex(o => o.id === orderIdOrIndex);
      if (idx !== -1) {
        removedOrder = client.hist.splice(idx, 1)[0];
      }
    }

    if (removedOrder) {
      // Reconcile financial ledger: remove matching transaction
      if (this.data.financialTransactions && removedOrder.id) {
        const targetId = removedOrder.id;
        const txId = `tx-order-${targetId}`;
        this.data.financialTransactions = this.data.financialTransactions.filter(
          t => t.id !== txId && !(t.clientCode === client.code && (t.notes?.includes(targetId) || t.description?.includes(targetId)))
        );
      }
      this.persist();
      return true;
    }
    return false;
  }

  public markRewardSent(clientCode: string): { sent: number; pending: number } | null {
    const client = this.getClientByCode(clientCode);
    if (!client) return null;

    const referrals = this.data.clients.filter(c => c.ref === client.code).length;
    const won = Math.floor(referrals / this.data.settings.goal);
    client.sent = Math.min(won, (client.sent || 0) + 1);
    this.persist();

    return {
      sent: client.sent,
      pending: Math.max(0, won - client.sent),
    };
  }

  public getStats(): DashboardStats {
    const today = new Date().toISOString().slice(0, 10);
    // AMG001 is the system owner, not a customer. Exclude AMG001 from client totals and MRR.
    const clients = this.data.clients.filter(c => c.code !== 'AMG001');
    const goal = this.data.settings.goal;

    const subscribers = clients.filter(c => c.type === 'assinatura' && c.status === 'Ativo');
    const oneOffs = clients.filter(c => c.type === 'avulsa');
    const awaitingValidationCount = clients.filter(c => c.status === 'Aguardando Validação').length;
    const pendingPaymentsCount = clients.filter(c => c.status === 'Aguardando Pagamento' || c.status === 'Aguardando Validação').length;

    // Monthly recurring revenue (MRR)
    const mrr = subscribers.reduce((acc, c) => {
      const unit = this.data.settings.prices[c.size] || 0;
      return acc + unit * (c.freq || 1);
    }, 0);

    // Total one-off revenue
    const oneOffRevenue = oneOffs.reduce((acc, c) => {
      return acc + c.hist.reduce((hAcc, h) => (h.type === 'avulsa' ? hAcc + h.val : hAcc), 0);
    }, 0);

    const totalPurchases = clients.reduce((acc, c) => acc + c.hist.length, 0);

    // Deliveries of today (orders where deliveryDate === today or currently in progress)
    const todayDeliveries: DashboardStats['todayDeliveries'] = [];
    clients.forEach(c => {
      c.hist.forEach(h => {
        const dDate = h.deliveryDate || nextDeliveryDate(h.date);
        const isActiveDelivery = h.deliveryStatus === 'preparando' || h.deliveryStatus === 'saiu_entrega';
        if (dDate === today || isActiveDelivery) {
          todayDeliveries.push({
            orderId: h.id || `ord-${c.code}-${h.date}`,
            clientCode: c.code,
            clientName: c.name,
            wpp: c.wpp,
            address: `${c.street}, ${c.num} ${c.comp || ''} - ${c.bairro}, ${c.city}/${c.uf}`,
            size: `${c.size}g`,
            type: h.type === 'avulsa' ? 'Avulsa' : 'Assinatura',
            orderDate: h.date,
            deliveryDate: dDate,
            price: h.val,
            deliveryStatus: h.deliveryStatus || 'recebido',
            driverName: h.driverName,
            driverPhone: h.driverPhone,
            estimatedMinutes: h.estimatedMinutes,
            deliveryNotes: h.deliveryNotes,
          });
        }
      });
    });

    // Upcoming subscription deliveries in next 7 days
    const upcomingDeliveries: DashboardStats['upcomingDeliveries'] = [];
    const in7Days = addDays(today, 7);

    subscribers.forEach(c => {
      const lastOrder = c.hist[c.hist.length - 1];
      if (!lastOrder) return;

      const intervalDays = c.freq === 4 ? 7 : c.freq === 2 ? 15 : 30;
      const nextDate = addDays(lastOrder.date, intervalDays);
      const delivery = nextDeliveryDate(nextDate);

      if (delivery >= today && delivery <= in7Days) {
        const freqLabel = c.freq === 4 ? 'Semanal' : c.freq === 2 ? 'Quinzenal' : 'Mensal';
        upcomingDeliveries.push({
          clientCode: c.code,
          clientName: c.name,
          wpp: c.wpp,
          address: `${c.street}, ${c.num} ${c.comp || ''} - ${c.bairro}`,
          size: `${c.size}g`,
          freq: freqLabel,
          deliveryDate: delivery,
          price: this.data.settings.prices[c.size] || 0,
        });
      }
    });

    upcomingDeliveries.sort((a, b) => (a.deliveryDate < b.deliveryDate ? -1 : 1));

    // Top referrers
    const refCounts: Record<string, number> = {};
    clients.forEach(c => {
      if (c.ref) {
        refCounts[c.ref] = (refCounts[c.ref] || 0) + 1;
      }
    });

    const topReferrers = Object.entries(refCounts)
      .map(([code, count]) => {
        const client = this.getClientByCode(code);
        return {
          code,
          name: client ? client.name : code,
          count,
          rewardsEarned: Math.floor(count / goal),
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Pending rewards list
    const pendingRewardsList: DashboardStats['pendingRewardsList'] = [];
    let pendingRewardPots = 0;

    clients.forEach(c => {
      const count = refCounts[c.code] || 0;
      const won = Math.floor(count / goal);
      const pending = Math.max(0, won - (c.sent || 0));
      if (pending > 0) {
        pendingRewardPots += pending;
        pendingRewardsList.push({
          code: c.code,
          name: c.name,
          wpp: c.wpp,
          address: `${c.street}, ${c.num} ${c.comp || ''} - ${c.bairro}`,
          pendingCount: pending,
        });
      }
    });

    // Birthday count in current month
    const currentMonth = parseInt(today.slice(5, 7), 10);
    const birthdayCountThisMonth = clients.filter(c => {
      if (!c.birth) return false;
      const bMonth = parseInt(c.birth.slice(5, 7), 10);
      return bMonth === currentMonth;
    }).length;

    // Monthly sales in the last 6 months with subscriptions vs one-off breakdown & volume
    const monthlySales: DashboardStats['monthlySales'] = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toISOString().slice(0, 7);
      const monthIdx = d.getMonth();
      const label = `${monthNames[monthIdx]}/${d.getFullYear().toString().slice(2)}`;

      let monthTotal = 0;
      let monthSubs = 0;
      let monthOneOff = 0;
      let orderCount = 0;
      let volumeKg = 0;

      clients.forEach(c => {
        c.hist
          .filter(h => h.date.startsWith(monthKey))
          .forEach(h => {
            monthTotal += h.val;
            if (h.type === 'assinatura') {
              monthSubs += h.val;
            } else {
              monthOneOff += h.val;
            }
            orderCount += 1;
            const kg = Number(h.size) / 1000;
            volumeKg += kg;
          });
      });

      monthlySales.push({
        month: monthKey,
        label,
        total: monthTotal,
        subscriptions: monthSubs,
        oneOff: monthOneOff,
        orderCount,
        volumeKg: Number(volumeKg.toFixed(1)),
      });
    }

    // Pot distribution (total purchases by pot size)
    const potDistribution: DashboardStats['potDistribution'] = [
      { name: 'Pote 250g', size: '250', count: 0, revenue: 0 },
      { name: 'Pote 500g', size: '500', count: 0, revenue: 0 },
      { name: 'Pote 1kg', size: '1000', count: 0, revenue: 0 },
    ];

    clients.forEach(c => {
      c.hist.forEach(h => {
        const item = potDistribution.find(p => p.size === h.size);
        if (item) {
          item.count += 1;
          item.revenue += h.val;
        }
      });
    });

    // Plan distribution (active clients)
    const planDistribution: DashboardStats['planDistribution'] = [
      { name: 'Semanal (4x/mês)', count: clients.filter(c => c.type === 'assinatura' && c.freq === 4).length },
      { name: 'Quinzenal (2x/mês)', count: clients.filter(c => c.type === 'assinatura' && c.freq === 2).length },
      { name: 'Mensal (1x/mês)', count: clients.filter(c => c.type === 'assinatura' && c.freq === 1).length },
      { name: 'Compra Avulsa', count: clients.filter(c => c.type === 'avulsa').length },
    ];

    return {
      totalClients: clients.length,
      totalPurchases,
      subscribersCount: subscribers.length,
      oneOffCount: oneOffs.length,
      pendingPaymentsCount,
      awaitingValidationCount,
      monthlyRecurringRevenue: mrr,
      totalOneOffRevenue: oneOffRevenue,
      pendingRewardPots,
      birthdayCountThisMonth,
      monthlySales,
      potDistribution,
      planDistribution,
      todayDeliveries,
      upcomingDeliveries,
      topReferrers,
      pendingRewardsList,
    };
  }

  public exportCSV(): string {
    const headers = [
      'Código',
      'Nome Completo',
      'Data Nascimento',
      'E-mail',
      'WhatsApp',
      'CEP',
      'Rua',
      'Número',
      'Complemento',
      'Bairro',
      'Cidade',
      'UF',
      'Tipo Compra',
      'Tamanho Pote',
      'Frequência',
      'Status',
      'Data Cadastro',
      'Indicado Por',
      'Total Compras',
      'Potes Grátis Enviados',
    ];

    const rows = this.data.clients.map(c => {
      const freqLabel =
        c.type === 'avulsa'
          ? 'Avulsa'
          : c.freq === 4
          ? 'Semanal'
          : c.freq === 2
          ? 'Quinzenal'
          : 'Mensal';

      return [
        c.code,
        c.name,
        c.birth,
        c.email,
        c.wpp,
        c.cep,
        c.street,
        c.num,
        c.comp || '',
        c.bairro,
        c.city,
        c.uf,
        c.type,
        `${c.size}g`,
        freqLabel,
        c.status,
        c.pdate,
        c.ref || '',
        c.hist.length,
        c.sent || 0,
      ]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(';');
    });

    return [headers.join(';'), ...rows].join('\r\n');
  }
}

export const db = new Database();
