# Audit de l'Architecture PDF - AKPBF ERP

Ce document répertorie tous les composants, utilitaires et bibliothèques de génération de PDF, ainsi que les points d'impression et de téléchargement de documents de l'ERP AKPBF.

---

## 1. CARTOGRAPHIE DES COMPOSANTS ET SERVICES CONCERNÉS

### A. Fichiers de service et d'extraction de fichiers

#### 1. `src/utils/pdfGenerator.ts`
*   **Rôle :** Générateur de documents PDF côté client. Utilise `jsPDF` pour dessiner les contours géométriques, placer le filigrane (Watermark), remplir les informations d'un abonné/contrat/facture et déclencher le téléchargement direct sur le navigateur.
*   **Couche :** Frontend.
*   **Statut d’utilisation :** Utilisé par `ClientPortalView.tsx` et `ContractsView.tsx`.
*   **Action :** **À SUPPRIMER**. Toute cette logique de dessin et de manipulation de coordonnées A4 de `jsPDF` doit être bannie du frontend pour être logée exclusivement sur le backend.

#### 2. `backend/src/controllers/documentController.ts`
*   **Rôle :** Gère la génération à la volée des documents, l'écriture physique dans un dossier `/pdfs` du serveur, l'enregistrement dans la table `document` de PostgreSQL via Prisma, et le renvoi d'un flux binaire `application/pdf`.
*   **Couche :** Backend (Express).
*   **Statut d’utilisation :** Utilisé via les points de terminaison `/api/documents/download/:docId` et `/api/documents/generate`.
*   **Action :** **À CONSERVER ET À RÉFACTORISER**. Toute la logique de génération doit être externalisée dans un répertoire de domaines de services de calcul (`backend/src/services/pdf/`) pour unifier la maintenance.

---

### B. Composants d'interface utilisateur (Views)

#### 1. `src/components/ClientPortalView.tsx`
*   **Rôle :** Vue portail citoyen pour régler des factures et télécharger ses documents officiels.
*   **Couche :** Frontend.
*   **Usages PDF :** Déclenche `generateAndDownloadPdf` lors de clics sur "Télécharger" ou "Imprimer" dans le volet d'aperçu de documents.
*   **Action :** **À CONSERVER ET MODIFIER**. Remplacer la génération par l'appel à la nouvelle logique `documentService.downloadPdf()`.

#### 2. `src/components/ContractsView.tsx`
*   **Rôle :** Consultation, validation de fiches d'abonnement et signature électronique de contrats municipaux.
*   **Couche :** Frontend.
*   **Usages PDF :** Invoque `generateAndDownloadPdf` lors du clic sur les actions d'impression ou de téléchargement d'un contrat signé.
*   **Action :** **À CONSERVER ET MODIFIER**. Supprimer l'import de l'ancien générateur client et déléguer au backend direct.

#### 3. `src/components/QuickPaymentView.tsx`
*   **Rôle :** Vue de caisse d'enregistrement de règlements rapides de factures.
*   **Couche :** Frontend.
*   **Usages PDF :** Télécharge ou imprime des reçus d'acquittement en interrogeant directement l'API de téléchargement backend `/api/documents/download/...` via un iframe masqué.
*   **Action :** **À CONSERVER**. L'utilisation du lien de téléchargement backend via une iframe d'impression est déjà une excellente pratique. Nous la consoliderons avec nos nouveaux endpoints normalisés.

#### 4. `src/components/PaymentsView.tsx`
*   **Rôle :** Suivi des encaissements d'Abidjan.
*   **Couche :** Frontend.
*   **Usages PDF :** Affiche une simulation d'impression avec un `alert` factice.
*   **Action :** **À CONSERVER ET MODIFIER**. Remplacer l'alerte par le téléchargement d'un reçu d'acquittement réel en backend.

#### 5. `src/components/BillingView.tsx` / `src/components/AccountingView.tsx`
*   **Rôle :** Tables analytiques financières de facturations.
*   **Couche :** Frontend.
*   **Usages PDF :** Appellent `window.print()` pour imprimer la page active complète du navigateur.
*   **Action :** **À CONSERVER ET SÉCURISER**. Nous préconisons un système de rapports analytiques générés par le backend plutôt qu'une impression `window.print` brute de page web, pour des présentations de comptes irréprochables.

---

## 2. SYNTHÈSE DES PACKAGES ET DÉPENDANCES PDF

*   **`jspdf` (Frontend) :** Enlevé de la configuration du bundle de production du frontend (aucun import ne doit subsister).
*   **`jspdf` (Backend) :** Utilisé comme le moteur de dessin binaire sur le serveur Node.js.
*   **Ressources d'Infrastructures :** Toutes les polices et marges sont normalisées en format standardisé d'impression A4 pour garantir un placement précis sans dépendre du navigateur de l'utilisateur.
