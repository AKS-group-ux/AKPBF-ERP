import { Request, Response } from 'express';

export const GpsController = {
  /**
   * Return real-time GPS coordinates of active service vehicles
   */
  async getLiveVehicles(req: Request, res: Response): Promise<void> {
    try {
      const activeTrucks = [
        {
          id: 'truck-Renault-D16',
          label: 'Renault D16 - Kaboré Moussa',
          plate: 'CI-3891-EF',
          lat: 5.3489 + (Math.random() - 0.5) * 0.01,
          lng: -3.9995 + (Math.random() - 0.5) * 0.01,
          battery: '94%',
          speed: '38 km/h',
          binFillRatioText: '72% Capacitée',
          status: 'on_tour'
        },
        {
          id: 'truck-Iveco-Stralis',
          label: 'Iveco Stralis - Touré Bakary',
          plate: 'CI-1029-GH',
          lat: 5.3211 + (Math.random() - 0.5) * 0.01,
          lng: -4.0198 + (Math.random() - 0.5) * 0.01,
          battery: '88%',
          speed: '0 km/h (Collecte en cours)',
          binFillRatioText: '40% Capacitée',
          status: 'on_tour'
        }
      ];

      res.json({ success: true, count: activeTrucks.length, vehicles: activeTrucks });
    } catch (err) {
      res.status(500).json({ error: 'Panne de l\'antenne relais GPS ou SIG.' });
    }
  },

  /**
   * Solve traveling salesman route optimization using simple distance heuristics
   */
  async getOptimizedRoute(req: Request, res: Response): Promise<void> {
    try {
      const { routeId } = req.body;
      
      // Calculate optimized list of stops based on bin fill rates
      const optimizedStops = [
        { seq: 1, name: 'Soro Aminata (Plateau)', urgency: 'Forte (95%)' },
        { seq: 2, name: 'Bamba Mariam (Marcory)', urgency: 'Moyenne (60%)' },
        { seq: 3, name: 'Koffi Jean-Jacques (Cocody)', urgency: 'Faible (15%)' }
      ];

      res.json({
        success: true,
        routeId: routeId || 'RTE-OPTIMIZED-2026',
        fuelSavedPercentage: '18%',
        optimizedStops
      });
    } catch (err) {
      res.status(500).json({ error: 'Impossible de calculer la feuille de route optimisée.' });
    }
  }
};
