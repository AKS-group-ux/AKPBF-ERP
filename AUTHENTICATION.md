# 🔐 AUTHENTICATION.md - Spécifications de l'Authentification ERP AKPBF

Ce dossier détaille l'acheminement sécurisé des flux d'authentification pour le Portail Citoyen (Clients) et le Portail Professionnel (Comptables, Chauffeurs, Surveillants et Super Admin).

---

## ⏳ 1. Cinématique des Jetons (JWT Access & Refresh)

Afin d'offrir une fluidité d'action combinée à une rigueur bancaire, la durée de vie utile des jetons d'accès et de rafraîchissement est strictement calibrée :

```
             +-----------------------+
             |    1. POST /login     |
             +-----------+-----------+
                         |
             (Génère Access Token 24h & Refresh Token 7j)
                         |
                         v
             +-----------------------+
             |    2. Stockage Local  |
             |   (localStorage/State)|
             +-----------+-----------+
                         |
           (Tant que Access Token est vivant)
                         |
                         v
             +-----------------------+
             |  3. Appel API standard|
             |  (Authorization Header|
             +-----------+-----------+
                         |
                (Si expiration 401)
                         |
                         v
             +-----------------------+
             |    4. POST /refresh   |
             +-----------+-----------+
                         |
             (Vérifie Refresh Token, détruit l'ancien,
              génère un nouveau couple Access / Refresh)
```

---

## 🔄 2. Rotation Obligatoire d'Une Seule Utilisation (Reuse Detection)

Le système de rotation de notre API (`rotateRefreshToken` dans `/backend/src/middleware/auth.ts`) applique les spécifications à usage unique :

1. Lorsqu'un client d'Abidjan sollicite un nouveau jeton d'accès en fournissant son `refreshToken`, le système vérifie sa concordance en base mémoire sécurisée.
2. Si le jeton est valide, celui-ci est **immédiatement détruit** pour s'assurer qu'il ne pourra plus jamais servir de canal de ré-authentification.
3. Un nouveau couple `(Access Token, Refresh Token)` est forgé et renvoyé à l'expéditeur.
4. Si un pirate tente de rejouer un jeton déjà consommé (Attaque par déni de session ou vol de cookie), l'API détecte le rejeu, rejette la requête en bloc avec une erreur `401 Unauthorized` et révoque toutes les sessions filles rattachées à ce compte utilisateur pour des raisons d'urgence.

---

## 💼 3. Comptes Corporatifs Pré-intégrés

Cinq comptes opérationnels simulent les différents rôles de la grille RBAC municipale d'Abidjan :

* **ADMINISTRATEUR :** `admin@akpbf.com` / `Admin@2026` (Gestion totale, audit, logs)
* **COMPTABLE :** `comptable@akpbf.com` / `Comptable@2026` (Facturation, impayés, encaissements)
* **SUPERVISEUR :** `superviseur@akpbf.com` / `Superviseur@2026` (Gestion de la logistique, camions, RH)
* **CHAUFFEUR :** `chauffeur@akpbf.com` / `Chauffeur@2026` (Remplissage de cuves, point de repère routier)
* **AGENT DE COLLECTE :** `agent@akpbf.com` / `Agent@2026` (Dépouillement des QR codes, bacs connectés)

Pour le **CLIENT** (Citoyen d'Abidjan), la connexion s'ouvre soit en saisissant son identifiant de facturation `ABJ-...`, soit en tapant son adresse e-mail rattachée et le mot de passe générique d'activation `Test@2026`.
