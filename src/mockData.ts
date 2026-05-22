/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Subscriber, SubscriptionPlan, Invoice, CollectorAgent, Route, NotificationLog } from './types';

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_eco',
    name: 'Standard Municipal',
    price: 3500, // FCFA or generic unit. We'll use FCFA for high regional realism or $ if preferred. Let's write 'FCFA' or 'cfa' for realistic municipal ERP branding
    frequency: 'Mensuel',
    description: '2 collectes par semaine, bac de 240L fourni, idéal pour les ménages standards de 2 à 4 personnes.',
    allowedVolume: '480 Litres/Mois'
  },
  {
    id: 'plan_family',
    name: 'Famille Nombreuse',
    price: 6000,
    frequency: 'Mensuel',
    description: '3 collectes par semaine, bac renforcé de 360L fourni, ramassage des encombrants légers inclus.',
    allowedVolume: '1080 Litres/Mois'
  },
  {
    id: 'plan_pro',
    name: 'Professionnel & Commerce',
    price: 15000,
    frequency: 'Mensuel',
    description: 'Collecte quotidienne du lundi au samedi, grand conteneur de 1100L fourni, service de désinfection trimestriel.',
    allowedVolume: '6600 Litres/Mois'
  }
];

export const INITIAL_SUBSCRIBERS: Subscriber[] = [
  {
    id: 'SUB-4029',
    name: 'Koffi Jean-Jacques',
    email: 'koffi.jj@email.com',
    phone: '+225 07 48 29 10 22',
    address: 'Rue des Jardins, Villa 14',
    neighborhood: 'Cocody',
    lat: 5.3524,
    lng: -3.9875,
    planId: 'plan_eco',
    status: 'active',
    binType: 'Standard 240L',
    lastCollectionDate: '2026-05-20',
    currentBinLevel: 75,
    paymentStatus: 'paid'
  },
  {
    id: 'SUB-1933',
    name: 'Soro Aminata',
    email: 'aminata.soro@outlook.com',
    phone: '+225 01 02 83 94 00',
    address: 'Avenue de la République, Face BICICI',
    neighborhood: 'Plateau',
    lat: 5.3211,
    lng: -4.0198,
    planId: 'plan_pro',
    status: 'active',
    binType: 'Conteneur 1100L',
    lastCollectionDate: '2026-05-21',
    currentBinLevel: 40,
    paymentStatus: 'paid'
  },
  {
    id: 'SUB-8842',
    name: 'Mamadou Diallo',
    email: 'diallo.mamadou@gmail.com',
    phone: '+225 05 55 92 11 39',
    address: 'Cité des Arts, Bâtiment D2',
    neighborhood: 'Cocody',
    lat: 5.3489,
    lng: -3.9995,
    planId: 'plan_eco',
    status: 'suspended',
    binType: 'Standard 240L',
    lastCollectionDate: '2026-05-15',
    currentBinLevel: 95,
    paymentStatus: 'overdue'
  },
  {
    id: 'SUB-5591',
    name: 'Bamba Mariam',
    email: 'bamba.mariam@gmail.com',
    phone: '+225 07 88 11 22 33',
    address: 'Zone 4, Impasse de la Paix',
    neighborhood: 'Marcory',
    lat: 5.2952,
    lng: -3.9781,
    planId: 'plan_family',
    status: 'active',
    binType: 'Bac Grand 360L',
    lastCollectionDate: '2026-05-19',
    currentBinLevel: 15,
    paymentStatus: 'paid'
  },
  {
    id: 'SUB-2110',
    name: 'Koné Ibrahim',
    email: 'kone.ibrahim@outlook.com',
    phone: '+225 05 44 33 22 11',
    address: 'Yopougon Selmer, Près de la Mairie',
    neighborhood: 'Yopougon',
    lat: 5.3344,
    lng: -4.0851,
    planId: 'plan_eco',
    status: 'active',
    binType: 'Standard 240L',
    lastCollectionDate: '2026-05-20',
    currentBinLevel: 60,
    paymentStatus: 'unpaid'
  },
  {
    id: 'SUB-7721',
    name: 'Kouassi Chantal',
    email: 'chantal.kouassi@yahoo.fr',
    phone: '+225 01 44 99 88 77',
    address: 'Boulevard Valéry Giscard d\'Estaing',
    neighborhood: 'Marcory',
    lat: 5.3015,
    lng: -3.9902,
    planId: 'plan_family',
    status: 'active',
    binType: 'Bac Grand 360L',
    lastCollectionDate: '2026-05-19',
    currentBinLevel: 80,
    paymentStatus: 'paid'
  },
  {
    id: 'SUB-3312',
    name: 'Sylla Ousmane',
    email: 'ousmane.sylla@pro.ci',
    phone: '+225 07 11 55 44 33',
    address: 'Sogefiha, Rue de la Station',
    neighborhood: 'Yopougon',
    lat: 5.3415,
    lng: -4.0722,
    planId: 'plan_pro',
    status: 'active',
    binType: 'Conteneur 1100L',
    lastCollectionDate: '2026-05-21',
    currentBinLevel: 25,
    paymentStatus: 'paid'
  },
  {
    id: 'SUB-9944',
    name: 'Ouédraogo Salif',
    email: 'salif.ouedraogo@outlook.fr',
    phone: '+225 01 77 33 22 00',
    address: 'Angré 9ème Tranche, Villa 105',
    neighborhood: 'Cocody',
    lat: 5.3671,
    lng: -3.9722,
    planId: 'plan_family',
    status: 'pending',
    binType: 'Bac Grand 360L',
    lastCollectionDate: 'Jamais',
    currentBinLevel: 0,
    paymentStatus: 'unpaid'
  }
];

export const INITIAL_AGENTS: CollectorAgent[] = [
  {
    id: 'AGT-001',
    name: 'Kaboré Moussa',
    phone: '+225 07 49 92 11 01',
    licensePlate: 'CI-3891-EF',
    status: 'idle',
    assignedRouteId: null,
    activeVehicle: 'Benne Tasseuse Renault D16',
    totalCollectedKg: 45200
  },
  {
    id: 'AGT-002',
    name: 'Touré Bakary',
    phone: '+225 01 22 93 11 88',
    licensePlate: 'CI-1029-GH',
    status: 'idle',
    assignedRouteId: null,
    activeVehicle: 'Compacteur Iveco Stralis',
    totalCollectedKg: 58100
  },
  {
    id: 'AGT-003',
    name: 'Coulibaly Issa',
    phone: '+225 05 33 94 00 22',
    licensePlate: 'CI-5544-KL',
    status: 'idle',
    assignedRouteId: null,
    activeVehicle: 'Benne Tasseuse Scania P250',
    totalCollectedKg: 39400
  }
];

export const INITIAL_ROUTES: Route[] = [
  {
    id: 'RTE-01',
    name: 'Tournée Hebdo Cocody Nord',
    sector: 'Cocody',
    agentId: 'AGT-001',
    agentName: 'Kaboré Moussa',
    status: 'draft',
    stopsCount: 3,
    completedStopsCount: 0
  },
  {
    id: 'RTE-02',
    name: 'Tournée Premium Plateau-Marché',
    sector: 'Plateau',
    agentId: 'AGT-002',
    agentName: 'Touré Bakary',
    status: 'draft',
    stopsCount: 1,
    completedStopsCount: 0
  },
  {
    id: 'RTE-03',
    name: 'Tournée Résidentielle Marcory',
    sector: 'Marcory',
    agentId: null,
    agentName: null,
    status: 'draft',
    stopsCount: 2,
    completedStopsCount: 0
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'FAC-2026-001',
    subscriberId: 'SUB-4029',
    subscriberName: 'Koffi Jean-Jacques',
    amount: 3500,
    dueDate: '2026-05-10',
    issueDate: '2026-05-01',
    status: 'paid',
    paymentMethod: 'Orange Money',
    paidDate: '2026-05-04',
    period: 'Mai 2026'
  },
  {
    id: 'FAC-2026-002',
    subscriberId: 'SUB-1933',
    subscriberName: 'Soro Aminata',
    amount: 15000,
    dueDate: '2026-05-10',
    issueDate: '2026-05-01',
    status: 'paid',
    paymentMethod: 'Carte Bancaire',
    paidDate: '2026-05-02',
    period: 'Mai 2026'
  },
  {
    id: 'FAC-2026-003',
    subscriberId: 'SUB-8842',
    subscriberName: 'Mamadou Diallo',
    amount: 3500,
    dueDate: '2026-05-10',
    issueDate: '2026-05-01',
    status: 'overdue',
    period: 'Mai 2026'
  },
  {
    id: 'FAC-2026-004',
    subscriberId: 'SUB-5591',
    subscriberName: 'Bamba Mariam',
    amount: 6000,
    dueDate: '2026-05-10',
    issueDate: '2026-05-01',
    status: 'paid',
    paymentMethod: 'Wave',
    paidDate: '2026-05-08',
    period: 'Mai 2026'
  },
  {
    id: 'FAC-2026-005',
    subscriberId: 'SUB-2110',
    subscriberName: 'Koné Ibrahim',
    amount: 3500,
    dueDate: '2026-05-10',
    issueDate: '2026-05-01',
    status: 'pending',
    period: 'Mai 2026'
  },
  {
    id: 'FAC-2026-006',
    subscriberId: 'SUB-7721',
    subscriberName: 'Kouassi Chantal',
    amount: 6000,
    dueDate: '2026-05-10',
    issueDate: '2026-05-01',
    status: 'paid',
    paymentMethod: 'Espèces',
    paidDate: '2026-05-05',
    period: 'Mai 2026'
  }
];

export const INITIAL_NOTIFS: NotificationLog[] = [
  {
    id: 'NOT-1001',
    recipientName: 'Koffi Jean-Jacques',
    recipientContact: '+225 07 48 29 10 22',
    type: 'sms',
    templateName: 'Confirmation de Paiement',
    content: 'AKPBF : Votre paiement de 3500 FCFA pour l\'abonnement de Mai 2026 a été reçu avec succès. Merci pour votre contribution à la propreté de la ville !',
    sentAt: '2026-05-04 10:15',
    status: 'sent'
  },
  {
    id: 'NOT-1002',
    recipientName: 'Mamadou Diallo',
    recipientContact: 'diallo.mamadou@gmail.com',
    type: 'email',
    templateName: 'Rappel Facture Impayée',
    content: 'Objet : AKPBF - Rappel de paiement de votre abonnement. Cher(e) Mamadou Diallo, votre facture de 3500 FCFA datée du 01/05/2026 est en souffrance. Veuillez régulariser sous 48h pour éviter la suspension de votre service.',
    sentAt: '2026-05-12 14:02',
    status: 'sent'
  },
  {
    id: 'NOT-1003',
    recipientName: 'Koné Ibrahim',
    recipientContact: '+225 05 44 33 22 11',
    type: 'sms',
    templateName: 'Notification Veille de Collecte',
    content: 'AKPBF ALERTE : Notre camion passera demain matin à partir de 6h00 dans votre secteur Yopougon. Veuillez sortir votre bac standard de 240L ce soir.',
    sentAt: '2026-05-19 18:30',
    status: 'sent'
  }
];
