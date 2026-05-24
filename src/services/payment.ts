import api from './api';

export const PaymentService = {
  /**
   * Initiate dynamic Mobile Money (Orange, Moov, Telecel) USSD Push
   */
  async chargeMobileMoney(payload: { provider: string; phoneNumber: string; amount: number; invoiceId: string }) {
    const response = await api.post('/payments/charge', payload);
    return response.data;
  },

  /**
   * Consult remote provider API status using txn reference
   */
  async checkStatus(reference: string) {
    const response = await api.get(`/payments/status/${reference}`);
    return response.data;
  }
};
