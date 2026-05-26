# Rapport d’Audit d'Authentification - AKPBF ERP

**Système :** Assainissement, Kiosques et Propreté de la Boucle du Fleuve (AKPBF)  
**Standard Crypto :** JWT (HMAC SHA-256) + Hachage de mot de passe Bcrypt  
**Stratégie de Session :** Sans-État (*Stateless Sessions*), Jeton de Rotation à Usage Unique (*RTR*)

---

## 1. STRATÉGIE ET PROTOCOLES D'AUTHENTIFICATION

L'ERP AKPBF incorpore un protocole double d'authentification ciblant distinctement les personnels de l’entreprise publique et les clients citoyens d’Abidjan au sein du même pivot modulaire :

### A. Rapatriement de Session (Flowchart de Connexion)

```
        LOGIN FORM (Email/Mot de passe, ou ID Citoyen, ou Numéro Téléphone)
                                     │
                                     v
                  API Express : POST /api/auth/login
                                     │
               ┌─────────────────────┴─────────────────────┐
               ▼                                           ▼
      [IDENTIFIANT CORPORATIF]                     [ID DE CITOYEN]
      - Vérification Bcrypt                        - Résolution directe table Customer
      - Extraction de Rôle                         - Forçage profil "CLIENT"
               │                                           │
               └─────────────────────┬─────────────────────┘
                                     v
                        Signature du Jeton JWT
               (Claims: id, name, email, role, phone)
                                     │
                                     v
                           Génération de la Paire :
             - Access Token (Jeton court - Expiration : 2h)
             - Refresh Token (Jeton long de Rotation - Usage Unique)
```

---

## 2. AUDIT DE SÉCURITÉ DES COMPORTEMENTS SÉPTENNAIRES

### A. Politique de Mots de Passe Forts
*   **Hachage :** Les mots de passe du personnel d'Abidjan (Administrateur, Comptable, Superviseur) sont hachés dynamiquement au démarrage à l'aide de l'algorithme Bcrypt avec un sel de coefficient d'étirement de $10$ (`salt rounds = 10`), bloquant toute tentative de lecture brute dans la base de données.
*   **Règle de Recomposition d'Oubli :** La réinitialisation par le point de terminaison `POST /api/auth/reset-password` applique une validation regex stricte :
    *   Minimum $8$ caractères d'extension
    *   Minimum $1$ lettre majuscule
    *   Minimum $1$ lettre minuscule
    *   Minimum $1$ caractère numérique obligatoire.

### B. Cycle de Rotation des Jetons de Rafraîchissement (RTR)
*   **Prototypage :** Le Refresh Token n’est pas un simple jeton statique réinscrit. L'ERP met en application la technique de **Rotation de Jeton de Rafraîchissement** (*Refresh Token Rotation*).
*   **Principe de validation :** Lorsqu’un jeton JWT expire, le client frontend soumet le jeton de rafraîchissement au point `/api/auth/refresh`. Le backend l'invalide à l'usage, génère un nouveau jeton d’accès, crée un nouveau jeton de rafraîchissement réutilisable de niveau supérieur (`One-time usage Token`) et purge l'ancien.
*   **Protection :** Si un jeton malveillant intercepté tente de s'exécuter à deux reprises, le système détecte la réutilisation, détruit l'intégralité de la chaîne de session associée et force l'usurpateur à s'authentifier à nouveau.

---

## 3. POINT COMPARATIF DE STOCKAGE FRONTEND

| Attribut de Stockage | Stratégie Actuelle Frontend | Analyse de Risque | Recommandation de Durcissement |
| :--- | :--- | :--- | :--- |
| **Access Token (JWT)** | `localStorage.setItem('akpbf_erp_token')` | Sensible aux attaques de script croisé (*XSS*). | Déplacer le stockage vers un Cookie sécurisé `HttpOnly` avec l'option `Secure` et `SameSite=Strict`. |
| **Refresh Token** | `localStorage.setItem('akpbf_erp_refresh_token')` | Risque de compromission persistance en cas d'effraction locale. | Stocker de manière exclusive en Cookie crypté côté serveur, inaccessible au JavaScript (`document.cookie`). |

---

## 4. PROCESSUS DE RÉVOCATION ACTIVE (LOGOUT)

Lors du déclenchement manuel de la déconnexion par l'administrateur ou l'utilisateur :
1.  Les clés d'identification sont purgées du stockage local du navigateur (`sessionStorage.clear()`, désactivation de jetons).
2.  L'appel optionnel `POST /api/auth/logout` est transmis au backend pour répertorier l'invalidation du jeton d'accès et blacklister l'identifiant pour empêcher d'éventuels rejeux de requêtes d'en-tête.
