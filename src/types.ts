/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  planId: string;
  status: 'draft' | 'pending_validation' | 'active' | 'suspended' | 'expired' | 'terminated' | 'overdue';
  binType: 'Standard 240L' | 'Bac Grand 360L' | 'Conteneur 1100L';
  lastCollectionDate: string;
  currentBinLevel: number; // 0 to 100%
  paymentStatus: 'paid' | 'unpaid' | 'overdue';
  startDate?: string;
  endDate?: string;
  collectionsRealized?: number; // Realized collections count
  unpaidDays?: number; // Outstanding unpaid period
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  reference: string;
  price: number;
  frequency: 'Mensuel' | 'Trimestriel' | 'Semestriel' | 'Annuel' | 'Personnalisé';
  durationMonths: number;
  collectionFrequency: string; // e.g. "2 fois par semaine"
  maxCollectionsCount: number; // max allowed collections
  description: string;
  termsAndConditions: string; // conditions generales
  status: 'active' | 'inactive';
  allowedVolume: string;
}

export interface SubscriptionHistoryLog {
  id: string;
  subscriberId: string;
  subscriberName: string;
  action: 'creation' | 'modification' | 'payment' | 'renewal' | 'suspension' | 'termination' | 'reactivation' | 'state_change';
  oldState?: string;
  newState?: string;
  description: string;
  timestamp: string;
  operator: string;
}

export interface Invoice {
  id: string;
  subscriberId: string;
  subscriberName: string;
  amount: number;
  dueDate: string;
  issueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod?: 'Orange Money' | 'Wave' | 'Carte Bancaire' | 'Espèces';
  paidDate?: string;
  period: string;
}

export interface CollectorAgent {
  id: string;
  name: string;
  phone: string;
  licensePlate: string;
  status: 'idle' | 'on_tour' | 'offline';
  assignedRouteId: string | null;
  activeVehicle: string;
  totalCollectedKg: number;
}

export interface Route {
  id: string;
  name: string;
  sector: string;
  agentId: string | null;
  agentName: string | null;
  status: 'draft' | 'active' | 'completed';
  stopsCount: number;
  completedStopsCount: number;
}

export interface NotificationLog {
  id: string;
  recipientName: string;
  recipientContact: string;
  type: 'sms' | 'email';
  templateName: string;
  content: string;
  sentAt: string;
  status: 'sent' | 'pending' | 'failed';
}

export interface SectorStats {
  sectorName: string;
  subscribersCount: number;
  totalCollectedKg: number;
  completionRate: number;
}

export interface Contract {
  id: string; // Internal ID
  contractNumber: string; // Display number like CNT-2026-0012
  subscriberId: string;
  subscriberName: string;
  signatureDate: string | null;
  startDate: string;
  endDate: string;
  planId: string;
  planName: string;
  amount: number;
  termsAndConditions: string;
  status: 'draft' | 'pending' | 'signed' | 'active' | 'suspended' | 'expired' | 'terminated'; // Brouillon, En attente, Signé, Actif, Suspendu, Expiré, Résilié
  signedOnline?: boolean;
}

export interface ContractTemplate {
  id: string;
  name: string;
  body: string;
  status: 'active' | 'inactive';
}

export interface PaymentReceipt {
  id: string; // REC-XXXX
  paymentRef: string;
  subscriberId: string;
  subscriberName: string;
  contractNumber: string;
  invoiceId: string;
  paymentDate: string;
  amountPaid: number;
  paymentMethod: string;
  remainingBalance: number;
  electronicSignature: string; // hash/stamp
}

export interface Emplacement {
  id: string;
  subscriberId: string;
  reference: string;
  label: string;
  type: 'Maison' | 'Boutique' | 'Restaurant' | 'Maquis' | 'Bureau' | 'Entrepôt';
  address: string;
  neighborhood: string;
  gpsCoordinates: string;
  wasteType: 'Ménagers' | 'Plastiques' | 'Cartons & Papiers' | 'Organiques' | 'Métaux & Canettes' | 'Verres';
  estimatedVolume: string; // e.g., "240L", "360L", "1100L"
  collectionFrequency: string; // "2 fois par semaine", "Quotidien", etc.
}

export type UserRole = 'ADMINISTRATEUR' | 'COMPTABLE' | 'SUPERVISEUR' | 'CHAUFFEUR' | 'AGENT' | 'CLIENT' | 'CAISSIER' | 'AGENT_RECOUVREMENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  subscriberId?: string; // used for clients
  isActive?: boolean;
  assignedZones?: string[];
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface CollectionProof {
  id: string; // PRF-XXXX
  collectionDate: string; // YYYY-MM-DD
  collectionTime: string; // HH:MM
  clientId: string;
  clientName: string;
  contractRef: string;
  planName: string;
  agentName: string;
  vehiclePlate: string;
  status: 'Complétée' | 'Sautée' | 'Non ramassée' | 'À l\'instant (Confirmé QR)';
  comments?: string;
  // Extensible fields for future passage proofs
  photoBeforeUrl?: string; // photo avant
  photoAfterUrl?: string; // photo apres
  gpsLatitude?: number;
  gpsLongitude?: number;
  clientSignature?: string; // signature du client (base64 ou hash)
  qrCodeVal?: string; // code qr / RFID tag scanné
}




