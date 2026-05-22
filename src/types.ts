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
  status: 'active' | 'suspended' | 'pending';
  binType: 'Standard 240L' | 'Bac Grand 360L' | 'Conteneur 1100L';
  lastCollectionDate: string;
  currentBinLevel: number; // 0 to 100%
  paymentStatus: 'paid' | 'unpaid' | 'overdue';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  frequency: string;
  description: string;
  allowedVolume: string;
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
