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
  }
};
