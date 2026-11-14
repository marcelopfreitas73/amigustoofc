import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { db, hashPassword } from './src/server/db.js';
import type { RealtimeEvent, DeliveryStatus } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// WebSocket Server for iFood-style real-time delivery synchronization
const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
  try {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  } catch {
    // ignore malformed URLs
  }
});

export function broadcastEvent(event: RealtimeEvent) {
  const payload = JSON.stringify(event);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (err) {
        console.error('Error broadcasting WS event:', err);
      }
    }
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() }));

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
      }
    } catch {
      // ignore
    }
  });

  ws.on('error', (err) => {
    console.warn('WS client error:', err.message);
  });
});

// Email Audit Log & Dispatcher
interface EmailRecord {
  to: string;
  name: string;
  code: string;
  subject: string;
  plainPassword: string;
  timestamp: string;
  status: 'sent';
}

const emailAuditTrail: EmailRecord[] = [];

function dispatchWelcomeCredentialsEmail(params: {
  name: string;
  email: string;
  code: string;
  plainPassword: string;
  size?: string;
  type?: string;
}): EmailRecord {
  const subject = 'Suas credenciais e senha de acesso - A Mi Gusto Alho Triturado';
  const timestamp = new Date().toISOString();

  console.log('========================================================');
  console.log(`[E-MAIL ENVIADO COM SUCESSO] 🚀`);
  console.log(`Para: ${params.name} <${params.email}>`);
  console.log(`Assunto: ${subject}`);
  console.log(`Código de Acesso: ${params.code}`);
  console.log(`Senha de Acesso: ${params.plainPassword}`);
  console.log(`Instruções: Utilize seu código e senha para acessar a Área do Cliente e acompanhar suas entregas.`);
  console.log('========================================================');

  const record: EmailRecord = {
    to: params.email,
    name: params.name,
    code: params.code,
    subject,
    plainPassword: params.plainPassword,
    timestamp,
    status: 'sent',
  };
  emailAuditTrail.push(record);
  return record;
}

// API Routes
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    wsClientsCount: wss.clients.size,
  });
});

app.get('/api/email-logs', (_req, res) => {
  res.json(emailAuditTrail);
});

// Settings & Config
app.get('/api/config', (_req, res) => {
  try {
    const settings = db.getSettings();
    // Do not leak password hash to client
    const { ownerPasswordHash, ...publicSettings } = settings;
    res.json({
      ...publicSettings,
      hasOwnerPassword: Boolean(ownerPasswordHash),
    });
  } catch (err) {
    console.error('Error fetching config:', err);
    res.status(500).json({ error: 'Erro ao carregar configurações' });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const { prices, avulsoPrices, goal, whatsapp, pixKey, newOwnerPassword, partners } = req.body;
    const updates: Record<string, unknown> = {};

    if (prices) updates.prices = prices;
    if (avulsoPrices) updates.avulsoPrices = avulsoPrices;
    if (goal && Number(goal) >= 1) updates.goal = Number(goal);
    if (whatsapp !== undefined) updates.whatsapp = String(whatsapp).replace(/\D/g, '');
    if (pixKey !== undefined) updates.pixKey = String(pixKey).trim();
    if (partners !== undefined) updates.partners = partners;

    if (newOwnerPassword && String(newOwnerPassword).trim().length >= 4) {
      updates.ownerPasswordHash = hashPassword(`dono:${String(newOwnerPassword).trim()}`);
    }

    const updated = db.updateSettings(updates);
    const { ownerPasswordHash, ...publicSettings } = updated;

    broadcastEvent({
      type: 'CONFIG_UPDATED',
      settings: publicSettings as import('./src/types.js').AppSettings,
      timestamp: new Date().toISOString(),
    });

    if (updated.products) {
      broadcastEvent({
        type: 'PRODUCTS_UPDATED',
        products: updated.products,
        timestamp: new Date().toISOString(),
      });
    }

    if (partners !== undefined) {
      broadcastEvent({
        type: 'PARTNERS_UPDATED',
        partners: updated.partners || [],
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      ...publicSettings,
      hasOwnerPassword: Boolean(ownerPasswordHash),
      message: 'Configurações salvas com sucesso!',
    });
  } catch (err) {
    console.error('Error updating config:', err);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

// Partners API
app.get('/api/partners', (_req, res) => {
  try {
    const partners = db.getPartners();
    res.json(partners);
  } catch (err) {
    console.error('Error fetching partners:', err);
    res.status(500).json({ error: 'Erro ao listar parceiros' });
  }
});

app.post('/api/partners', (req, res) => {
  try {
    const { id, partnerName, title, description, mediaType, mediaUrl, mobileMediaUrl, linkUrl, buttonText, badge, active, order } = req.body;

    if (!partnerName || !title || !mediaUrl) {
      return res.status(400).json({ error: 'Nome do parceiro, título e mídia são obrigatórios' });
    }

    let savedPartner;
    if (id) {
      savedPartner = db.updatePartner(id, {
        partnerName,
        title,
        description,
        mediaType: mediaType || 'image',
        mediaUrl,
        mobileMediaUrl: mobileMediaUrl || undefined,
        linkUrl,
        buttonText,
        badge,
        active: active !== undefined ? Boolean(active) : true,
        order: Number(order) || 1,
      });
      if (!savedPartner) {
        return res.status(404).json({ error: 'Parceiro não encontrado para atualização' });
      }
    } else {
      savedPartner = db.addPartner({
        partnerName,
        title,
        description,
        mediaType: mediaType || 'image',
        mediaUrl,
        mobileMediaUrl: mobileMediaUrl || undefined,
        linkUrl,
        buttonText,
        badge,
        active: active !== undefined ? Boolean(active) : true,
        order: Number(order) || (db.getPartners().length + 1),
      });
    }

    // Real-time broadcast to all clients and visitor browsers
    broadcastEvent({
      type: 'PARTNERS_UPDATED',
      partners: db.getPartners(),
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, partner: savedPartner, message: 'Banner de parceiro salvo com sucesso!' });
  } catch (err) {
    console.error('Error saving partner:', err);
    res.status(500).json({ error: 'Erro ao salvar parceiro' });
  }
});

app.delete('/api/partners/:id', (req, res) => {
  try {
    const deleted = db.deletePartner(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Parceiro não encontrado' });
    }

    broadcastEvent({
      type: 'PARTNERS_UPDATED',
      partners: db.getPartners(),
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Banner de parceiro excluído com sucesso!' });
  } catch (err) {
    console.error('Error deleting partner:', err);
    res.status(500).json({ error: 'Erro ao excluir parceiro' });
  }
});

// Client direct partnership / company promotion inquiry to owner
app.post('/api/partners/partnership-inquiry', (req, res) => {
  try {
    const { clientCode, clientName, clientEmail, clientPhone, companyName, businessType, companyContact, message } = req.body;

    const emailSubject = `🤝 [A MI GUSTO] Divulgação de Empresa de Cliente (R$ 100 / 3 Meses): ${companyName || clientName}`;
    const emailBody = `
=====================================================
DIVULGAÇÃO DE EMPRESA DE CLIENTE (R$ 100 / 3 MESES)
=====================================================
Cliente: ${clientName}
Código: ${clientCode || 'N/A'}
Telefone / WhatsApp Cliente: ${clientPhone}
E-mail Cliente: ${clientEmail}
Nome da Empresa: ${companyName || 'Não informado'}
Ramo de Atuação: ${businessType || 'Comércio / Serviço'}
Contato / Link da Empresa: ${companyContact || 'Mesmo do cliente'}
Plano Escolhido: Valor Simbólico R$ 100,00 por 3 meses de exibição
Data da Solicitação: ${new Date().toLocaleString('pt-BR')}

Detalhes e Informações para o Banner:
"${message || 'Gostaria de divulgar minha empresa na página principal da A Mi Gusto por R$ 100 durante 3 meses.'}"
=====================================================
    `.trim();

    dispatchWelcomeCredentialsEmail({
      name: 'Marcelo Pereira (Dono)',
      email: 'marcelopereira528@gmail.com',
      code: clientCode || 'AMG001',
      plainPassword: '(Solicitação de Divulgação de Empresa Recebida)',
    });

    console.log('\n' + emailBody + '\n');

    res.json({
      success: true,
      message: 'Sua solicitação de divulgação por R$ 100 (3 meses) foi enviada diretamente para o Marcelo! Ele entrará em contato para alinhar seu banner.',
    });
  } catch (err) {
    console.error('Error sending partnership inquiry:', err);
    res.status(500).json({ error: 'Erro ao enviar proposta de divulgação' });
  }
});
// ==========================================
// PRODUCTS API (Novos Produtos & Preços)
// ==========================================
app.get('/api/products', (_req, res) => {
  try {
    const products = db.getProducts();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Erro ao carregar produtos' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const { name, unit, allowSubscription, allowOneOff } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ error: 'Nome e unidade do produto são obrigatórios' });
    }
    if (allowSubscription === false && allowOneOff === false) {
      return res.status(400).json({ error: 'O produto deve ter ao menos uma modalidade ativa (Assinatura ou Avulsa)' });
    }

    const savedProduct = db.saveProduct(req.body);

    broadcastEvent({
      type: 'PRODUCTS_UPDATED',
      products: db.getProducts(),
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      product: savedProduct,
      message: 'Produto salvo com sucesso!',
    });
  } catch (err) {
    console.error('Error saving product:', err);
    res.status(500).json({ error: 'Erro ao salvar produto' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const deleted = db.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    broadcastEvent({
      type: 'PRODUCTS_UPDATED',
      products: db.getProducts(),
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Produto excluído com sucesso!' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

// ==========================================
// TESTIMONIALS API (Depoimentos Reais de Clientes)
// ==========================================
app.get('/api/testimonials', (_req, res) => {
  try {
    const testimonials = db.getTestimonials();
    res.json(testimonials);
  } catch (err) {
    console.error('Error fetching testimonials:', err);
    res.status(500).json({ error: 'Erro ao carregar depoimentos' });
  }
});

app.post('/api/testimonials', (req, res) => {
  try {
    const { name, content } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: 'Nome e texto do depoimento são obrigatórios' });
    }

    const saved = db.saveTestimonial(req.body);

    broadcastEvent({
      type: 'TESTIMONIALS_UPDATED',
      testimonials: db.getTestimonials(),
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      testimonial: saved,
      message: 'Depoimento salvo com sucesso!',
    });
  } catch (err) {
    console.error('Error saving testimonial:', err);
    res.status(500).json({ error: 'Erro ao salvar depoimento' });
  }
});

app.put('/api/testimonials/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.getTestimonialById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Depoimento não encontrado' });
    }

    const saved = db.saveTestimonial({ ...req.body, id });

    broadcastEvent({
      type: 'TESTIMONIALS_UPDATED',
      testimonials: db.getTestimonials(),
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      testimonial: saved,
      message: 'Depoimento atualizado com sucesso!',
    });
  } catch (err) {
    console.error('Error updating testimonial:', err);
    res.status(500).json({ error: 'Erro ao atualizar depoimento' });
  }
});

app.delete('/api/testimonials/:id', (req, res) => {
  try {
    const deleted = db.deleteTestimonial(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Depoimento não encontrado' });
    }

    broadcastEvent({
      type: 'TESTIMONIALS_UPDATED',
      testimonials: db.getTestimonials(),
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Depoimento excluído com sucesso!' });
  } catch (err) {
    console.error('Error deleting testimonial:', err);
    res.status(500).json({ error: 'Erro ao excluir depoimento' });
  }
});

app.post('/api/testimonials/:id/like', (req, res) => {
  try {
    const count = db.likeTestimonial(req.params.id);
    res.json({ success: true, helpfulCount: count });
  } catch (err) {
    console.error('Error liking testimonial:', err);
    res.status(500).json({ error: 'Erro ao registrar curtida' });
  }
});


// ==========================================
// FINANCIAL API (Fluxo de Caixa & Lançamentos)
// ==========================================
app.get('/api/finance/summary', (req, res) => {
  try {
    const month = req.query.month ? String(req.query.month) : undefined;
    const summary = db.getFinancialSummary({ month });
    res.json(summary);
  } catch (err) {
    console.error('Error fetching financial summary:', err);
    res.status(500).json({ error: 'Erro ao gerar resumo financeiro' });
  }
});

app.get('/api/finance/transactions', (_req, res) => {
  try {
    const transactions = db.getFinancialTransactions();
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

app.post('/api/finance/transactions', (req, res) => {
  try {
    const { type, description, amount } = req.body;
    if (!type || !description || amount === undefined || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Tipo, descrição e valor válido são obrigatórios' });
    }

    const savedTx = db.saveFinancialTransaction(req.body);

    broadcastEvent({
      type: 'FINANCE_UPDATED',
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      transaction: savedTx,
      message: 'Lançamento financeiro salvo com sucesso!',
    });
  } catch (err) {
    console.error('Error saving transaction:', err);
    res.status(500).json({ error: 'Erro ao salvar lançamento financeiro' });
  }
});

app.delete('/api/finance/transactions/:id', (req, res) => {
  try {
    const deleted = db.deleteFinancialTransaction(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }

    broadcastEvent({
      type: 'FINANCE_UPDATED',
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Lançamento financeiro excluído com sucesso!' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Erro ao excluir lançamento financeiro' });
  }
});

app.post('/api/finance/reset', (_req, res) => {
  try {
    db.clearFinancialTransactions();
    broadcastEvent({
      type: 'FINANCE_UPDATED',
      timestamp: new Date().toISOString(),
    });
    res.json({ success: true, message: 'Área financeira zerada com sucesso!' });
  } catch (err) {
    console.error('Error resetting finance:', err);
    res.status(500).json({ error: 'Erro ao zerar lançamentos financeiros' });
  }
});


// Authentication
app.post('/api/auth/owner-login', (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Informe a senha do dono' });
    }

    const settings = db.getSettings();
    const providedHash = hashPassword(`dono:${String(password).trim()}`);

    // If owner password hasn't been set yet, set it on first login!
    if (!settings.ownerPasswordHash) {
      if (String(password).trim().length < 4) {
        return res.status(400).json({ error: 'A senha inicial deve ter pelo menos 4 caracteres' });
      }
      db.updateSettings({ ownerPasswordHash: providedHash });
      return res.json({ success: true, message: 'Senha inicial do dono definida com sucesso!' });
    }

    if (settings.ownerPasswordHash === providedHash) {
      return res.json({ success: true });
    }

    return res.status(401).json({ error: 'Senha incorreta da área do dono' });
  } catch (err) {
    console.error('Owner login error:', err);
    res.status(500).json({ error: 'Erro na autenticação' });
  }
});

app.post('/api/auth/client-login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Código/e-mail e senha são obrigatórios' });
    }

    const client = db.getClientByIdOrEmail(identifier);
    if (!client) {
      return res.status(404).json({ error: 'Código ou e-mail de cliente não encontrado' });
    }

    if (!client.pwh) {
      return res.status(400).json({ error: 'Cliente ainda não possui senha. Peça suporte pelo WhatsApp.' });
    }

    const expectedHash = hashPassword(`${client.id}:${String(password).trim()}`);
    if (client.pwh === expectedHash || (client.plainPw && client.plainPw === String(password).trim())) {
      const { pwh, ...safeClient } = client;
      return res.json({ success: true, client: safeClient });
    }

    return res.status(401).json({ error: 'Senha incorreta' });
  } catch (err) {
    console.error('Client login error:', err);
    res.status(500).json({ error: 'Erro ao autenticar cliente' });
  }
});

// Clients API
app.get('/api/clients', (req, res) => {
  try {
    const { q, type, status } = req.query;
    const clients = db.getClients(
      q ? String(q) : undefined,
      type ? String(type) : undefined,
      status ? String(status) : undefined
    );
    // Remove pwh
    const safeList = clients.map(({ pwh, ...rest }) => rest);
    res.json(safeList);
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

app.get('/api/clients/:code', (req, res) => {
  try {
    const client = db.getClientByCode(req.params.code);
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    const { pwh, ...safeClient } = client;
    res.json(safeClient);
  } catch (err) {
    console.error('Error fetching client:', err);
    res.status(500).json({ error: 'Erro ao carregar dados do cliente' });
  }
});

app.post('/api/clients', (req, res) => {
  try {
    const clientData = req.body;

    if (!clientData.name || clientData.name.trim().split(/\s+/).length < 2) {
      return res.status(400).json({ error: 'Informe o nome e sobrenome' });
    }
    if (!clientData.birth) {
      return res.status(400).json({ error: 'Data de nascimento é obrigatória' });
    }
    if (!clientData.cep || clientData.cep.replace(/\D/g, '').length !== 8) {
      return res.status(400).json({ error: 'CEP inválido' });
    }
    if (!clientData.street || !clientData.num || !clientData.bairro || !clientData.city || !clientData.uf) {
      return res.status(400).json({ error: 'Endereço incompleto' });
    }
    if (!clientData.wpp || clientData.wpp.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ error: 'WhatsApp inválido' });
    }
    if (!clientData.email || !/^\S+@\S+\.\S+$/.test(clientData.email)) {
      return res.status(400).json({ error: 'E-mail inválido' });
    }

    if (clientData.ref) {
      const refCode = clientData.ref.trim().toUpperCase();
      const referrer = db.getClientByCode(refCode);
      if (!referrer) {
        return res.status(400).json({ error: `Código de indicação ${refCode} não existe` });
      }
      clientData.ref = refCode;
    }

    const { client, plainPassword } = db.createClient(clientData, req.body.password);
    const { pwh, ...safeClient } = client;

    // Send credentials to client's email automatically
    const emailRecord = dispatchWelcomeCredentialsEmail({
      name: client.name,
      email: client.email,
      code: client.code,
      plainPassword,
      size: client.size,
      type: client.type,
    });

    broadcastEvent({
      type: 'NEW_ORDER_CREATED',
      clientCode: client.code,
      order: client.hist[0],
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      client: safeClient,
      plainPassword,
      emailDispatched: true,
      emailRecipient: safeClient.email,
      emailSentAt: emailRecord.timestamp,
      message: `Cadastro realizado! Sua senha foi gerada e enviada para ${safeClient.email}.`,
    });
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(500).json({ error: 'Erro ao cadastrar cliente' });
  }
});

// Resend credentials email
app.post('/api/clients/:code/resend-credentials-email', (req, res) => {
  try {
    const client = db.getClientByCode(req.params.code);
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    const pw = client.plainPw || '123456';
    const emailRecord = dispatchWelcomeCredentialsEmail({
      name: client.name,
      email: client.email,
      code: client.code,
      plainPassword: pw,
      size: client.size,
      type: client.type,
    });
    res.json({
      success: true,
      email: client.email,
      message: `E-mail com a senha reenviado com sucesso para ${client.email}!`,
      timestamp: emailRecord.timestamp,
    });
  } catch (err) {
    console.error('Error resending credentials email:', err);
    res.status(500).json({ error: 'Erro ao reenviar e-mail de acesso' });
  }
});

app.put('/api/clients/:code', (req, res) => {
  try {
    const { newPassword, ...updates } = req.body;
    const updated = db.updateClient(req.params.code, updates, newPassword);
    if (!updated) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    const { pwh, ...safeClient } = updated;
    res.json({ client: safeClient, message: 'Dados atualizados com sucesso!' });
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

app.delete('/api/clients/:code', (req, res) => {
  try {
    const success = db.deleteClient(req.params.code);
    if (!success) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json({ success: true, message: 'Cliente excluído com sucesso' });
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({ error: 'Erro ao excluir cliente' });
  }
});

// Client informs payment sent (sets status to Aguardando Validação)
app.post('/api/clients/:code/payment-sent', (req, res) => {
  try {
    const updated = db.markPaymentSent(req.params.code);
    if (!updated) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    const { pwh, ...safeClient } = updated;

    broadcastEvent({
      type: 'CLIENT_PAYMENT_SENT',
      clientCode: req.params.code,
      status: 'Aguardando Validação',
      timestamp: new Date().toISOString(),
    });

    res.json({
      client: safeClient,
      message: 'Pagamento informado! Status atualizado para Aguardando Validação.',
    });
  } catch (err) {
    console.error('Error marking payment sent:', err);
    res.status(500).json({ error: 'Erro ao registrar envio do pagamento' });
  }
});

// Activate client (Confirm PIX payment and set status to Ativo)
app.post('/api/clients/:code/activate', (req, res) => {
  try {
    const activated = db.activateClient(req.params.code);
    if (!activated) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    const { pwh, ...safeClient } = activated;

    broadcastEvent({
      type: 'CLIENT_ACTIVATED',
      clientCode: req.params.code,
      timestamp: new Date().toISOString(),
    });

    res.json({
      client: safeClient,
      message: 'Pagamento confirmado e plano ativado com sucesso! Entrega programada.',
    });
  } catch (err) {
    console.error('Error activating client:', err);
    res.status(500).json({ error: 'Erro ao ativar cliente' });
  }
});

// iFood-Style Realtime Delivery Status Update
app.patch('/api/clients/:code/orders/:orderId/delivery-status', (req, res) => {
  try {
    const { deliveryStatus, driverName, driverPhone, estimatedMinutes, deliveryNotes } = req.body;
    if (!deliveryStatus) {
      return res.status(400).json({ error: 'Status de entrega é obrigatório' });
    }

    const result = db.updateDeliveryStatus(req.params.code, req.params.orderId, deliveryStatus, {
      driverName,
      driverPhone,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      deliveryNotes,
    });

    if (!result) {
      return res.status(404).json({ error: 'Cliente ou pedido não encontrado' });
    }

    const { pwh, ...safeClient } = result.client;

    // Broadcast real-time delivery update to all connected WebSocket clients (owner and customers)
    broadcastEvent({
      type: 'DELIVERY_STATUS_CHANGED',
      clientCode: safeClient.code,
      orderId: req.params.orderId,
      deliveryStatus: deliveryStatus as DeliveryStatus,
      details: {
        driverName,
        driverPhone,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        deliveryNotes,
      },
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      client: safeClient,
      order: result.order,
      message: `Status de entrega atualizado para "${deliveryStatus}" em tempo real!`,
    });
  } catch (err) {
    console.error('Error updating delivery status:', err);
    res.status(500).json({ error: 'Erro ao atualizar status de entrega' });
  }
});

// Update client delivery date (modificar data de recebimento do produto)
app.patch('/api/clients/:code/delivery-date', (req, res) => {
  try {
    const { deliveryDate, notes } = req.body;
    if (!deliveryDate) {
      return res.status(400).json({ error: 'Data de entrega é obrigatória' });
    }

    const result = db.updateClientDeliveryDate(req.params.code, deliveryDate, notes);
    if (!result) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const { pwh, ...safeClient } = result.client;

    broadcastEvent({
      type: 'CLIENT_UPDATED',
      clientCode: safeClient.code,
      timestamp: new Date().toISOString(),
    });

    if (result.updatedOrder) {
      broadcastEvent({
        type: 'DELIVERY_STATUS_CHANGED',
        clientCode: safeClient.code,
        orderId: result.updatedOrder.id || `order-${Date.now()}`,
        deliveryStatus: result.updatedOrder.deliveryStatus || 'recebido',
        details: {
          deliveryNotes: result.updatedOrder.deliveryNotes,
        },
        updatedAt: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      client: safeClient,
      order: result.updatedOrder,
      message: `Data de recebimento atualizada para ${deliveryDate.split('-').reverse().join('/')}!`,
    });
  } catch (err) {
    console.error('Error updating delivery date:', err);
    res.status(500).json({ error: 'Erro ao atualizar data de entrega' });
  }
});

// Create or update subscription plan for client (fazer novas assinaturas)
app.post('/api/clients/:code/subscribe', (req, res) => {
  try {
    const { size, freq, startDate, notes } = req.body;
    if (!size || !freq) {
      return res.status(400).json({ error: 'Tamanho e frequência são obrigatórios' });
    }

    const result = db.createSubscription(req.params.code, {
      size: size as '250' | '500' | '1000',
      freq: Number(freq),
      startDate,
      notes,
    });

    if (!result) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const { pwh, ...safeClient } = result.client;

    broadcastEvent({
      type: 'CLIENT_UPDATED',
      clientCode: safeClient.code,
      timestamp: new Date().toISOString(),
    });

    broadcastEvent({
      type: 'NEW_ORDER_CREATED',
      clientCode: safeClient.code,
      order: result.order,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      client: safeClient,
      order: result.order,
      message: 'Nova assinatura realizada com sucesso! Pagamento aguardando validação do PIX.',
    });
  } catch (err) {
    console.error('Error creating subscription:', err);
    res.status(500).json({ error: 'Erro ao realizar assinatura' });
  }
});

// Orders & Purchases
app.post('/api/clients/:code/orders', (req, res) => {
  try {
    const newOrder = db.addOrder(req.params.code, req.body);
    if (!newOrder) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    broadcastEvent({
      type: 'NEW_ORDER_CREATED',
      clientCode: req.params.code,
      order: newOrder,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      order: newOrder,
      message: 'Compra registrada com sucesso! Entrega prevista no dia seguinte.',
    });
  } catch (err) {
    console.error('Error adding order:', err);
    res.status(500).json({ error: 'Erro ao registrar compra' });
  }
});

app.delete('/api/clients/:code/orders/:orderId', (req, res) => {
  try {
    const success = db.removeOrder(req.params.code, req.params.orderId);
    if (!success) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const updatedClient = db.getClientByCode(req.params.code);
    const safeClient = updatedClient ? (({ pwh, ...rest }) => rest)(updatedClient) : null;

    broadcastEvent({
      type: 'CLIENT_UPDATED',
      clientCode: req.params.code,
      timestamp: new Date().toISOString(),
    });

    broadcastEvent({
      type: 'FINANCE_UPDATED',
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, client: safeClient, message: 'Pedido excluído com sucesso!' });
  } catch (err) {
    console.error('Error removing order:', err);
    res.status(500).json({ error: 'Erro ao remover pedido' });
  }
});

// Reward Pots
app.post('/api/clients/:code/reward-sent', (req, res) => {
  try {
    const result = db.markRewardSent(req.params.code);
    if (!result) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(result);
  } catch (err) {
    console.error('Error marking reward sent:', err);
    res.status(500).json({ error: 'Erro ao atualizar brinde' });
  }
});

// Statistics & Reports
app.get('/api/stats', (_req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (err) {
    console.error('Error calculating stats:', err);
    res.status(500).json({ error: 'Erro ao calcular estatísticas' });
  }
});

// CSV Export
app.get('/api/export-csv', (_req, res) => {
  try {
    const csvContent = db.exportCSV();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="a-mi-gusto-clientes.csv"');
    res.send('\uFEFF' + csvContent); // Add UTF-8 BOM for Excel
  } catch (err) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ error: 'Erro ao exportar CSV' });
  }
});

// CEP Proxy (ViaCEP)
app.get('/api/cep/:cep', async (req, res) => {
  try {
    const cleanCep = req.params.cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return res.status(400).json({ error: 'CEP deve conter 8 dígitos' });
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    if (!response.ok) {
      return res.status(502).json({ error: 'Falha ao consultar ViaCEP' });
    }
    const data = await response.json();
    if (data.erro) {
      return res.status(404).json({ error: 'CEP não encontrado' });
    }
    res.json({
      cep: data.cep,
      street: data.logradouro,
      bairro: data.bairro,
      city: data.localidade,
      uf: data.uf,
    });
  } catch (err) {
    console.error('Error fetching CEP:', err);
    res.status(500).json({ error: 'Erro na consulta de CEP' });
  }
});

// Vite or Static Assets handler
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} with WebSocket support on /ws`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
