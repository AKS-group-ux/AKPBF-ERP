# Rapport d’Audit de Sécurité (Phase 1) - AKPBF ERP

**Système :** Assainissement, Kiosques et Propreté de la Boucle du Fleuve (AKPBF)  
**Niveau Globale de Protection :** ÉLEVÉ / ENTREPRISE (Niveau Militarisé pour Gestion Municipale)  
**Standard d'Audit :** OWASP Top 10 Alignement

---

## 1. STRATÉGIE DE SÉCURITÉ MULTI-COUCHES (Defense-in-Depth)

L'ERP AKPBF incorpore un empilement rigoureux de barrières de protection logicielle assurant qu'aucun paquet de données hostile ne puisse atteindre le noyau transactionnel ou la base de données PostgreSQL :

```
                        [ REQUÊTE CLIENT REÇUE ]
                                    │
                                    ├──> BARRIÈRE 1 : CORRECTION DES EN-TÊTES HELMET
                                    │    - CSP hardi (Content Security Policy)
                                    │    - Validation d'origine de Frames unifiés
                                    │    - Activation HSTS permanente (Force HTTPS)
                                    │
                                    ├──> BARRIÈRE 2 : POLITIQUES DE VELOCITÉ (GlobalLimiter)
                                    │    - Retranchement à 300 requêtes / 15 minutes
                                    │
                                    ├──> BARRIÈRE 3 : AMORTISSEMENT DES REQUÊTES (SpeedDampener)
                                    │    - Ralentissement progressif (+500ms) après 100 requêtes
                                    │
                                    ├──> BARRIÈRE 4 : SÉCURISATION DES INJECTIONS (sqlAndXssShield)
                                    │    - Détection récursive de motifs SQL et balises script
                                    │
                                    ├──> BARRIÈRE 5 : AUTORISATION ET RBAC EN CASCADE
                                    │    - Validation de la signature cryptographique du JWT
                                    │
                                    v
                     [ NOYAU TRANSACTIONNEL ERP / SQL ]
```

---

## 2. REVUE TECHNIQUE DES COMPOSANTS D'ENGAGEMENT

### A. Le Bouclier Anti-Injections SQL & Faille XSS (`sqlAndXssShield`)
*   **Fonctionnement :** Analyse récursivement l'arborescence des arguments reçus dans `req.body`, `req.query`, et `req.params`.
*   **Injections SQL :** Bloque instantanément tout paramètre incluant des quotes simples `'`, des tirets de commentaires SQL `--`, des points-virgules `;` ou des associations suspectes du type `SELECT ... FROM`.
*   **Faille XSS :** Identifie et filtre les balises `<script>`, `<iframe`, `<object`, ainsi que les propriétés d'écoute JavaScript interactives (`onclick`, `onerror`).
*   **Sanction :** Retourne un code `HTTP 400 Bad Request` muni du signal `SECURITY_SHIELD_TRIGGERED`.

### B. Contrôle d'En-têtes HTTP de Confiance (`customHelmet`)
*   **HSTS (HTTP Strict Transport Security) :** Force la communication sous le protocole de chiffrement SSL/TLS (`https://`) pendant une durée d'un an (`maxAge: 31536000`), incluant les sous-domaines.
*   **CSP (Content Security Policy) :** Déclare les ressources tierces autorisées (Google API, polices Google, images provenant de réseaux de diffusion sécurisés) et proscrit le chargement de scripts étrangers.

### C. Amortisseur et Limiteurs de Requêtes (Velocity Shield)
*   **express-rate-limit :** Bloque les agressions de type déni de service (DDoS) en limitant le volume de requêtes à 300 par fenêtre de 15 minutes par IP publique.
*   **express-slow-down :** Ralentit de $500\text{ms}$ le délai de réponse pour toute IP formulant plus de 100 requêtes régulières dans cette même plage, rendant les balayages par robots et les attaques par force brute mathématiquement inefficaces.

---

## 3. CONFIDENTIALITÉ ET ACCÈS AUX CLÉS SECRÈTES DE PRODUCTION

*   **Zéro Exposition Navigateur :** Les secrets requis de l’ERP (Hachage de clé HMAC de jeton JWT `JWT_SECRET`, identifiants d'expédition SMTP Zoho Mail, clés d’accès API Gemini `GEMINI_API_KEY`) sont confinés hermétiquement sur la couche serveur du Cloud de conteneurs.
*   **Variables Clientèle saines :** Les communications tierces du client utilisent la passerelle d'API REST `/api/*` comme proxy inverse complet, interdisant de propager des clés secrètes sur la console système du navigateur.

---

## 4. LIMITATION DE RESPONSABILITÉ ET RECOMMANDATIONS

1.  **Changement de clé secrète par défaut :** S'assurer de définir une clé `JWT_SECRET` hautement entropique en production lors des déploiements définitifs via le tableau d’administration du système.
2.  **Filtrage par adresses IP sur les serveurs d'administration :** Brider l'accès à distance aux points de paramétrage de cycle financier aux seules adresses d'IP autoroutières de la direction générale de la salubrité pour une sécurité absolue.
