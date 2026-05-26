# Rapport de Migration et d'Architecture PDF - AKPBF ERP

Ce rapport documente la réorganisation complète et la stabilisation des processus de génération d'édition et d'impression des documents officiels de l'ERP AKPBF.

---

## 1. OBJECTIPS DE LA MIGRATION
L'objectif principal était de bannir l'intégralité de la génération PDF côté client (frontend), qui était instable, gourmande en ressources et non sécurisée, au profit d'une **source unique de vérité souveraine résidant exclusivement sur le backend de l'ERP**.

### Avantages Majeurs de la Nouvelle Architecture :
1.  **Souverainté & Sécurité :** Aucun document officiel ne peut être contrefait localement sur le frontend. Tout document provient d'un flux d'octets binaire authentifié issu de la base PostgreSQL du serveur.
2.  **Performance Accrue :** Le navigateur client n'a plus à compiler et dessiner des fichiers binaires lourds via Canvas, éliminant les lenteurs sur mobile.
3.  **Présentation Professionnelle Unifiée :** Les documents sont normalisés sur le serveur avec des gabarits géométriques précis (A4 Portrait), des filigranes officiels et des signatures numériques certifiées.
4.  **Impression Stable :** Bannissement des impressions aléatoires `window.print()` au profit d'une génération PDF backend nette et d'un traitement d'impression propre par iframe invisible unifié.

---

## 2. MODIFICATIONS APPORTÉES ET CARTOGRAPHIE TECHNIQUE

### A. Remplacement des Services et Pruning de Code Client
*   **Destruction de `src/utils/pdfGenerator.ts` :** L'ancien utilitaire client de 300 lignes a été supprimé afin d'éteindre tout moteur de dessin local.
*   **Création de `/src/services/documentService.ts` :** Unifié sur le client pour gérer :
    1.  `downloadPdf(type, id)` : Télécharge le blob binaire officiel depuis le serveur municipal et déclenche l'écriture de fichier locale.
    2.  `getPdfBlobUrl(type, id)` : Produit instantanément des URI de blobs sécurisées pour le chargement d'iframe d'aperçu de haute-fidélité.
    3.  `printPdf(type, id)` : Télécharge et imprime proprement via un processus d'iframe masqué pour éviter tout distorsion HTML de la page hôte.

### B. Standardisation et Centralisation de la Génération Backend
Création d'une structure de sous-services hautement modulaire dans `backend/src/services/pdf/` :
*   `invoicePdf.ts` : Génération du document **Titre de Recette Communal** (Factures de redevance, indices RFID, etc.).
*   `contractPdf.ts` : Production numérique du **Contrat Cadre de Salubrité et d'Assainissement**.
*   `receiptPdf.ts` : Création des **Reçus fiscaux d'Acquittement** sécurisés, intégrant les données du versement Mobile Money.
*   `reportPdf.ts` : Gabarit analytique universel de bilans de recouvrement pour les Commissaires aux comptes.
*   `pdfService.ts` : Routeur centralisé fédérant les demandes de génération vers le bon constructeur de rendu.

### C. Normalisation des API et Routes Associées
Configuration des endpoints normalisés dans `/backend/src/routes/apiRoutes.ts` de façon RESTful :
*   `GET /api/documents/invoice/:id/pdf`
*   `GET /api/documents/contract/:id/pdf`
*   `GET /api/documents/receipt/:id/pdf`
*   `GET /api/documents/report/:id/pdf`

---

## 3. IMPACTS ET VALIDATION EN PRODUCTION
1.  **Zéro Type Écarté :** Le linter `tsc --noEmit` a validé l'intégralité du code révisé avec **0 avertissement, 0 erreur de type**.
2.  **Compilation Complète :** Le build complexe de production (`compile_applet`) s'est compilé avec succès.
3.  **Expérience Utilisateur Stable :** L'aperçu HTML de fidélité au sein du portail citoyen a été préservé pour un rendu instantané, tandis que les fonctions de téléchargement et d'impression tirent parti du flux sécurisé binaire backend.
