import type {
  Client,
  AppSettings,
  DashboardStats,
  PurchaseItem,
  DeliveryStatus,
  RealtimeEvent,
  Product,
  FinancialTransaction,
  FinancialSummary,
  Testimonial,
} from './types.js';

export const api = {
  // Config
  async getConfig(): Promise<AppSettings & { hasOwnerPassword?: boolean }> {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Falha ao carregar configurações');
    const data = await res.json();
    try {
      localStorage.setItem('amigusto_cached_config', JSON.stringify(data));
    } catch {
      // ignore
    }
    return data;
  },

  async updateConfig(payload: {
    prices?: AppSettings['prices'];
    avulsoPrices?: AppSettings['avulsoPrices'];
    goal?: number;
    whatsapp?: string;
    pixKey?: string;
    newOwnerPassword?: string;
    partners?: import('./types.js').PartnerBanner[];
  }): Promise<AppSettings & { message: string }> {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar configurações');
    try {
      localStorage.setItem('amigusto_cached_config', JSON.stringify(data));
    } catch {
      // ignore
    }
    return data;
  },

  // Partners
  async getPartners(): Promise<import('./types.js').PartnerBanner[]> {
    const res = await fetch('/api/partners');
    if (!res.ok) throw new Error('Falha ao carregar parceiros');
    return res.json();
  },

  async savePartner(partnerData: Partial<import('./types.js').PartnerBanner>): Promise<{
    success: boolean;
    partner: import('./types.js').PartnerBanner;
    message: string;
  }> {
    const res = await fetch('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partnerData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar parceiro');
    return data;
  },

  async deletePartner(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/partners/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir parceiro');
    return data;
  },

  async sendPartnershipInquiry(inquiry: {
    clientCode?: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    companyName?: string;
    businessType?: string;
    companyContact?: string;
    message: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/partners/partnership-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiry),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao enviar proposta de divulgação');
    return data;
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Falha ao carregar produtos');
    return res.json();
  },

  async saveProduct(productData: Partial<Product>): Promise<{
    success: boolean;
    product: Product;
    message: string;
  }> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar produto');
    return data;
  },

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir produto');
    return data;
  },

  // Testimonials (Depoimentos Reais de Clientes)
  async getTestimonials(): Promise<Testimonial[]> {
    const res = await fetch('/api/testimonials');
    if (!res.ok) throw new Error('Falha ao carregar depoimentos');
    return res.json();
  },

  async saveTestimonial(testimonialData: Partial<Testimonial>): Promise<{
    success: boolean;
    testimonial: Testimonial;
    message: string;
  }> {
    const res = await fetch('/api/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testimonialData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar depoimento');
    return data;
  },

  async updateTestimonial(id: string, testimonialData: Partial<Testimonial>): Promise<{
    success: boolean;
    testimonial: Testimonial;
    message: string;
  }> {
    const res = await fetch(`/api/testimonials/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testimonialData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar depoimento');
    return data;
  },

  async deleteTestimonial(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/testimonials/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir depoimento');
    return data;
  },

  async likeTestimonial(id: string): Promise<{ success: boolean; helpfulCount: number }> {
    const res = await fetch(`/api/testimonials/${encodeURIComponent(id)}/like`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao curtir depoimento');
    return data;
  },


  // Financial Management
  async getFinancialSummary(month?: string): Promise<FinancialSummary> {
    const url = month ? `/api/finance/summary?month=${encodeURIComponent(month)}` : '/api/finance/summary';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Falha ao carregar resumo financeiro');
    return res.json();
  },

  async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    const res = await fetch('/api/finance/transactions');
    if (!res.ok) throw new Error('Falha ao buscar transações financeiras');
    return res.json();
  },

  async saveFinancialTransaction(txData: Partial<FinancialTransaction>): Promise<{
    success: boolean;
    transaction: FinancialTransaction;
    message: string;
  }> {
    const res = await fetch('/api/finance/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar transação financeira');
    return data;
  },

  async deleteFinancialTransaction(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/finance/transactions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir transação financeira');
    return data;
  },

  async resetFinancialTransactions(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/finance/reset', {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao zerar área financeira');
    return data;
  },

  // Auth
  async ownerLogin(password: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch('/api/auth/owner-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Senha incorreta');
    return data;
  },

  async clientLogin(identifier: string, password: string): Promise<{ success: boolean; client: Client }> {
    const res = await fetch('/api/auth/client-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Credenciais inválidas');
    return data;
  },

  // Clients
  async getClients(query?: string, type?: string, status?: string): Promise<Client[]> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (type) params.set('type', type);
    if (status) params.set('status', status);

    const res = await fetch(`/api/clients?${params.toString()}`);
    if (!res.ok) throw new Error('Falha ao listar clientes');
    const data = await res.json();
    try {
      localStorage.setItem('amigusto_cached_clients', JSON.stringify(data));
    } catch {
      // ignore
    }
    return data;
  },

  async getClient(code: string): Promise<Client> {
    const res = await fetch(`/api/clients/${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error('Cliente não encontrado');
    return res.json();
  },

  async createClient(clientData: Partial<Client> & { password?: string }): Promise<{
    client: Client;
    plainPassword: string;
    message: string;
  }> {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar cliente');
    return data;
  },

  async updateClient(code: string, updates: Partial<Client> & { newPassword?: string }): Promise<{
    client: Client;
    message: string;
  }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(code)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar dados');
    return data;
  },

  async deleteClient(code: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(code)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao excluir cliente');
    return data;
  },

  async confirmPaymentSent(code: string): Promise<{ client: Client; message: string }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(code)}/payment-sent`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao registrar envio de pagamento');
    return data;
  },

  async activateClient(code: string): Promise<{ client: Client; message: string }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(code)}/activate`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao ativar cliente');
    return data;
  },

  async resendCredentialsEmail(code: string): Promise<{ success: boolean; message: string; email: string }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(code)}/resend-credentials-email`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao reenviar e-mail');
    return data;
  },

  // Orders & iFood-style Delivery Tracking
  async updateDeliveryStatus(
    code: string,
    orderId: string,
    payload: {
      deliveryStatus: DeliveryStatus;
      driverName?: string;
      driverPhone?: string;
      estimatedMinutes?: number;
      deliveryNotes?: string;
    }
  ): Promise<{ client: Client; order: PurchaseItem; message: string }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(code)}/orders/${encodeURIComponent(orderId)}/delivery-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao atualizar status de entrega');
    return data;
  },

  // Orders & Subscriptions
  async addOrder(clientCode: string, orderData: { size: '250' | '500' | '1000'; type?: 'assinatura' | 'avulsa'; date?: string; deliveryDate?: string; notes?: string }): Promise<{
    order: PurchaseItem;
    message: string;
  }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(clientCode)}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao registrar compra');
    return data;
  },

  async updateDeliveryDate(clientCode: string, deliveryDate: string, notes?: string): Promise<{
    client: Client;
    order?: PurchaseItem;
    message: string;
  }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(clientCode)}/delivery-date`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryDate, notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao alterar data de entrega');
    return data;
  },

  async createSubscription(clientCode: string, payload: {
    size: '250' | '500' | '1000';
    freq: number;
    startDate?: string;
    notes?: string;
  }): Promise<{
    client: Client;
    order: PurchaseItem;
    message: string;
  }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(clientCode)}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao criar assinatura');
    return data;
  },

  async changePassword(clientCode: string, newPassword: string): Promise<{
    client: Client;
    message: string;
  }> {
    return this.updateClient(clientCode, { newPassword });
  },

  async removeOrder(clientCode: string, orderId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(clientCode)}/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao remover compra');
    return data;
  },

  // Rewards
  async markRewardSent(clientCode: string): Promise<{ sent: number; pending: number }> {
    const res = await fetch(`/api/clients/${encodeURIComponent(clientCode)}/reward-sent`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao marcar brinde como enviado');
    return data;
  },

  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Falha ao calcular estatísticas');
    return res.json();
  },

  // CEP Lookup
  async lookupCEP(cep: string): Promise<{
    cep: string;
    street: string;
    bairro: string;
    city: string;
    uf: string;
  }> {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) throw new Error('CEP deve conter 8 números');

    try {
      const res = await fetch(`/api/cep/${cleanCep}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback direct to ViaCEP if proxy fails
    }

    const fallback = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!fallback.ok) throw new Error('Não foi possível consultar o CEP');
    const data = await fallback.json();
    if (data.erro) throw new Error('CEP não encontrado');

    return {
      cep: data.cep,
      street: data.logradouro || '',
      bairro: data.bairro || '',
      city: data.localidade || '',
      uf: data.uf || '',
    };
  },
};

/**
 * Connects to the real-time WebSocket server for iFood-style live delivery updates
 * Automatically handles reconnection and ping/pong keep-alive.
 */
export function createRealtimeSocket(onEvent: (event: RealtimeEvent) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let ws: WebSocket | null = null;
  let isClosed = false;
  let reconnectTimer: any = null;
  let pingInterval: any = null;

  function connect() {
    if (isClosed) return;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        pingInterval = setInterval(() => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 25000);
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && data.type && data.type !== 'CONNECTED' && data.type !== 'PONG') {
            onEvent(data as RealtimeEvent);
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        if (pingInterval) clearInterval(pingInterval);
        if (!isClosed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    } catch (err) {
      console.warn('Realtime socket connect error:', err);
      if (!isClosed) {
        reconnectTimer = setTimeout(connect, 3000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    if (pingInterval) clearInterval(pingInterval);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) ws.close();
  };
}
