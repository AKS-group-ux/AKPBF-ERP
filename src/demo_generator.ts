/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 * AKPBF High-Fidelity Data Generator.
 */

import { Subscriber, SubscriptionPlan, Invoice, CollectorAgent, Route, NotificationLog } from './types';

// Let's define the 3 official requested plans:
export const DEMO_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_standard_2500',
    name: 'Abonnement Standard Particulier',
    reference: 'REF-STD-2500',
    price: 2500,
    frequency: 'Mensuel',
    durationMonths: 12,
    collectionFrequency: '2 fois par semaine',
    maxCollectionsCount: 8,
    description: '2 passages de bennes par semaine. Bac d\'assainissement de 240Litres équipé de puce RFID inclus.',
    termsAndConditions: 'Valable pour les déchets ménagers uniquement. Tout déchet de construction est exclu.',
    status: 'active',
    allowedVolume: '480 L / Mois'
  },
  {
    id: 'plan_premium_5000',
    name: 'Abonnement Premium Famille',
    reference: 'REF-PREM-5000',
    price: 5000,
    frequency: 'Mensuel',
    durationMonths: 12,
    collectionFrequency: '3 fois par semaine',
    maxCollectionsCount: 12,
    description: '3 passages de bennes par semaine. Bac renforcé de 360Litres équipé RFID inclus. Enlèvement lourd prioritaire.',
    termsAndConditions: 'Comprend le ramassage périodique des encombrants légers de jardinage.',
    status: 'active',
    allowedVolume: '1080 L / Mois'
  },
  {
    id: 'plan_entreprise_15000',
    name: 'Abonnement Professionnel & Commerce',
    reference: 'REF-ENT-15000',
    price: 15000,
    frequency: 'Mensuel',
    durationMonths: 12,
    collectionFrequency: 'Quotidienne (Lundi-Samedi)',
    maxCollectionsCount: 26,
    description: '6 passages de bennes par semaine (Lundi-Samedi). Grand conteneur de voirie de 1100Litres fourni. Lavage annuel.',
    termsAndConditions: 'Idéal commerces, syndics et bureaux. Comprend un service annuel de désinfection du bac.',
    status: 'active',
    allowedVolume: '6600 L / Mois'
  }
];

// Names components for procedurally crafting authentic Ivorian listings
const IVORIAN_FIRST_NAMES = [
  'Jean-Jacques', 'Aminata', 'Mamadou', 'Mariam', 'Ibrahim', 'Chantal', 'Ousmane', 'Salif', 'Koffi', 'Ange-Marie',
  'Fatoumata', 'Alassane', 'Bakary', 'Simone', 'Didier', 'Grace', 'Arthur', 'Christian', 'Kouamé', 'Amoin',
  'Charles', 'Pascal', 'Estelle', 'Patricia', 'Franck', 'Thierry', 'Yao', 'Adjoua', 'Mathieu', 'Bintou',
  'Awa', 'Sékou', 'Fousseni', 'Marc-Antoine', 'Ismaël', 'Kadiatou', 'Stéphane', 'Gérard', 'Lassina', 'Mélissa',
  'Auguste', 'Laetitia5', 'Rodrigue', 'Evelyne', 'Abdoulaye', 'Sidi', 'Mireille', 'Constant', 'Kouassi', 'N\'Guessan'
];

const IVORIAN_LAST_NAMES = [
  'Coulibaly', 'Koné', 'Touré', 'Diallo', 'Diomandé', 'Bamba', 'Sidibé', 'Gnakpa', 'Sylla', 'Soro',
  'Kouadio', 'Bakayoko', 'Traoré', 'Doumbia', 'Ouattara', 'Yao', 'Kouassi', 'N\'Guessan', 'Meïté', 'Fofana',
  'Sangare', 'Meité', 'Cissé', 'Abdel-Kader', 'Gbagbo', 'Kamagaté', 'Diabaté', 'Barry', 'Sow', 'Camara',
  'Keïta', 'N\'Dri', 'Brou', 'Kouan', 'Konan', 'Acka', 'Logbo', 'Niangoran', 'Kipré', 'Blessy',
  'Zokou', 'M\'Bahia', 'Kadio', 'Bédié', 'Ahoua', 'Tanoh', 'Vassogo', 'Guindo', 'Ehouman', 'Fanny'
];

const NEIGHBORHOODS_BOUNDS = [
  { name: 'Cocody', lat: 5.3524, lng: -3.9875 },
  { name: 'Marcory', lat: 5.2952, lng: -3.9781 },
  { name: 'Yopougon', lat: 5.3344, lng: -4.0851 },
  { name: 'Plateau', lat: 5.3211, lng: -4.0198 },
  { name: 'Treichville', lat: 5.3022, lng: -4.0105 },
  { name: 'Koumassi', lat: 5.2891, lng: -3.9554 },
  { name: 'Adjamé', lat: 5.3610, lng: -4.0250 }
];

const COMPANY_SECTOR_SUFFIXES = [
  'SARL', 'SA', 'Etablissement Salubrité', 'Commerce Général', 'Groupe Scolaire', 'Clinique d\'Assainissement', 'Boulangerie du Faso', 'Supermarché Express'
];

const ASSOCIATION_PREFIXES = [
  'ONG Salubrité Verte', 'Fédération Gabarit Ouagadougou', 'Collectif Citoyen Propre', 'Union des Artisans de Salubrités', 'Association des Riverains du Quartier'
];

// Helper to format numeric IDs matching AKPBF-000001
export function formatClientId(num: number): string {
  return `AKPBF-${String(num).padStart(6, '0')}`;
}

// Deterministic Pseudo-Random Generator based on seed (for reproducibility of 75 high-fidelity records)
function createSeededRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateAllDemoData() {
  const rand = createSeededRandom(42 + 2026); // fixed seed for stable records

  const subscribers: Subscriber[] = [];
  const invoices: Invoice[] = [];
  const notificationLogs: NotificationLog[] = [];

  // Generate 75 clients: 50 Particulars, 20 Businesses, 5 Associations
  for (let idx = 1; idx <= 75; idx++) {
    const subscriberId = formatClientId(idx);
    let name = '';
    let email = '';
    let address = '';
    let planId = 'plan_standard_2500';
    let binType: 'Standard 240L' | 'Bac Grand 360L' | 'Conteneur 1100L' = 'Standard 240L';
    let neighborhoodObj = NEIGHBORHOODS_BOUNDS[Math.floor(rand() * NEIGHBORHOODS_BOUNDS.length)];
    
    // Slight jitter around center coordinates of neighborhood so maps feature looks stunning!
    const lat = neighborhoodObj.lat + (rand() - 0.5) * 0.015;
    const lng = neighborhoodObj.lng + (rand() - 0.5) * 0.015;

    // Define subscription statuses distribution: Actif (approx 75%), Suspendu (approx 15%), En retard (approx 10%)
    let status: 'active' | 'suspended' | 'pending' = 'active';
    let paymentStatus: 'paid' | 'unpaid' | 'overdue' = 'paid';

    const probStatus = rand();
    if (probStatus < 0.12) {
      status = 'suspended';
      paymentStatus = 'overdue';
    } else if (probStatus < 0.25) {
      status = 'active';
      paymentStatus = 'unpaid';
    } else {
      status = 'active';
      paymentStatus = 'paid';
    }

    // Phones formatted +225 05/07/01 etc.
    const prefixNum = ['01', '05', '07'][Math.floor(rand() * 3)];
    const digit1 = Math.floor(rand() * 10);
    const digit2 = Math.floor(rand() * 10);
    const digit3 = Math.floor(rand() * 10);
    const digit4 = Math.floor(rand() * 10);
    const digit5 = Math.floor(rand() * 10);
    const digit6 = Math.floor(rand() * 10);
    const digit7 = Math.floor(rand() * 10);
    const digit8 = Math.floor(rand() * 10);
    const phone = `+225 ${prefixNum} ${digit1}${digit2} ${digit3}${digit4} ${digit5}${digit6} ${digit7}${digit8}`;

    if (idx <= 50) {
      // 50 Particuliers
      const first = IVORIAN_FIRST_NAMES[Math.floor(rand() * IVORIAN_FIRST_NAMES.length)];
      const last = IVORIAN_LAST_NAMES[Math.floor(rand() * IVORIAN_LAST_NAMES.length)];
      name = `${first} ${last}`;
      email = `${first.toLowerCase().replace('-', '')}.${last.toLowerCase()}@outlook.ci`;
      
      const addresses = [
        'Villa ' + Math.floor(10 + rand() * 90) + ', Rue des Jardins',
        'Cité des Arts, Bâtiment ' + ['A', 'B', 'C', 'D'][Math.floor(rand() * 4)] + ', Appt ' + Math.floor(1 + rand() * 15),
        'Impasse de la Paix, Lot 445',
        'Résidence Cocody II Serey, Face Pharmacie',
        'Riviera 3, Extension Ouest, Villa ' + Math.floor(100 + rand() * 200),
        'Selmer, Près de la mosquée de quartier',
        'Zone 4C, Rue Pierre et Marie Curie'
      ];
      address = addresses[Math.floor(rand() * addresses.length)];

      // Standard (approx 65%) or Premium (approx 35%)
      if (rand() > 0.35) {
        planId = 'plan_standard_2500';
        binType = 'Standard 240L';
      } else {
        planId = 'plan_premium_5000';
        binType = 'Bac Grand 360L';
      }

    } else if (idx <= 70) {
      // 20 Entreprises
      const compName = IVORIAN_LAST_NAMES[Math.floor(rand() * IVORIAN_LAST_NAMES.length)];
      const suffix = COMPANY_SECTOR_SUFFIXES[Math.floor(rand() * COMPANY_SECTOR_SUFFIXES.length)];
      name = `${suffix} ${compName}`;
      email = `contact@${compName.toLowerCase()}-${suffix.split(' ')[0].toLowerCase()}.ci`;
      address = `Boulevard de la République, Imm. ` + (10 + Math.floor(rand() * 90)) + `, Bureau ` + (300 + Math.floor(rand() * 50));
      planId = 'plan_entreprise_15000';
      binType = 'Conteneur 1100L';

    } else {
      // 5 Associations
      const assocName = IVORIAN_LAST_NAMES[Math.floor(rand() * IVORIAN_LAST_NAMES.length)];
      const prefix = ASSOCIATION_PREFIXES[Math.floor(rand() * ASSOCIATION_PREFIXES.length)];
      name = `${prefix} ${assocName}`;
      email = `secretariat@${assocName.toLowerCase()}assoc.ci`;
      address = `Maison des Associations, S/C Mairie de ` + neighborhoodObj.name;
      
      // Associations can have Premium or Entreprise
      if (rand() > 0.5) {
        planId = 'plan_premium_5000';
        binType = 'Bac Grand 360L';
      } else {
        planId = 'plan_entreprise_15000';
        binType = 'Conteneur 1100L';
      }
    }

    const currentLevel = Math.floor(5 + rand() * 90);

    const subscriber: Subscriber = {
      id: subscriberId,
      name,
      email,
      phone,
      address,
      neighborhood: neighborhoodObj.name,
      lat,
      lng,
      planId,
      status: status as any,
      binType,
      lastCollectionDate: `2026-05-${Math.floor(15 + rand() * 7)}`,
      currentBinLevel: currentLevel,
      paymentStatus,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      collectionsRealized: Math.floor(12 + rand() * 20),
      unpaidDays: paymentStatus === 'overdue' ? Math.floor(30 + rand() * 100) : 0
    };

    subscribers.push(subscriber);

    // Let's generate Invoices History for this client: Janvier, Février, Mars, Avril, Mai 2026
    const plan = DEMO_PLANS.find(p => p.id === planId) || DEMO_PLANS[0];
    const amount = plan.price;

    const invoicePeriods = [
      { code: 'Janvier 2026', issue: '2026-01-01', due: '2026-01-10' },
      { code: 'Février 2026', issue: '2026-02-01', due: '2026-02-10' },
      { code: 'Mars 2026', issue: '2026-03-01', due: '2026-03-10' },
      { code: 'Avril 2026', issue: '2026-04-01', due: '2026-04-10' },
      { code: 'Mai 2026', issue: '2026-05-01', due: '2026-05-10' }
    ];

    invoicePeriods.forEach((period, pIdx) => {
      // Determine invoice status for this period
      let invStatus: 'paid' | 'pending' | 'overdue' = 'paid';
      let payMethod: 'Orange Money' | 'Wave' | 'Carte Bancaire' | 'Espèces' | undefined = 'Orange Money';
      let paidDate: string | undefined = `${period.issue.substring(0, 8)}0${Math.floor(2 + rand() * 6)}`;

      if (paymentStatus === 'overdue' && pIdx >= 3) {
        // Overdue status on latest 2 invoices
        invStatus = 'overdue';
        payMethod = undefined;
        paidDate = undefined;
      } else if (paymentStatus === 'unpaid' && pIdx === 4) {
        // Pending/Unpaid status on current Month
        invStatus = 'pending';
        payMethod = undefined;
        paidDate = undefined;
      } else {
        // Standard distribution of paying vendors
        const vendors: Array<'Orange Money' | 'Wave' | 'Carte Bancaire' | 'Espèces'> = ['Orange Money', 'Wave', 'Carte Bancaire', 'Espèces'];
        payMethod = vendors[pIdx % vendors.length];
      }

      invoices.push({
        id: `FAC-2026-${idx}${String(pIdx + 1).padStart(2, '0')}`,
        subscriberId: subscriber.id,
        subscriberName: subscriber.name,
        amount,
        dueDate: period.due,
        issueDate: period.issue,
        status: invStatus,
        paymentMethod: payMethod,
        paidDate,
        period: period.code
      });

      // Spawn a transaction logs if paid
      if (invStatus === 'paid') {
        const notif: NotificationLog = {
          id: `NOT-${idx}${pIdx}`,
          recipientName: subscriber.name,
          recipientContact: subscriber.phone,
          type: 'sms',
          templateName: 'Validation Reçu',
          content: `AKPBF : Votre redevance de ${amount} FCFA pour la période ${period.code} a bien été enregistrée par ${payMethod}. Clé de vérification municipale : TXN-${idx}${pIdx}${String(pIdx).toUpperCase()}`,
          sentAt: `${paidDate} 10:45`,
          status: 'sent'
        };
        notificationLogs.push(notif);
      }
    });
  }

  // Prepopulate standard routes & collector agents
  const agents: CollectorAgent[] = [
    { id: 'AGT-001', name: 'Kaboré Moussa', phone: '+225 07 49 92 11 01', licensePlate: 'CI-3891-EF', status: 'idle', assignedRouteId: null, activeVehicle: 'Benne Tasseuse Renault D16', totalCollectedKg: 145000 },
    { id: 'AGT-002', name: 'Touré Bakary', phone: '+225 01 22 93 11 88', licensePlate: 'CI-1029-GH', status: 'on_tour', assignedRouteId: 'RTE-01', activeVehicle: 'Compacteur Iveco Stralis', totalCollectedKg: 214000 },
    { id: 'AGT-003', name: 'Coulibaly Issa', phone: '+225 05 33 94 00 22', licensePlate: 'CI-5544-KL', status: 'idle', assignedRouteId: null, activeVehicle: 'Benne Tasseuse Scania P250', totalCollectedKg: 110200 },
    { id: 'AGT-004', name: 'Gérard Gnakpa', phone: '+225 07 14 25 36 47', licensePlate: 'CI-8894-AB', status: 'idle', assignedRouteId: null, activeVehicle: 'Benne Man TGS 33', totalCollectedKg: 85000 },
    { id: 'AGT-005', name: 'Mamadou Touré', phone: '+225 05 08 09 10 11', licensePlate: 'CI-9901-YZ', status: 'on_tour', assignedRouteId: 'RTE-02', activeVehicle: 'Volvo FE-320', totalCollectedKg: 198000 }
  ];

  const routes: Route[] = [
    { id: 'RTE-01', name: 'Tournée Hebdo Cocody-Riviera 3', sector: 'Cocody', agentId: 'AGT-002', agentName: 'Touré Bakary', status: 'active', stopsCount: 18, completedStopsCount: 6 },
    { id: 'RTE-02', name: 'Régie Municipale Plateau Commercial', sector: 'Plateau', agentId: 'AGT-005', agentName: 'Mamadou Touré', status: 'active', stopsCount: 12, completedStopsCount: 10 },
    { id: 'RTE-03', name: 'Ramassage Zone Zone Industrielle Yopougon', sector: 'Yopougon', agentId: null, agentName: null, status: 'draft', stopsCount: 22, completedStopsCount: 0 },
    { id: 'RTE-04', name: 'Tournée Résidentielle Marcory-Bietry', sector: 'Marcory', agentId: 'AGT-001', agentName: 'Kaboré Moussa', status: 'completed', stopsCount: 15, completedStopsCount: 15 }
  ];

  return {
    plans: DEMO_PLANS,
    subscribers,
    invoices,
    agents,
    routes,
    notifLogs: notificationLogs
  };
}
