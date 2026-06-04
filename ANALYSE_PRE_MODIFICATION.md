# Rapport d'Analyse Pré-Modification - ERP AKPBF Abidjan

Ce rapport présente l'analyse structurelle, fonctionnelle et ergonomique du système existant avant l'implémentation des optimisations demandées.

---

## 1. Analyse des Formulaires d'Inscription (`RegisterPage.tsx`)
- **Structure de la page d'inscription** : C'est une page standalone avec validation d'emails, format de téléphones ivoiriens (`+225`), choix de forfait et de module de bac d'assainissement (Standard 240L, Bac Grand 360L, Conteneur 1100L).
- **Problème d'alignement ergonomique du Quartier** :
  - L'icône de géolocalisation (`MapPin`) est positionnée en absolute (`absolute left-3.5 top-1/2 -translate-y-1/2`) au même niveau qu'un `<select>` utilisant la classe `appearance-none`. 
  - Puisque le `<select>` contient un texte personnalisé et n'a pas à l'heure actuelle d'indicateur visuel propre (icône de sélection/chevron), le centrage du texte et de l'icône présente des risques de chevauchement sur les différentes tailles d'écran (mobile, tablette, desktop), créant un asynchronisme avec le champ Téléphone voisin.

---

## 2. Analyse du Système de Géolocalisation
- **État actuel** : Lors de l'inscription via `RegisterPage.tsx`, les latitudes et longitudes du nouvel abonné sont simulées avec une répartition aléatoire autour d’Abidjan (`lat: 5.3489 + ...`, `lng: -3.9995 + ...`).
- **Limitation** : L'adresse géographique est entrée sous forme de chaîne de caractères libre. L'inscription n'offre pas d'interface cartographique visuelle pour épingler précisément l'emplacement du bac, ce qui rend les tournées des chauffeurs imprécises et dépendantes de descriptions textuelles parfois floues.

---

## 3. Analyse du Module Client & Contacts (`SubscribersView.tsx` / `SubscriberDetailView.tsx`)
- **Fiche client** : Permet de consulter le profil complet d'un abonné (nom, téléphone, adresse, quartier, coordonnées GPS, niveau de bac simulé).
- **Redirection vers le détail** : Le panneau de détails `SubscriberDetailView.tsx` a été raccordé au state central (`selectedSubDetailId` dans `App.tsx`) permettant d'ouvrir un dossier citoyen individualisé de manière extrêmement élégante avec les réclamations et l'historique financier complet.

---

## 4. Analyse du Module Paiements & Modèles Financiers (`BillingView.tsx` / `PaymentsView.tsx`)
- **Structure de facturation** : 
  - Une facture (`Invoice`) est attachée à une période mensuelle (ex: `Mai 2026`), possède un montant (ex: 5000 FCFA selon le forfait standard) et un statut (`paid`, `pending` ou `overdue`).
  - Un reçu de paiement (`PaymentReceipt`) matérialise l'encaissement d'une facture spécifique, stockant le mode de règlement, le montant payé et la signature électronique scellée.
- **Limitation du système actuel** : Les paiements sont appréhendés facture par facture ou via un formulaire d'encaissement rapide, mais il n'existe pas de visualisation chronologique annuelle exhaustive et simple pour le travail des agents de terrain en charge de l'encaissement porte-à-porte.

---

## 5. Analyse du Rôle "Agent de Recouvrement" (`AGENT_RECOUVREMENT`)
- **Permissions et Filtrage** :
  - L'Agent de Recouvrement n'a accès qu'aux sections clés pour sa mission de recouvrement : Tableau de Bord, Liste des Abonnés, Encaissement Rapide, Facturation/Caisse, Paiements et Gestion des Impayés.
  - Le système intègre déjà un filtrage intelligent par zone assignée (`assignedZones` du compte utilisateur connecté). Seuls les abonnés des quartiers dont l'agent est responsable sont affichés.
- **Besoin d'adaptation mobile** : Ce rôle étant déployé sur le terrain en contact direct avec les citoyens d'Abidjan, toute l'ergonomie doit être optimisée mobile-first de manière fluide pour l'utilisation tactile à une main sous un climat ensoleillé en voirie.

---

## 6. Analyse des Dashboards Existants (`DashboardView.tsx`)
- **Métriques existantes** : Conçues pour les administrateurs et comptables municipaux, elles affichent des KPIs globaux tels que le total collecté, le volume de déchets, le parc de véhicules, des cartes mondiales d'emplacements et d'audits comptables.
- **Optimisation requise** : L'Agent de Recouvrement a besoin de KPIs plus opérationnels (sommaire journalier des encaissements sur le terrain, liste des "Top retards" prioritaires, état général des impayés sur sa zone géographique attribuée).

---

## 7. Modèles de Données Liés aux Abonnements & Factures
- Interface `Subscriber` : Contient l'état global du client et ses coordonnées GPS (`lat`, `lng`).
- Interface `Invoice` : Contient `period`, `amount`, `status`, `paidDate` et `subscriberId`.
- Interface `PaymentReceipt` : Contient les détails du règlement rattaché à une facture.
- **Stratégie d'extension sans régression** : Conserver ces interfaces d'origine en ajoutant des helpers dynamiques ou des extensions d'attributs de manière à offrir une rétrocompatibilité complète avec le code de facturation existant.
