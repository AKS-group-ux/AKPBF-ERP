/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Subscriber, SubscriptionPlan, Invoice, CollectorAgent, Route, NotificationLog, Emplacement } from './types';

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_eco',
    name: 'Standard Municipal',
    reference: 'REF-ECO-2026',
    price: 3500, // FCFA or generic unit. We'll use FCFA for high regional realism or $ if preferred. Let's write 'FCFA' or 'cfa' for realistic municipal ERP branding
    frequency: 'Mensuel',
    durationMonths: 12,
    collectionFrequency: '2 fois par semaine',
    maxCollectionsCount: 16,
    description: '2 collectes par semaine, bac de 240L fourni, idéal pour les ménages standards de 2 à 4 personnes.',
    termsAndConditions: 'Conditions standard d\'enlèvement de salubrité urbaine.',
    status: 'active',
    allowedVolume: '480 Litres/Mois'
  },
  {
    id: 'plan_family',
    name: 'Famille Nombreuse',
    reference: 'REF-FAM-2500',
    price: 6000,
    frequency: 'Mensuel',
    durationMonths: 12,
    collectionFrequency: '3 fois par semaine',
    maxCollectionsCount: 24,
    description: '3 collectes par semaine, bac renforcé de 360L fourni, ramassage des encombrants légers inclus.',
    termsAndConditions: 'Réservé aux résidences privées, encombrants légers acceptés.',
    status: 'active',
    allowedVolume: '1080 Litres/Mois'
  },
  {
    id: 'plan_pro',
    name: 'Professionnel & Commerce',
    reference: 'REF-B2B-PRO',
    price: 15000,
    frequency: 'Mensuel',
    durationMonths: 12,
    collectionFrequency: 'Quotidien (Lun-Sam)',
    maxCollectionsCount: 48,
    description: 'Collecte quotidienne du lundi au samedi, grand conteneur de 1100L fourni, service de désinfection trimestriel.',
    termsAndConditions: 'Contrat commercial B2B, bac géré, astreinte week-end incluse.',
    status: 'active',
    allowedVolume: '6600 Litres/Mois'
  }
];

export const INITIAL_SUBSCRIBERS: Subscriber[] = [
  {
    id: 'SUB-4029',
    name: 'Sawadogo Alassane',
    email: 'sawadogo.a@email.com',
    phone: '+226 70 48 29 10',
    address: 'Avenue de la liberté, Villa 14',
    neighborhood: 'Karpala',
    lat: 12.3082,
    lng: -1.4880,
    planId: 'plan_eco',
    status: 'active',
    binType: 'Standard 240L',
    lastCollectionDate: '2026-05-20',
    currentBinLevel: 75,
    paymentStatus: 'paid'
  },
  {
    id: 'SUB-1933',
    name: 'Diallo Aminata',
    email: 'aminata.diallo@outlook.com',
    phone: '+226 71 02 83 94',
    address: 'Avenue de la Nation, Face Coris Bank',
    neighborhood: 'Somgandé',
    lat: 12.4042,
    lng: -1.4871,
    planId: 'plan_pro',
    status: 'active',
    binType: 'Conteneur 1100L',
    lastCollectionDate: '2026-05-21',
    currentBinLevel: 40,
    paymentStatus: 'paid'
  },
  {
    id: 'SUB-8842',
    name: 'Ouedraogo Boureima',
    email: 'boureima.oued@gmail.com',
    phone: '+226 72 55 92 11',
    address: 'Cité An III, Bâtiment D2',
    neighborhood: 'Karpala',
    lat: 12.3110,
    lng: -1.4910,
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
    phone: '+226 74 88 11 22',
    address: 'Sector 15, Impasse de la Paix',
    neighborhood: 'Gounghin',
    lat: 12.3615,
    lng: -1.5540,
    planId: 'plan_family',
    status: 'active',
    binType: 'Bac Grand 360L',
    lastCollectionDate: '2026-05-19',
    currentBinLevel: 15,
    paymentStatus: 'paid'
  },
  {
    id: 'SUB-2110',
    name: 'Sanon Ibrahim',
    email: 'sanon.ibrahim@outlook.com',
    phone: '+226 75 44 33 22',
    address: 'Pissy Nord, Près de la Mairie',
    neighborhood: 'Pissy',
    lat: 12.3382,
    lng: -1.5714,
    planId: 'plan_eco',
    status: 'active',
    binType: 'Standard 240L',
    lastCollectionDate: '2026-05-20',
    currentBinLevel: 60,
    paymentStatus: 'unpaid'
  },
  {
    id: 'SUB-7721',
    name: 'Kouaré Chantal',
    email: 'chantal.kouare@yahoo.fr',
    phone: '+226 76 44 99 88',
    address: 'Boulevard Circulaire',
    neighborhood: 'Gounghin',
    lat: 12.3590,
    lng: -1.5490,
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
    email: 'ousmane.sylla@pro.bf',
    phone: '+226 77 11 55 44',
    address: 'Secteur 30, Rue de la Station',
    neighborhood: 'Pissy',
    lat: 12.3420,
    lng: -1.5730,
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
    phone: '+226 78 77 33 22',
    address: 'Ouaga 2000, Secteur 15, Villa 105',
    neighborhood: 'Karpala',
    lat: 12.3050,
    lng: -1.4850,
    planId: 'plan_family',
    status: 'pending_validation',
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
    phone: '+226 70 49 92 11',
    licensePlate: 'BF-3891-EF',
    status: 'idle',
    assignedRouteId: null,
    activeVehicle: 'Benne Tasseuse Renault D16',
    totalCollectedKg: 45200
  },
  {
    id: 'AGT-002',
    name: 'Touré Bakary',
    phone: '+226 71 22 93 11',
    licensePlate: 'BF-1029-GH',
    status: 'idle',
    assignedRouteId: null,
    activeVehicle: 'Compacteur Iveco Stralis',
    totalCollectedKg: 58100
  },
  {
    id: 'AGT-003',
    name: 'Coulibaly Issa',
    phone: '+226 72 33 94 00',
    licensePlate: 'BF-5544-KL',
    status: 'idle',
    assignedRouteId: null,
    activeVehicle: 'Benne Tasseuse Scania P250',
    totalCollectedKg: 39400
  }
];

export const INITIAL_ROUTES: Route[] = [
  {
    id: 'RTE-01',
    name: 'Tournée Hebdo Karpala Est',
    sector: 'Karpala',
    agentId: 'AGT-001',
    agentName: 'Kaboré Moussa',
    status: 'draft',
    stopsCount: 3,
    completedStopsCount: 0
  },
  {
    id: 'RTE-02',
    name: 'Tournée Premium Somgandé-Marché',
    sector: 'Somgandé',
    agentId: 'AGT-002',
    agentName: 'Touré Bakary',
    status: 'draft',
    stopsCount: 1,
    completedStopsCount: 0
  },
  {
    id: 'RTE-03',
    name: 'Tournée Résidentielle Gounghin',
    sector: 'Gounghin',
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
    subscriberName: 'Sawadogo Alassane',
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
    subscriberName: 'Diallo Aminata',
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
    subscriberName: 'Ouedraogo Boureima',
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
    subscriberName: 'Sanon Ibrahim',
    amount: 3500,
    dueDate: '2026-05-10',
    issueDate: '2026-05-01',
    status: 'pending',
    period: 'Mai 2026'
  },
  {
    id: 'FAC-2026-006',
    subscriberId: 'SUB-7721',
    subscriberName: 'Kouaré Chantal',
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
    recipientName: 'Sawadogo Alassane',
    recipientContact: '+226 70 48 29 10',
    type: 'sms',
    templateName: 'Confirmation de Paiement',
    content: 'AKPBF : Votre paiement de 3500 FCFA pour l\'abonnement de Mai 2026 a été reçu avec succès. Merci pour votre contribution à la propreté de la ville !',
    sentAt: '2026-05-04 10:15',
    status: 'sent'
  },
  {
    id: 'NOT-1002',
    recipientName: 'Ouedraogo Boureima',
    recipientContact: 'boureima.oued@gmail.com',
    type: 'email',
    templateName: 'Rappel Facture Impayée',
    content: 'Objet : AKPBF - Rappel de paiement de votre abonnement. Cher(e) Ouedraogo Boureima, votre facture de 3500 FCFA datée du 01/05/2026 est en souffrance. Veuillez régulariser sous 48h pour éviter la suspension de votre service.',
    sentAt: '2026-05-12 14:02',
    status: 'sent'
  },
  {
    id: 'NOT-1003',
    recipientName: 'Sanon Ibrahim',
    recipientContact: '+226 75 44 33 22',
    type: 'sms',
    templateName: 'Notification Veille de Collecte',
    content: 'AKPBF ALERTE : Notre camion passera demain matin à partir de 6h00 dans votre secteur Pissy. Veuillez sortir votre bac standard de 240L ce soir.',
    sentAt: '2026-05-19 18:30',
    status: 'sent'
  }
];

export const INITIAL_EMPLACEMENTS: Emplacement[] = [
  {
    id: 'EMP-001',
    subscriberId: 'SUB-4029',
    reference: 'RE-26-0001',
    label: 'Résidence Principale (Villa 14)',
    type: 'Maison',
    address: 'Avenue de la liberté, Villa 14',
    neighborhood: 'Karpala',
    gpsCoordinates: '12.30820, -1.48800',
    wasteType: 'Ménagers',
    estimatedVolume: '240L',
    collectionFrequency: '2 fois par semaine'
  },
  {
    id: 'EMP-002',
    subscriberId: 'SUB-4029',
    reference: 'RE-26-0002',
    label: 'Maquis Chez Alassane',
    type: 'Maquis',
    address: 'Avenue Oumarou Kanazoé, Lot 23',
    neighborhood: 'Karpala',
    gpsCoordinates: '12.31500, -1.49200',
    wasteType: 'Organiques',
    estimatedVolume: '360L',
    collectionFrequency: 'Quotidien'
  },
  {
    id: 'EMP-003',
    subscriberId: 'SUB-1933',
    reference: 'RE-26-0003',
    label: 'Boutique Prêt-à-Porter Gounghin',
    type: 'Boutique',
    address: 'Avenue de l\'Insurrection Populaire',
    neighborhood: 'Gounghin',
    gpsCoordinates: '12.36150, -1.55400',
    wasteType: 'Cartons & Papiers',
    estimatedVolume: '1100L',
    collectionFrequency: 'Quotidien'
  },
  {
    id: 'EMP-004',
    subscriberId: 'SUB-1933',
    reference: 'RE-26-0004',
    label: 'Bureaux Administratifs Somgandé',
    type: 'Bureau',
    address: 'Avenue de la Nation, Face Coris Bank',
    neighborhood: 'Somgandé',
    gpsCoordinates: '12.40420, -1.48710',
    wasteType: 'Cartons & Papiers',
    estimatedVolume: '120L',
    collectionFrequency: '1 fois par semaine'
  },
  {
    id: 'EMP-005',
    subscriberId: 'SUB-8842',
    reference: 'RE-26-0005',
    label: 'Restaurant Saveurs de Ouaga',
    type: 'Restaurant',
    address: 'Boulevard Charles de Gaulle',
    neighborhood: 'Gounghin',
    gpsCoordinates: '12.35800, -1.55000',
    wasteType: 'Organiques',
    estimatedVolume: '360L',
    collectionFrequency: '3 fois par semaine'
  },
  {
    id: 'EMP-006',
    subscriberId: 'SUB-8842',
    reference: 'RE-26-0006',
    label: 'Dépôt de Stockage de Tampouy',
    type: 'Entrepôt',
    address: 'Zone Industrielle de Tampouy, Hangar B',
    neighborhood: 'Tampouy',
    gpsCoordinates: '12.41100, -1.55500',
    wasteType: 'Plastiques',
    estimatedVolume: '1100L',
    collectionFrequency: '2 fois par semaine'
  }
];

