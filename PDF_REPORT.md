# Rapport d’Audit Documentaire PDF - AKPBF ERP

**Système :** Assainissement, Kiosques et Propreté de la Boucle du Fleuve (AKPBF)  
**Moteur de Rendement :** jsPDF v2 (Génération de flux au vol sur le Backend)  
**Standard Géométrique :** Format A4 (72 DPI, Marges Précises de 15mm)

---

## 1. ARCHITECTURE ET FLUX D'EXPÉDITION DES PDF

L'ERP AKPBF a mis de côté l'ancien modèle de rendu de document purement côté navigateur (*Client-Side Rendering*) pour des impératifs d'intégrité légale et de sécurité informatique. Tous les documents officiels sont calculés de manière déterministe côté serveur :

```
             DEMANDE DE TÉLÉCHARGEMENT DE DOCUMENT IMPRIMABLE
                                    │
                                    v
     Frontend UI (Fiche d'abonné) ───────────> Appels d’API (Axios / Intercept)
                                                   │
                                                   v
                                          Route Backend d'API :
                                      /api/documents/download/:id
                                                   │
                                                   v
                      ┌──────────────────────────────────────────────────┐
                      │            DocumentController (Backend)          │
                      │                                                  │
                      │ 1. Extraction SQL Prisma (Customer, Invoice, etc)│
                      │ 2. Initialisation d'instance jsPDF unifiée       │
                      │ 3. Ajout de Filigrane officiel AKPBF (Watermark) │
                      │ 4. Ajout de Signature Électron. SHA-256 (Mono)   │
                      │ 5. Génération et Cast en Buffer d'Octets         │
                      └────────────────────────────┬─────────────────────┘
                                                   │
                                                   v
                                         Flux Binaire Pur (MIME)
                                        application/oct-stream
                                                   │
                                                   v
                                     Enregistrement Physique / Impr
```

---

## 2. TYPES DE TITRES TRAITÉS & RÈGLES DE CONDUITE

L'ERP gère quatre familles de documents légaux répondant à la réglementation municipale :

### A. Titre de Recette Communal (Facture de Redevance)
*   **Identifiant type :** `FACTURE_N_ : <docId>`
*   **Données puisées :** Montant de l'échéance nominale, période de service (ex: "Mai 2026"), nom complet du citoyen, index de quartier (Riviera, Cocody, Yopougon, Marcory) et date limite d'apurement.
*   **Particularité :** Les impayés de factures au-delà d'une période de 30 jours déclenchent sur le PDF une mention rouge d'alerte `SOUS DE MISE EN DEMEURE`.

### B. Reçu d'Acquittement Fiscal et de Paiement
*   **Identifiant type :** `REÇU_N_ : <docId>`
*   **Données puisées :** Moyen de règlement utilisé (ORANGE, MOOV, WAVE, ESPÈCES), montant du versement imputé, taxes et numéro de quittance.
*   **Sécurité :** Est gravé sur le document un hachage d'intégrité sous la forme `STAMP-E-` prouvant que l’opération figure bien dans le grand livre comptable.

### C. Contrat Cadre de Salubrité en Concession Communale
*   **Identifiant type :** `CONTRAT_N_ : <docId>`
*   **Données puisées :** Fiche d'abonné complet, durée d'assistance (12 mois glissants), fréquence d'enlèvement hebdomadaire et volume max de traitement d'ordures concédé par décret.

---

## 3. AUDIT DE CONTROLE TECHNIQUE DE PRODUCTION

*   **Fuites de mémoire / Performance :** L'instance `jsPDF` s'initialise et se détruit au sein de l'exécution éphémère du contrôleur Express. Aucun débordement mémoire de rétention d'instance n'a été recensé sous fortes requêtes parallèles.
*   **Filtrage des entrées de téléchargement :** Le point de terminaison `/api/documents/download/:docId` n'utilise directement aucun paramètre de chemin non assaini. Le type est converti en minuscule et validé par rapport à une liste blanche (`invoice`, `receipt`, `contract`, `attestation`) excluant les tentatives d'injection d'injection détournée de répertoires (*Path Traversal*).
*   **Lisibilité des libellés :** Le document intègre des polices à chasse fixe et polices standards robustes comme `Helvetica` pour éviter les dysfonctionnements de paquets de caractères sur les serveurs Linux dépourvus d'affichage X11 de production.
