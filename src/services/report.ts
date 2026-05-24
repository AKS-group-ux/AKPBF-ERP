import api from './api';

export const ReportService = {
  /**
   * Request an operational/financial audit of the whole ERP state from Gemini
   */
  async generateAiAudit(context: any) {
    const response = await api.post('/ai/audit', { context });
    return response.data;
  },

  /**
   * Run the crisis and disruption PCA simulation
   */
  async runCrisisSimulation(crisisType: string, context: any) {
    const response = await api.post('/ai/sim-crisis', { crisisType, context });
    return response.data;
  },

  /**
   * Direct dialogue/chat prompt with AKPBF-Brain
   */
  async askBrainChat(message: string, context: any) {
    const response = await api.post('/ai/chat', { message, context });
    return response.data;
  }
};
