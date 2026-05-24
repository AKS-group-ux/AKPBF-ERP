import api from './api';

export const RouteService = {
  /**
   * Fetch live coordinates of operational waste collection trucks
   */
  async getLiveVehicles() {
    const response = await api.get('/gps/vehicles');
    return response.data;
  },

  /**
   * Ask AI and Dijkstra heuristics to optimize waste collection sequence stops
   */
  async optimizeStops(routeId: string) {
    const response = await api.post('/gps/optimize', { routeId });
    return response.data;
  }
};
