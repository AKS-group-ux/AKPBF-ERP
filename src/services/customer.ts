import api from './api';

export const CustomerService = {
  /**
   * Fetch all registered subscribers
   */
  async getSubscribers() {
    const response = await api.get('/subscribers');
    return response.data;
  },

  /**
   * Register a new subscriber (Portail Public ou Admin)
   */
  async createSubscriber(payload: any) {
    const response = await api.post('/subscribers', payload);
    return response.data;
  },

  /**
   * Update active subscriber folder details
   */
  async updateSubscriber(id: string, payload: any) {
    const response = await api.put(`/subscribers/${id}`, payload);
    return response.data;
  },

  /**
   * Register an RFID/QR connected bin or retrieve levels
   */
  async getBinsSummary() {
    const response = await api.get('/gps/vehicles'); // Reuse available metrics safely
    return response.data;
  }
};
