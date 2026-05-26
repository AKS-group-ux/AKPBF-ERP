# Rapport d’Audit d'Autorisation RBAC - AKPBF ERP

**Système :** Assainissement, Kiosques et Propreté de la Boucle du Fleuve (AKPBF)  
**Type d'Autorisation :** RBAC Hiérarchique (Role-Based Access Control) + Séparation Logique Strict de Contexte  
**Composant de Contrôle :** `RbacMiddleware` (`/backend/src/middleware/rbac.ts`)

---

## 1. CARTOGRAPHIE HIÉRARCHIQUE DES RÔLES DE SÉCURITÉ

L'ERP AKPBF applique un modèle gradué de rôles où chaque statut dispose d'un niveau de préséance logique codé sous forme d'une constante entière, interdisant structuralement aux rôles de niveau inférieur de transiter ou de requérir des actions de niveau supérieur :

```
             NIVEAU 20 : SUPER_ADMIN (Autorité Totale et Purges de Logs)
                                  │
                                  ▼
                NIVEAU 10 : ADMINISTRATEUR (Gestion du Staff)
                                  │
                                  ▼
               NIVEAU 5 : SUPERVISEUR (Opérations de Logistique)
                                  │
                                  ▼
                NIVEAU 4 : COMPTABLE (Émission et Cycles Fiscaux)
                                  │
                                  ▼
                NIVEAU 3 : CAISSIER (Prélèvements et Saisies)
                                  │
                                  ▼
         NIVEAU 2 : AGENT & CHAUFFEUR (Tournées et validations RFID)
                                  │
                                  ▼
              NIVEAU 1 : CLIENT (Profil Citoyen et Lecture Simple)
```

---

## 2. MODALITÉS D'APPLICATION ET MIDDLEWARES CLEFS

Deux points de filtration stratégiques au niveau de la passerelle d'API Express garantissent l'étanchéité de la sécurité :

### A. Middleware `RbacMiddleware.requireRole(requiredRole)`
*   **Fonction :** Évalue la réclamations (*claim*) `role` encapsulée dans le jeton JWT décrypté de la requête reçue.
*   **Contrôle mathématique :** 
    $$\text{Niveau Utilisateur} < \text{Niveau Requis} \implies \text{HTTP 403 Forbidden}$$
*   **Résultat :** Si un `CAISSIER` (Niveau 3) tente de déclencher un cycle global de facturation de redevance (exigeant le Niveau 4 de Comptable), la requête est immédiatement avortée avec le code d’erreur spécifique `INSUFFICIENT_ROLE_LEVEL`.

### B. Middleware `RbacMiddleware.requireSelfOrCorporate`
*   **Problématique :** Comment autoriser un citoyen à consulter ses propres factures tout en l'empêchant de consulter les factures d'un tiers, sans pour autant bloquer la lecture globale par les auditeurs comptables de la société ?
*   **Résolution :** Ce filtre vérifie :
    1.  Si le rôle est corporatif (Administrateur, Superviseur, Comptable) -> Accès autorisé.
    2.  Sinon, si l'ID d'abonné (`subscriberId`) extrait du JWT concorde à 100% avec l'identifiant demandé en paramètre de requête -> Accès autorisé.
    3.  Sinon -> Rejet immédial.

---

## 3. AUDIT DES PUSH-ACTIONS DE PRODUCTION VS GUEST ACCÈS

*   **Création d’Abonné Public (LandingPage Guest Mode) :**
    *   Le point de terminaison `POST /api/erp/subscribers` est le **seul** accessible de manière publique (sans JWT) pour permettre aux citoyens d'Abidjan de s'auto-onboarder.
    *   Toutefois, le payload ne permet d'attribuer aucun rôle. La requête passe dans `ErpEngine.onboardClient` qui configure impérativement l’abonnement en statut standard et affecte le rôle strict de `CLIENT` sans passe-droit.
*   **Mise à jour d'Abonné :**
    *   `PUT /api/erp/subscribers/:id` requiert le jeton JWT. Si le rôle demandeur est `CLIENT`, il ne peut modifier que ses propres coordonnées physiques, tandis qu'un `COMPTABLE` ou `ADMINISTRATEUR` peut éditer les statuts financiers.

---

## 4. RECOMMANDATIONS DE PROTECTION CONTRE L'ESCALADE DE PRIVILÈGES

1.  **Vérification de payload de création :** Garantir que les fiches d’utilisateurs administratifs créées par `POST /api/auth` d'administration exigent d'évaluer si l'opérateur en cours d'action possède un niveau strictement supérieur au rôle qu'il tente de configurer (un administrateur de niveau 10 ne doit pas pouvoir créer un Super Admin de niveau 20).
2.  **Immutabilité des Rôles en Modification :** Bloquer les modifications de rôles via les points de profil simples de l'utilisateur.
