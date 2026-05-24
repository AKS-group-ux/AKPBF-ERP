# 🛡️ SECURITY.md - Directives de Sécurité, Chiffrement et Conformité

L'ERP AKPBF intègre des protocoles de sécurité avancés et conformes aux critères de conformité du RGPD et des régulations de l'UEMOA pour interdire l'exfiltration de données abonnés ou l'altération frauduleuse des factures de collecte.

---

## 🔒 1. Cryptographie & Signature de Sessions

### A. Hachage des Mots de Passe Administrateurs et Opérationnels
Tous les mots de passe de comptes d'entreprise sont chiffrés à l'aide de l'algorithme fort **bcryptjs** utilisant un facteur de salt de 10 tours (`saltRounds: 10`). Aucun mot de passe n'est stocké en clair dans la table PostgreSQL `users`.

### B. Jeton Cryptographique de Sessions
La signature des sessions est consolidée par des clés de hachage de pointe HS256 (`HMAC-SHA256`).
- Pour tout déploiement en production, la variable de configuration réseau `JWT_SECRET` se doit d'être redéfinie à l'aide d'une clé de entropie élevée générée de façon cryptographique (ex: `openssl rand -base64 48`).

---

## 🛡️ 2. Protection Réseau Contre les Attaques Standard (OWASP)

Le serveur Express est blindé par plusieurs pare-feux logiciels :

1. **HelmetJS (En-têtes HTTP de Sécurité) :**
   Verrouille les en-têtes réseau pour interdire le clickjacking, les falsifications de types MIME, et forcer le transport strict HTTPS (`Strict-Transport-Security`).
2. **Brute-Force Rate Limiter (Limiteur de Débit applicatif) :**
   L'ERP applique une restriction de requêtes de connexion sur l'URI d'accès `/api/auth` d'un maximum de **100 requêtes par créneau de 15 minutes** issu d'une même adresse IP, coupant ainsi court aux attaques d'intrusion par dictionnaires d'identifiants.
3. **Prévention des Injections SQL :**
   L'ERP écarte l'usage de requêtes SQL écrites en chaînes concaténées libres. Toutes les requêtes en base de données sont menées à travers le processeur syntaxique paramétré sécurisé de **l'ORM Prisma**, protégeant nativement l'ensemble des tables contre toute injection SQL malveillante.
4. **Validation stricte des Formulaires :**
   L'intégralité des variables de requêtes HTTP transmises par les clients (demande d'abonnement, dépôts de réclamations, affectations de chauffeurs) sont désinfectées syntaxiquement et typées de façon stricte en backend par la bibliothèque de validation **Zod** avant toute manipulation opérationnelle ou écriture.

---

## 📋 3. Auditabilité & Journalisation Sécurisée

Chaque transaction comptable critique et chaque ajustement d'abonnement est tracé dans la table `audit_logs` de PostgreSQL. 
Les informations mémorisées comprennent :
- L'horodatage système (`createdAt`).
- L'adresse IP émettrice.
- L'identité de l'agent opérationnel s'étant authentifié (`userId`).
- L'état brut révisé (`details` au format JSON structuré).

*Note : Les mots de passe saisis ou les identifiants complets de jetons bancaires sont rigoureusement élidés avant journalisation pour prévenir l'exposition collatérale de secrets.*

---

## 🚨 4. Signalement de Failles et Vulnérabilités

Pour tout signalement d'une vulnérabilité identifiée sur l'ERP AKPBF, merci de contacter directement notre Responsable de la Sécurité des Systèmes d'Information (RSSI) de Côte d'Ivoire par canal chiffré :
- **Mail :** `groupaksservices@gmail.com`
- **Sujet :** `[VULNERABILITY - SEC_AUDIT_2026]`

Une analyse corrective sera lancée sous un délai d'intervention technique garanti de moins de 48 heures ouvrées.
