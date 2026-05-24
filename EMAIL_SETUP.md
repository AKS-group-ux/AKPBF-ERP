# ✉️ Guide d'Intégration & Configuration Email Zoho Mail SMTP (AKPBF ERP)

Ce document fournit des consignes détaillées pour connecter l'ERP AKPBF aux serveurs SMTP Zoho Mail de manière sécurisée et robuste.

---

## ⚙️ 1. Configuration de la Boîte de Réception Zoho Mail

Pour utiliser une adresse email Zoho (ex: `noreply@akpbf.com` ou `contact@votredomaine.com`) pour relayer vos rapports d'assainissement et factures clients, suivez les étapes de configuration ci-après :

1. Connectez-vous à la **Console d'Administration Zoho Mail** ou à votre messagerie sur Webmail : [https://mail.zoho.com](https://mail.zoho.com).
2. Rendez-vous dans les **Paramètres (icône engrenage)**.
3. Allez dans la section **Accès Mail -> Configuration POP/IMAP**.
4. Activez l'option **Accès IMAP** et **Accès SMTP**.
5. Notez les spécifications réseau officielles de Zoho :
   * **Host / Serveur sortant :** `smtp.zoho.com` *(ou `smtp.zoho.eu` si vos serveurs sont localisés en Europe)*.
   * **Port SSL :** `465` (Préféré pour Node.js Nodemailer).
   * **Port TLS / STARTTLS :** `587`.

---

## 🔐 2. Création d'un Mot de Passe d'Application (App Password)

Si l'Authentification à Double Facteur (2FA / MFA) est active sur votre compte Zoho (recommandation stricte de sécurité), votre mot de passe de messagerie principal sera bloqué lors des tentatives de connexion de Nodemailer. Généralisez l'utilisation d'un **App Password** à usage unique :

1. Accédez aux paramètres de sécurité de votre compte personnel Zoho Accounts : [https://accounts.zoho.com](https://accounts.zoho.com).
2. Cliquez sur l'onglet **Sécurité (Security)** dans la colonne latérale.
3. Dans la section **Mots de passe d'application (App Passwords)**, cliquez sur **Générer un nouveau mot de passe**.
4. Saisissez un nom explicite descriptif pour les rattachés d'exploitation, par exemple : `AKPBF_ERP_PRODUCTION_SMTP`.
5. Cliquez sur **Générer (Generate)**.
6. Zoho affiche alors un mot de passe fort de 16 caractères (ex: `xxxx yyyy zzzz wwww`). **Copiez-le et conservez-le précieusement**. C'est cette valeur qui devra être injectée dans votre variable d'environnement `ZOHO_SMTP_PASS`.

---

## 📋 3. Déclaration des Mots-Clés dans le Fichier d'Environnement `.env`

Configurez le fichier de variables réelles d'environnement `.env` localisé au cœur de la racine du projet (conforme au `.env.example` instauré) :

```env
# CONFIGURATION SMTP ZOHO MAIL - ERP AKPBF
ZOHO_SMTP_HOST="smtp.zoho.com"
ZOHO_SMTP_PORT=465
ZOHO_SMTP_USER="noreply@akpbf.com"
ZOHO_SMTP_PASS="votre_mot_de_passe_application_zoho_16_caracteres"
ZOHO_SMTP_SECURE=true
ZOHO_FROM_NAME="AKPBF ERP Assainissement"
```

> **Note :** Si vous changez de port pour utiliser STARTTLS sur le port `587`, passez la variable `ZOHO_SMTP_PORT=587` et positionnez `ZOHO_SMTP_SECURE=false`.

---

## 🧪 4. Protocole de Tests SMTP et Expéditions Tests

Pour valider votre tuyauterie d'envoi SMTP et certifier le rendu des templates, l'ERP d'AKPBF dispose d'un contrôleur de tests exclusif.

### A. Requête de Test via Postman ou cURL (9 modèles professionnels pris en charge)

Vous pouvez envoyer instantanément l'un des 9 gabarits transactionnels à votre adresse email personnelle pour examen :

#### Exemple de test pour le modèle "Email de bienvenue" (WELCOME) :
```bash
curl -X POST http://localhost:3000/api/email/send-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <votre_jeton_jwt>" \
  -d '{
    "toEmail": "votre-adresse-destinataire@gmail.com",
    "templateType": "WELCOME",
    "clientName": "Koffi Raphaël Abidjan"
  }'
```

#### Exemple de test pour le modèle "Relance de facture" (DUNNING_REMINDER) :
```bash
curl -X POST http://localhost:3000/api/email/send-test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <votre_jeton_jwt>" \
  -d '{
    "toEmail": "votre-adresse-destinataire@gmail.com",
    "templateType": "DUNNING_REMINDER",
    "clientName": "Koffi Raphaël",
    "amount": "15000",
    "dueDate": "30 Mai 2026"
  }'
```

Les valeurs acceptées pour l'argument `templateType` sont :
* `WELCOME` (Bienvenue)
* `SUBSCRIPTION_CONFIRM` (Confirmation d'abonnement actif)
* `INVOICE_PDF` (Facture avec son descriptif)
* `PAYMENT_CONFIRM` (Reçu de paiement Mobile Money)
* `DUNNING_REMINDER` (Rappels de relance pour impayés)
* `SUSPENSION_ALERT` (Notification d'interruption temporaire d'assainissement)
* `REACTIVATION_ALERT` (Confirmation de reprise de service de collecte)
* `COMPLAINT_REPLY` (Décision administrative d'intervention suite à réclamation)
* `ADMIN_NOTIF` (Rapport technique destiné à la direction)

---

## 🚀 5. Déploiement en Production (Google Cloud Run / Kubernetes)

Lors de votre déploiement industriel à destination de Google Cloud Run, ne copiez jamais le mot de passe SMTP en clair dans vos fichiers Git. Injectez et liez les secrets via le gestionnaire de variables d'environnement de la console Google Cloud :

### Commande de déploiement Cloud Run avec secrets SMTP :
```bash
gcloud run deploy akpbf-erp \
  --image gcr.io/votre-projet-gcp/akpbf-erp:latest \
  --platform managed \
  --region europe-west2 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars="ZOHO_SMTP_HOST=smtp.zoho.com,ZOHO_SMTP_PORT=465,ZOHO_SMTP_USER=noreply@akpbf.com,ZOHO_SMTP_SECURE=true,ZOHO_FROM_NAME=AKPBF ERP CI" \
  --set-secrets="ZOHO_SMTP_PASS=AKPBF_ZOHO_PASS:latest"
```

*(Cette commande requiert la création préalable du secret `AKPBF_ZOHO_PASS` dans Google Secret Manager d'Abidjan).*

---

## 🔍 6. Guide de Dépannage & Résolution des Pannes (Troubleshooting)

### A. Erreur : `Authentication Failed` (Identifiants invalides)
* **Origine :** Zoho exige la génération d'un App Password. Le mot de passe de connexion simple est systématiquement refusé par sécurité.
* **Résolution :** Suivez scrupuleusement la procédure d'App Password décrite au Chapitre 2 et mettez à jour votre fichier `.env`.

### B. Erreur : `Timeout / Connection Refused` (Attente de réponse infinie)
* **Origine :** Parfois, les ports SMTP 465 sont bloqués en sortie par les pare-feu de serveurs ou les fournisseurs d'accès internet locaux.
* **Résolution :** Tentez d'utiliser alternativement le port TLS normal :
  1. Réglez `ZOHO_SMTP_PORT=587`
  2. Passez `ZOHO_SMTP_SECURE=false`

### C. Erreur : `Relayer Refused / Sender Address Mismatch`
* **Origine :** Zoho interdit d'envoyer des emails en configurant une adresse d'expéditeur différente du compte utilisateur authentifié SMTP.
* **Résolution :** Assurez-vous que la valeur `ZOHO_SMTP_USER` est rigoureusement identique à l'adresse e-mail d'authentification et qu'elle n'est pas modifiée arbitrairement dans le champ `from` de Nodemailer.
