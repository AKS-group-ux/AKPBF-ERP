import api from './api';

export const InvoiceService = {
  /**
   * Run automated monthly invoice cycle
   */
  async runCycle() {
    const response = await api.post('/billing/cycle');
    return response.data;
  },

  /**
   * Get exhaustive list of in-debt system records
   */
  async getUnpaidDebts() {
    const response = await api.get('/billing/debts');
    return response.data;
  },

  /**
   * Action: Trigger automatic suspension blockings
   */
  async triggerAutoSuspensions() {
    const response = await api.post('/billing/auto-suspend');
    return response.data;
  },

  /**
   * POST /invoices - Creates a draft invoice
   */
  async createInvoice(payload: {
    customerId: string;
    subscriptionId?: string;
    amount: number;
    dueDate?: string;
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
    items?: Array<{ description: string; quantity: number; unitPrice: number }>;
  }) {
    const response = await api.post('/invoices', payload);
    return response.data;
  },

  /**
   * GET /invoices - Retrieve filtered invoices list
   */
  async getInvoices(filters?: { status?: string; customerId?: string }) {
    const response = await api.get('/invoices', { params: filters });
    return response.data;
  },

  /**
   * GET /invoices/:id - Retrieve full invoice details
   */
  async getInvoiceById(id: string) {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  /**
   * PUT /invoices/:id - Update draft invoice
   */
  async updateInvoice(id: string, payload: {
    amount?: number;
    dueDate?: string;
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
  }) {
    const response = await api.put(`/invoices/${id}`, payload);
    return response.data;
  },

  /**
   * POST /invoices/:id/validate - Validate invoice
   */
  async validateInvoice(id: string) {
    const response = await api.post(`/invoices/${id}/validate`);
    return response.data;
  },

  /**
   * POST /invoices/:id/payment - Records an invoice payment
   */
  async recordInvoicePayment(id: string, payload: {
    amountPaid: number;
    method: string;
    transactionId?: string;
  }) {
    const response = await api.post(`/invoices/${id}/payment`, payload);
    return response.data;
  },

  /**
   * POST /invoices/:id/cancel - Cancels an invoice
   */
  async cancelInvoice(id: string) {
    const response = await api.post(`/invoices/${id}/cancel`);
    return response.data;
  },

  /**
   * POST /subscriptions/:id/resiliate - Resiliates a subscription
   */
  async resiliateSubscription(subscriptionId: string, payload?: {
    resiliationDate?: string;
    reason?: string;
    comment?: string;
  }) {
    const response = await api.post(`/subscriptions/${subscriptionId}/resiliate`, payload);
    return response.data;
  },

  /**
   * GET /payments - Retrieve all transaction payments
   */
  async getPayments() {
    const response = await api.get('/payments');
    return response.data;
  },

  /**
   * GET /accounting - Retrieve accounting entries
   */
  async getAccountingEntries() {
    const response = await api.get('/accounting');
    return response.data;
  }
};
