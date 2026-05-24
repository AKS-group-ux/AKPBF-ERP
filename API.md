# 🔌 API.md - Spécification Technique des Endpoints

La suite d'API de l'ERP AKPBF d'Abidjan est divisée en deux routeurs : `/api/auth` (sécurisé par restriction brute force) et `/api` (sécurisé par cookies et signatures).

---

## 🔑 1. Routeur Authentification (`/api/auth`)

Tous les appels reçoivent une vérification et protection adaptative IP.

### A. Connexion (Login)
* **URL :** `POST /api/auth/login`
* **Entrées (Zod verified) :**
  ```json
  {
    "authMethod": "email",
    "email": "admin@akpbf.com",
    "password": "Admin@2026"
  }
  ```
  *(ou `"authMethod": "id"` avec `"subscriberId"`, ou `"authMethod": "phone"` avec  `"phone"` & `"otp"`)*
* **Réponse en succès (200) :**
  ```json
  {
    "success": true,
    "user": { "id": "admin@akpbf.com", "name": "Alkaïda Benjamin", "role": "ADMINISTRATEUR" },
    "token": "eyJhbG...",
    "refreshToken": "REFRESH-xxx"
  }
  ```

### B. Rafraîchissement Jeton (Session Rotation)
* **URL :** `POST /api/auth/refresh`
* **Entrées :** `{ "refreshToken": "REFRESH-xxx" }`
* **Réponse (200) :** `{ "success": true, "token": "eyJhbG...", "refreshToken": "REFRESH-yyy" }`

### C. Déconnexion (Logout)
* **URL :** `POST /api/auth/logout`
* **Headers requis :** `Authorization: Bearer <token>`
* **Réponse (200) :** `{ "success": true, "message": "Déconnexion enregistrée..." }`

---

## 🚚 2. Routeur Métier & Opérations (`/api`)

Tous les appels ci-dessous requièrent l'en-tête `Authorization: Bearer <token>`.

### A. Financement & Facturation
#### Run billing cycle
* **URL :** `POST /api/billing/cycle`
* **Action :** Déclenche la facturation automatique pour le mois en cours, projette les arriérés et applique les majorations de retard de 10%.
* **Réponse (200) :** Contient un récapitulatif comptable consolidé.

#### Get unpaid debts
* **URL :** `GET /api/billing/debts`
* **Action :** Retourne la liste ordonnée des abonnés d'Abidjan classés en retard de paiement (ex: niveau critique Rivieria 3, relances émises).

#### Trigger auto-suspensions
* **URL :** `POST /api/billing/auto-suspend`
* **Action :** Passe automatiquement le statut à `SUSPENDED` pour les comptes débiteurs cumulés sur 30 jours de retard.

### B. Encaissements Mobile Money
#### Charge customer
* **URL :** `POST /api/payments/charge`
* **Entrées :** `{ "provider": "ORANGE", "phoneNumber": "0708091011", "amount": 3500 }`
* **Action :** Lance l'Ussd Push sur le terminal de l'abonné. Retient la référence de transaction.

#### Webhook receipt
* **URL :** `POST /api/payments/webhook`
* **Signature requise :** `x-akpbf-signature` contenant le HMAC SHA-256 du contenu de corps.
* **Action :** Réconcilie et valide instantanément le dossier d'abonnement.

### C. Logistique GPS & Parc
#### Live GPS fleet coordinates
* **URL :** `GET /api/gps/vehicles`
* **Réponse (200) :** Retourne la latitude, longitude, vitesse, chauffeur et niveau de réservoir de tous les véhicules.

#### Solve route stops optimization
* **URL :** `POST /api/gps/optimize`
* **Entrées :** `{ "routeId": "CNT-XXXX" }`
* **Action :** Trie les points de passage en se basant sur les données de capteurs d'urgence RFID.

### D. Dossier & Téléchargement
#### Print PDF
* **URL :** `GET /api/documents/generate?docId=doc_ref&type=Facture`
* **Réponse (200) :** Fournit les instructions et le lien de téléchargement.
