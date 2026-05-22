/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SpecApi {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  roleRequired: string;
  payload?: string;
  response: string;
}

export const API_SPECS: SpecApi[] = [
  {
    method: 'GET',
    path: '/api/v1/subscribers',
    description: 'Récupère la liste filtrable des abonnés ordinaires avec niveaux de bac et statuts.',
    roleRequired: 'MUNICIPALITE_LIR / COLLECTEUR_CHEF',
    response: `{\n  "status": "success",\n  "count": 25000,\n  "data": [\n    {\n      "id": "f8a0cb1b-fb42-491c-b261-2be3ec473188",\n      "name": "Koffi Jean-Jacques",\n      "neighborhood": "Cocody-Angré",\n      "bin_status": "NORMAL",\n      "bin_rfid_uid": "RFID-8812-F02A",\n      "is_active": true\n    }\n  ]\n}`
  },
  {
    method: 'POST',
    path: '/api/v1/subscribers',
    description: 'Enregistre un nouvel abonné avec géolocalisation pour routage SIG.',
    roleRequired: 'MUNICIPALITE_MESS (Guichet)',
    payload: `{\n  "fullname": "Fofana Moussa",\n  "phone": "+2250700112233",\n  "zone_id": "4d1a0cc4-e8b4-419b-b2b9-291db85700a1",\n  "plan_id": "8482b6be-8ef2-484c-bce9-ee91a27f5112",\n  "address_street": "Rue L84, Villa 12",\n  "latitude": 5.2952,\n  "longitude": -3.9781,\n  "bin_rfid_uid": "RFID-9912-A00B"\n}`,
    response: `{\n  "status": "created",\n  "subscriber_id": "771e86c4-1834-44ad-b683-0a86aeaba1a2",\n  "message": "Abonné enregistré avec succès et rattaché à la zone géospatiale Marcory."\n}`
  },
  {
    method: 'POST',
    path: '/api/v1/billing/generate',
    description: 'Déclenche le moteur de facturation automatique pour le cycle mensuel spécifié.',
    roleRequired: 'MUNICIPALITE_MESS (Directeurs Financiers)',
    payload: `{\n  "billing_period": "2026-05",\n  "due_date": "2026-06-10"\n}`,
    response: `{\n  "status": "success",\n  "invoices_generated": 24890,\n  "total_amount_fcfa": 86450000,\n  "failed_records": 0\n}`
  },
  {
    method: 'POST',
    path: '/api/v1/routes/optimize',
    description: 'Service d\'optimisation géospatiale des tournées (moteur combinatoire heuristique VRP).',
    roleRequired: 'COLLECTEUR_CHEF',
    payload: `{\n  "zone_id": "4d1a0cc4-e8b4-419b-b2b9-291db85700a1",\n  "truck_id": "90e9d6d4-831c-438c-a8e5-21d191295328",\n  "agent_id": "18c21a1f-8c34-406e-827c-3bda5c8ae185"\n}`,
    response: `{\n  "status": "optimized",\n  "route_id": "67b93a02-28e4-4a2a-89bc-998822998811",\n  "stops_sequenced": 142,\n  "estimated_time_mins": 210,\n  "total_distance_km": 24.6\n}`
  },
  {
    method: 'POST',
    path: '/api/v1/payments/webhook',
    description: 'Point d\'entrée webhook de télé-validation d\'encaissement (Wave, Orange Money, MTN).',
    roleRequired: 'CARRIER_GATEWAY',
    payload: `{\n  "carrier_tx_id": "WAVE-TX-98420912A",\n  "invoice_id": "4b7c8d9e-0012-4022-b883-fa919a3188cc",\n  "amount_paid_fcfa": 5500,\n  "gateway": "WAVE"\n}`,
    response: `{\n  "status": "acknowledged",\n  "processed": true,\n  "transaction_id": "7d9830da-4a81-4328-8ac3-3be201dbab99"\n}`
  }
];

export const DB_TABLES = [
  {
    name: 'tb_zones (Module Zones)',
    description: 'Zones de collecte municipales délimitant juridiquement les arrondissements (SIG PostGIS).',
    columns: [
      { name: 'zone_id [PK]', type: 'UUID', desc: 'Identifiant unique de la zone. Auto-généré par gen_random_uuid().' },
      { name: 'name', type: 'VARCHAR(100) UNIQUE NOT NULL', desc: 'Libellé de l\'arrondissement ou quartier (ex: Cocody-Nord, Yopougon-Est, Marcory-Zone4).' },
      { name: 'commune', type: 'VARCHAR(100) NOT NULL', desc: 'Département ou commune d\'Abidjan.' },
      { name: 'geom_polygon', type: 'GEOMETRY(Polygon, 4326) NOT NULL', desc: 'Polygone PostGIS délimitant le tracé géographique. Indexé avec un index spatial GIST.' },
      { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP', desc: 'Date d\'import de la zone administrative.' }
    ]
  },
  {
    name: 'tb_users (Module Utilisateurs)',
    description: 'Gère les comptes utilisateurs, informations d\'authentification et privilèges d\'administration.',
    columns: [
      { name: 'user_id [PK]', type: 'UUID', desc: 'Identifiant unique de l\'utilisateur.' },
      { name: 'email', type: 'VARCHAR(150) UNIQUE NOT NULL', desc: 'Adresse de connexion principale. Indexée.' },
      { name: 'phone', type: 'VARCHAR(20) UNIQUE NOT NULL', desc: 'Numéro de télé-alerte et contact.' },
      { name: 'password_hash', type: 'VARCHAR(255) NOT NULL', desc: 'Empreinte de hachage cryptographique sécurisée.' },
      { name: 'full_name', type: 'VARCHAR(150) NOT NULL', desc: 'Prénom et nom complet.' },
      { name: 'role', type: 'VARCHAR(50) NOT NULL', desc: 'Privilège RBAC (CHECK: ADMIN_MUN, CONTROLEUR_CO, CHAUFFEUR, COLLECTEUR, CITOYEN).' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT true', desc: 'Filtre d\'exclusion d\'accès.' },
      { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP', desc: 'Date de branchement système.' }
    ]
  },
  {
    name: 'tb_subscription_plans (Module Abonnements / Barème)',
    description: 'Catalogue municipal officiel des offres et tarifs d\'assainissement (REOM).',
    columns: [
      { name: 'plan_id [PK]', type: 'UUID', desc: 'Clé primaire unique du plan.' },
      { name: 'name', type: 'VARCHAR(100) UNIQUE NOT NULL', desc: 'Libellé de l\'abonnement (Social Standard, Résidentiel Plus, Professionnel Indus).' },
      { name: 'monthly_price_fcfa', type: 'NUMERIC(12,2) NOT NULL', desc: 'Redevance contractuelle mensuelle en Francs CFA (CHECK: >= 0).' },
      { name: 'bin_volume_liters', type: 'INTEGER NOT NULL', desc: 'Taille réglementaire du bac fourni par la commune (CHECK: > 0).' },
      { name: 'pickups_per_week', type: 'INTEGER NOT NULL', desc: 'Nombre de collectes programmées hebdomadairement (ex: 2, 3, 7).' },
      { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP', desc: 'Création du barème.' }
    ]
  },
  {
    name: 'tb_subscribers (Module Clients / Abonnés)',
    description: 'Portefeuille général de dizaines de milliers d\'abonnés. Fait l\'objet d\'indexation géospatiale.',
    columns: [
      { name: 'subscriber_id [PK]', type: 'UUID', desc: 'Identifiant unique du foyer ou entreprise.' },
      { name: 'user_id [FK]', type: 'UUID REFERENCES tb_users(user_id) ON DELETE SET NULL', desc: 'Lien d\'authentification citoyen facultatif.' },
      { name: 'zone_id [FK]', type: 'UUID REFERENCES tb_zones(zone_id) NOT NULL', desc: 'Zone d\'affectation territoriale géographique d\'AKPBF.' },
      { name: 'plan_id [FK]', type: 'UUID REFERENCES tb_subscription_plans(plan_id) NOT NULL', desc: 'Tarif applicable lié.' },
      { name: 'fullname', type: 'VARCHAR(200) NOT NULL', desc: 'Civils ou Raison sociale de l\'abonné d\'assainissement.' },
      { name: 'phone', type: 'VARCHAR(20) NOT NULL', desc: 'Téléphone de notification et imputation d\'écritures caisse.' },
      { name: 'address_street', type: 'VARCHAR(255) NOT NULL', desc: 'Indication physique (ex: 4ème Tranche, à côté de la Mosquée).' },
      { name: 'geom_point', type: 'GEOMETRY(Point, 4326) NOT NULL', desc: 'Géolocalisation précise du bac. Objet d\'un index spatial GIST indispensable.' },
      { name: 'bin_rfid_uid', type: 'VARCHAR(100) UNIQUE NOT NULL', desc: 'Code d\'identification RFID scellé sur la cuve pour traçabilité.' },
      { name: 'bin_status', type: 'VARCHAR(30) DEFAULT \'NORMAL\'', desc: 'Diagnostic intelligent du bac (CHECK: NORMAL, EMPTY, OVERFLOW, DAMAGE).' },
      { name: 'is_active', type: 'BOOLEAN DEFAULT true', desc: 'Clause de blocage temporaire (impayés).' },
      { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP', desc: 'Date d\'enrôlement initial de l\'abonné.' }
    ]
  },
  {
    name: 'tb_trucks (Module Camions)',
    description: 'Inventaire de la flotte lourde de camions-bennes de ramassage.',
    columns: [
      { name: 'truck_id [PK]', type: 'UUID', desc: 'Clé primaire du véhicule.' },
      { name: 'license_plate', type: 'VARCHAR(30) UNIQUE NOT NULL', desc: 'Plaque d\'immatriculation officielle (ex: CI-01-XXXX).' },
      { name: 'model_brand', type: 'VARCHAR(100) NOT NULL', desc: 'Désignation constructeur (ex: Renault Trucks Compacteur, Mercedes Arocs).' },
      { name: 'capacity_kg', type: 'NUMERIC(10,2) NOT NULL', desc: 'Charge de compactage technique en Kg (CHECK: > 0).' },
      { name: 'current_status', type: 'VARCHAR(30) DEFAULT \'ACTIVE\'', desc: 'État fonctionnel (CHECK: ACTIVE, MAINTENANCE, OUT_OF_SERVICE).' },
      { name: 'purchased_date', type: 'DATE', desc: 'Date de mise en service dans la commune.' }
    ]
  },
  {
    name: 'tb_agents (Module Agents / Équipages)',
    description: 'Registre d\'immatriculation professionnelle des chauffeurs et éboueurs de terrain.',
    columns: [
      { name: 'agent_id [PK]', type: 'UUID', desc: 'Identifiant technique unique de l\'agent.' },
      { name: 'user_id [FK]', type: 'UUID REFERENCES tb_users(user_id) UNIQUE NOT NULL', desc: 'Association exclusive à un compte système.' },
      { name: 'job_title', type: 'VARCHAR(100) NOT NULL', desc: 'Poste d\'équipage programmé (CHECK: DRIVER, COLLECTOR).' },
      { name: 'driving_license_num', type: 'VARCHAR(50) UNIQUE', desc: 'Numéro de permis professionnel (facultatif si uniquement éboueur).' },
      { name: 'is_available', type: 'BOOLEAN DEFAULT true', desc: 'Garde la disponibilité opérationnelle sur les tournées.' },
      { name: 'hired_date', type: 'DATE NOT NULL', desc: 'Date d\'embauche des ressources.' }
    ]
  },
  {
    name: 'tb_collector_routes (Module Collectes - Tournées)',
    description: 'Feuilles de routes et logistique d\'affectation routière.',
    columns: [
      { name: 'route_id [PK]', type: 'UUID', desc: 'Identifiant unique de la tournée planifiée.' },
      { name: 'zone_id [FK]', type: 'UUID REFERENCES tb_zones(zone_id) NOT NULL', desc: 'Zone de ramassage ciblée.' },
      { name: 'truck_id [FK]', type: 'UUID REFERENCES tb_trucks(truck_id) NOT NULL', desc: 'Camion affecté.' },
      { name: 'primary_driver_id [FK]', type: 'UUID REFERENCES tb_agents(agent_id) NOT NULL', desc: 'Chauffeur assermenté responsable.' },
      { name: 'scheduled_start_time', type: 'TIMESTAMPTZ NOT NULL', desc: 'Heure de lancement planifiée.' },
      { name: 'actual_start_time', type: 'TIMESTAMPTZ', desc: 'Heure de pesée du camion au garage.' },
      { name: 'actual_end_time', type: 'TIMESTAMPTZ', desc: 'Fin de déversement à la station principale.' },
      { name: 'total_tonnage_collected', type: 'NUMERIC(10,3) DEFAULT 0', desc: 'Masse brute d\'ordures enregistrées en décharge.' },
      { name: 'status', type: 'VARCHAR(30) DEFAULT \'PENDING\'', desc: 'Statut du trajet (CHECK: PENDING, ON_GOING, COMPLETED, CANCELLED).' },
      { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP', desc: 'Mise sur plan.' }
    ]
  },
  {
    name: 'tb_collection_logs (Module Collectes - Passages)',
    description: 'Registre ultra-précis de traçabilité RFID mesurant le vidage effectif de chaque bac ménager.',
    columns: [
      { name: 'log_id [PK]', type: 'UUID', desc: 'Clé primaire.' },
      { name: 'route_id [FK]', type: 'UUID REFERENCES tb_collector_routes(route_id) ON DELETE CASCADE NOT NULL', desc: 'ID de la tournée active émettrice.' },
      { name: 'subscriber_id [FK]', type: 'UUID REFERENCES tb_subscribers(subscriber_id) NOT NULL', desc: 'Abonné audité.' },
      { name: 'scanned_rfid', type: 'VARCHAR(100) NOT NULL', desc: 'UID RFID matériel lu par les capteurs embarqués lors de la levée.' },
      { name: 'collection_time', type: 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL', desc: 'Date et heure précises (indexée).' },
      { name: 'estimated_volume_liters', type: 'INTEGER', desc: 'Algorithme d\'apprentissage ou mesure ultrasonique.' },
      { name: 'agent_notes', type: 'TEXT', desc: 'Anomalies constatées lors du vidage (CHECK: Bac brisé, Accès verrouillé).' }
    ]
  },
  {
    name: 'tb_invoices (Module Factures)',
    description: 'Grand livre des créances fiscales et redevances de salubrité publique municipale.',
    columns: [
      { name: 'invoice_id [PK]', type: 'UUID', desc: 'Clé primaire de la facture.' },
      { name: 'invoice_code', type: 'VARCHAR(50) UNIQUE NOT NULL', desc: 'Référence normalisée pérenne (ex: FAC-2026-05-0149A).' },
      { name: 'subscriber_id [FK]', type: 'UUID REFERENCES tb_subscribers(subscriber_id) NOT NULL', desc: 'Reconnaissance du foyer débiteur.' },
      { name: 'billing_period', type: 'VARCHAR(7) NOT NULL', desc: 'Mois et année comptable (format YYYY-MM; indexation croisée).' },
      { name: 'amount_due_fcfa', type: 'NUMERIC(12,2) NOT NULL', desc: 'Montant redevance exigible (CHECK: > 0).' },
      { name: 'issue_date', type: 'DATE DEFAULT CURRENT_DATE NOT NULL', desc: 'Publication numérique de la facture.' },
      { name: 'due_date', type: 'DATE NOT NULL', desc: 'Echéance légale avant relance et majoration.' },
      { name: 'payment_status', type: 'VARCHAR(30) DEFAULT \'PENDING\'', desc: 'Etat comptable interne (CHECK: PENDING, PAID, OVERDUE, WRITE_OFF).' },
      { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP', desc: 'Enregistrement de l\'écriture de débit.' }
    ]
  },
  {
    name: 'tb_payments (Module Paiements)',
    description: 'Registre des d\'encaissements caisse et des validations de passerelle webhook d\'opérateurs financiers.',
    columns: [
      { name: 'payment_id [PK]', type: 'UUID', desc: 'Clé primaire unitaire.' },
      { name: 'invoice_id [FK]', type: 'UUID REFERENCES tb_invoices(invoice_id) NOT NULL', desc: 'Facture clôturée ou amortie.' },
      { name: 'amount_paid_fcfa', type: 'NUMERIC(12,2) NOT NULL', desc: 'Somme encaissée effectivement (CHECK: > 0).' },
      { name: 'payment_method', type: 'VARCHAR(50) NOT NULL', desc: 'Type d\'encaissement (CHECK: WAVE, ORANGE_MONEY, MTN_MOMO, CASH_MUNICIPAL).' },
      { name: 'carrier_tx_id', type: 'VARCHAR(100) UNIQUE NOT NULL', desc: 'Référence de transaction opérateur unique pour rapprochement.' },
      { name: 'processed_at', type: 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL', desc: 'Validation de l\'entrée de trésorerie.' }
    ]
  },
  {
    name: 'tb_notifications (Module Notifications)',
    description: 'Rapprochement des alertes d\'information de collecte, de levées de bac et de relance d\'impayés par SMS ou écrits.',
    columns: [
      { name: 'notification_id [PK]', type: 'UUID', desc: 'Clé unique de l\'alerte.' },
      { name: 'recipient_phone', type: 'VARCHAR(20) NOT NULL', desc: 'Coordonnée téléphonique cible.' },
      { name: 'type', type: 'VARCHAR(30) NOT NULL', desc: 'Canal ou objet (SMS_BILLING, SMS_PICKUP_ALERT, EMAIL_INVOICE).' },
      { name: 'message_body', type: 'TEXT NOT NULL', desc: 'Contenu brut envoyé aux modems.' },
      { name: 'send_status', type: 'VARCHAR(20) DEFAULT \'SENT\'', desc: 'Rapports d\'émissions (PENDING, SENT, FAILED).' },
      { name: 'sent_at', type: 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP', desc: 'Log temporel.' },
      { name: 'retry_count', type: 'INTEGER DEFAULT 0', desc: 'Suivi de renvois réseau.' }
    ]
  },
  {
    name: 'tb_audit_history (Module Historique / Télémétrie)',
    description: 'Piste d\'audit immuable de traçabilité des mutations de données et de sécurité RGPD pour AKPBF.',
    columns: [
      { name: 'audit_id [PK]', type: 'UUID', desc: 'Log unique d\'action.' },
      { name: 'operator_user_id [FK]', type: 'UUID REFERENCES tb_users(user_id) ON DELETE SET NULL', desc: 'Agent ou administrateur ayant procédé au changement.' },
      { name: 'action_type', type: 'VARCHAR(50) NOT NULL', desc: 'Genre d\'événement système (INSERT, UPDATE_STATUS, LOGIN, ROUTE_START).' },
      { name: 'table_name', type: 'VARCHAR(50) NOT NULL', desc: 'Table faisant l\'objet d\'une altération.' },
      { name: 'record_id', type: 'UUID NOT NULL', desc: 'Référence de la ligne altérée.' },
      { name: 'old_state', type: 'JSONB', desc: 'Différence avant écriture. Très rapide sous PostgreSQL.' },
      { name: 'new_state', type: 'JSONB', desc: 'Données post-validation.' },
      { name: 'ip_address', type: 'INET', desc: 'IP d\'émission réseau.' },
      { name: 'logged_at', type: 'TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP', desc: 'Date exacte certifiée.' }
    ]
  }
];
