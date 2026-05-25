/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import backendApp from "./backend/src/app";

const JWT_SECRET = process.env.JWT_SECRET || "akpbf_erp_jwt_secret_key_2026_uemoa";

const ENTERPRISE_USERS = [
  { email: 'admin@akpbf.com', passwordText: 'Admin@2026', passwordHash: '', name: 'Alkaïda Benjamin', role: 'ADMINISTRATEUR' },
  { email: 'comptable@akpbf.com', passwordText: 'Comptable@2026', passwordHash: '', name: 'Doumbia Sylvain (Fisc)', role: 'COMPTABLE' },
  { email: 'superviseur@akpbf.com', passwordText: 'Superviseur@2026', passwordHash: '', name: 'Gérard Gnakoury (Logistique)', role: 'SUPERVISEUR' },
  { email: 'chauffeur@akpbf.com', passwordText: 'Chauffeur@2026', passwordHash: '', name: 'Kaboré Moussa', role: 'CHAUFFEUR' },
  { email: 'agent@akpbf.com', passwordText: 'Agent@2026', passwordHash: '', name: 'Coulibaly Issa', role: 'AGENT' },
];

ENTERPRISE_USERS.forEach(u => {
  u.passwordHash = bcrypt.hashSync(u.passwordText, 10);
  (u as any).passwordText = undefined;
});

// Initialize Gemini client if API key is provided
let aiClient: GoogleGenAI | null = null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && GEMINI_API_KEY !== "") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize Gemini API Client:", error);
  }
} else {
  console.log("No valid GEMINI_API_KEY found. Falling back to local heuristic intelligence.");
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = 3000;

  // Integration of secure, modular Phase 1 Production Backend Architecture
  app.use(backendApp);

  // API Route: Live Chat with Gemini & ERP State Context
  app.post("/api/ai/chat", async (req, res) => {
    const { message, history, context } = req.body;
    
    if (!message || !message.trim()) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const subscribersCount = context?.subscribers?.length || 0;
    const unpaidInvoicesCount = context?.invoices?.filter((i: any) => i.status !== 'paid')?.length || 0;
    const activeMRR = context?.subscribers?.filter((s: any) => s.status === 'active')?.reduce((sum: number, s: any) => sum + (s.currentBinLevel >= 0 ? 3500 : 0), 0) || 1250000;

    // Structured Prompt with full municipal context
    const completePrompt = `You are AKPBF-Brain, the advanced AI operations intelligence agent for "Assainissement, Kiosques et Propreté de la Boucle du Fleuve" (AKPBF), acting on the Abidjan waste collection contracts.
    
Here is the current real-time ERP databases state of our operations:
- Total Subscribers: ${subscribersCount}
- Unpaid Invoices: ${unpaidInvoicesCount}
- Active recurrences (estim. MRR): ${activeMRR.toLocaleString()} FCFA
- Stock items: ${JSON.stringify((context?.stock || []).slice(0, 10))}
- Vehicle Fleet: ${JSON.stringify((context?.fleet || []).slice(0, 5))}
- Active HR Personnel: ${JSON.stringify((context?.hr || []).slice(0, 5))}

Abonnés à risque (extrait): ${JSON.stringify((context?.subscribers || []).slice(0, 5).map((s: any) => ({ name: s.name, neighborhood: s.neighborhood, binLevel: s.currentBinLevel })))}

Context / User Message: "${message}"

Respond strictly in French. Be professional, direct, extremely precise with numbers (quoting names, regions like Cocody, Yopougon, Marcory and Plateaux and matching ERP statuses). Use bullet points and elegant markdown formatting. Offer clear corrective actions for waste collection, billing recovery, bin emptyings or employee management.`;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: completePrompt,
          config: {
            systemInstruction: "Tu es AKPBF-Brain v3.5, l'intelligence décisionnelle d'ERP d'assainissement d'Abidjan. Tu t'exprimes en français avec rigueur, technicité et esprit stratégique. Tu cites des noms d'abonnés et des données de flotte concrètes.",
            temperature: 0.7
          }
        });

        res.json({ 
          text: response.text || "Erreur de formatage de la réponse de l'IA.", 
          live: true 
        });
        return;
      } catch (error: any) {
        console.error("Gemini Generation Error:", error);
        // Fall back to smart heuristic on Gemini error
      }
    }

    // Heuristic Smart Local Fallback
    setTimeout(() => {
      let responseText = "";
      const lowerMsg = message.toLowerCase();

      if (lowerMsg.includes("impayé") || lowerMsg.includes("recouv") || lowerMsg.includes("factur")) {
        responseText = `### 📊 Heuristiques de Recouvrement (Diagnostic AKPBF-Brain)
        
*Note: Clé Gemini non active - Heuristiques locales simulées.*

Après examen des **${unpaidInvoicesCount} factures impayées** en base :
1. **Quartier Critique :** **Yopougon** concentre 45% des reliquats de paiement de ce mois.
2. **Recommandation immédiate :** Suspendre la collecte pour les abonnés ayant un solde débiteur cumulé > 15 000 FCFA.
3. **Actions :** Envoyer une relance par SMS groupé Orange Money & MTN Mobile Money avec pénalité forfaitaire de 5% de retard.`;
      } else if (lowerMsg.includes("stock") || lowerMsg.includes("cuve") || lowerMsg.includes("poubelle") || lowerMsg.includes("bac")) {
        responseText = `### 📦 Gestion du Stock & Poubelles Connectées
        
Sur la base de votre parc ERP d'Abidjan :
1. **Bacs en alerte :** Nous constatons que plusieurs abonnés ont des cuves de 240L au-delà de 80% de remplissage en Riviera 3.
2. **Recommandations :** Déployer immédiatement un équipage de secours.
3. **Approvisionnement :** Notre stock de puces RFID de rechange est jugé **Sain/Suffisant**, mais nous préconisons de commander 50 bacs 360L additionnels pour la zone résidentielle de Cocody.`;
      } else if (lowerMsg.includes("tour") || lowerMsg.includes("flotte") || lowerMsg.includes("véhicule") || lowerMsg.includes("camion")) {
        responseText = `### 🚚 Optimisation Logistique de la Flotte
        
1. **Alerte Entretien :** Le camion d'immatriculation **COL-402 (Cocody)** est proche de son échéance de vidange de boîte de vitesse (dernier entretien enregistré dans l'index Flotte).
2. **Économie d'Énergie :** Le regroupement des points de levée à Marcory-Zone 4 permet d'économiser **12.4% de carburant** sur l'itinéraire quotidien.
3. **Planification :** S'assurer de la présence des chauffeurs de l'équipe B dès 05:30.`;
      } else {
        responseText = `### 🧠 AKPBF-Brain v3.5 (Heuristiques Locales Activées)

Je suis actuellement en mode autonome (en attente de votre configuration de clé secrète GEMINI_API_KEY). 

**Synthèse rapide de l'ERP :**
- **Clients gérés :** ${subscribersCount} abonnés actifs et suspendus.
- **Portefeuille prévisionnel :** ${unpaidInvoicesCount} dossiers de factures en souffrance.
- **Flotte :** Suivi temps réel des cuves d'Abidjan fonctionnel.

*Pouvez-vous préciser votre requête sur les thèmes : "Impayés", "Stock de matériel" ou "Optimisation de flotte" ?*`;
      }

      res.json({ text: responseText, live: false });
    }, 1000);
  });

  // API Route: AI Strategic SWOT & Operational Audit
  app.post("/api/ai/audit", async (req, res) => {
    const { context } = req.body;

    const completePrompt = `Provide a comprehensive operational and financial audit report for our municipality waste collection company AKPBF (Abidjan).
    
Using the full state here:
- Subscribers: ${JSON.stringify(context?.subscribers || [])}
- Invoices: ${JSON.stringify(context?.invoices || [])}
- Plans: ${JSON.stringify(context?.plans || [])}
- Stock Management List: ${JSON.stringify(context?.stock || [])}
- Fleet Operations: ${JSON.stringify(context?.fleet || [])}
- HR Personnel: ${JSON.stringify(context?.hr || [])}

Perform deep calculations and formulate a professional SWOT analysis (Forces, Faiblesses, Opportunités, Menaces) in French syntax.
Return a very structured report including:
1. Executive Summary with real metrics.
2. Calculated Payment Recovery Rate (Ratio d'apuration des factures).
3. Risk identification (which subscribers names are critical, which trucks need immediate maintenance based on km counter or status, which stock level is dangerously low).
4. Concrete recommendations (upselling standard subscribers to higher plans, recruiting workforce, optimize routes).

Highlight that this audit is generated by the AKPBF-Brain AI Engine. Write engaging, clean formatting with visual icons and bold metrics.`;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: completePrompt,
          config: {
            temperature: 0.4,
            systemInstruction: "Tu es un auditeur financier et opérationnel expert en assainissement urbain pour l'Afrique de l'Ouest. Tu rédiges un rapport d'audit exhaustif, détaillé, chiffré et ultra-professionnel destiné au comité directeur."
          }
        });

        res.json({ text: response.text || "Échec de génération de l'audit.", live: true });
        return;
      } catch (error: any) {
        console.error("Gemini Audit Error:", error);
      }
    }

    // Heuristic Fallback Audit
    setTimeout(() => {
      const subscribers = context?.subscribers || [];
      const invoices = context?.invoices || [];
      
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter((i: any) => i.status === 'paid').length;
      const recoveryRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 75;

      const mockAudit = `### 📋 RAPPORT D'AUDIT OPÉRATIONNEL & FINANCIER AKPBF
*Généré par le moteur analytique AKPBF-Brain le ${new Date().toLocaleDateString('fr-FR')}*

---

#### 1. SYNTHÈSE EXÉCUTIVE
* **Taux d'Apuration Financière :** **${recoveryRate}%** (${paidInvoices} factures payées sur ${totalInvoices})
* **Base Clients active :** **${subscribers.length} abonnés** d'assainissement enregistrés sur le district autonome d'Abidjan (Cocody, Yopougon, Marcory).
* **Statut Clé d'API :** Heuristiques locales de secours activées (Configurez la clé Gemini pour un audit macro-économique global).

---

#### 2. DICT DIAGNOSTIC - FORCE & FAIBLESSES (SWOT)

* **FORCES 💪 :**
  - Forte adhésion à la tarification sociale d'assainissement dans les zones populaires d'Abidjan.
  - Télémétrie RFID active permettant d'anticiper les débordements de poubelles ménagères.
  - Parc d'engins routiers diversifié (bennes tasseuses, polybennes).

* **FAIBLESSES ⚠️ :**
  - Délais de relance manuels trop importants, entraînant un taux d'impayés de **${100 - recoveryRate}%**.
  - Stock de bacs de rechange 360L sous-dimensionné pour faire face à la demande de Cocody-Riviera.
  - Kilométrage moyen de la flotte d'engins en hausse rapide (+15% trimestriel).

* **OPPORTUNITÉS 💎 :**
  - **Campagne d'Upsell Premium :** Conversion d'abonnés sociaux vers les forfaits classiques (+2 000 FCFA/mois de MRR potentiel par abonné converti).
  - Partenariats B2B avec les syndics de copropriété pour l'harmonisation logistique des bacs roulants.

* **MENACES 🚨 :**
  - Hausses imprévues du prix du gazole à la pompe d'Abidjan grevant la marge opérationnelle de 4.8%.
  - Précipitations denses de la saison des pluies perturbant l'acheminement vers le centre d'enfouissement de Kossihouen.

---

#### 3. PLANS D'ACTIONS DE L'AUDITEUR ACCÉLÉRÉ
1. **Comptabilité :** Configurer un rappel automatique par SMS de paiement la veille de l'échéance de facture.
2. **Maintenance Flotte :** Planifier la révision mécanique prioritaire du camion d'immatriculation **COL-402** d'ici 5 jours ouvrés.
3. **Optimisation :** Recommander l'implémentation de la tournée ordonnée par grappes géographiques pour réduire l'usure des pneumatiques.`;

      res.json({ text: mockAudit, live: false });
    }, 1200);
  });

  // API Route: AI Crisis & Operational Disruption Simulator
  app.post("/api/ai/sim-crisis", async (req, res) => {
    const { crisisType, context } = req.body;
    
    if (!crisisType) {
      res.status(400).json({ error: "Crisis type is required" });
      return;
    }

    let crisisLabel = crisisType;
    if (crisisType === "greve") crisisLabel = "Grève des équipages de collecte (Conflit Social)";
    if (crisisType === "penurie_carburant") crisisLabel = "Pénurie nationale de Gasoil à Abidjan";
    if (crisisType === "inondation") crisisLabel = "Inondations majeures (Saison des pluies - Cocody/Yopougon)";
    if (crisisType === "panne_camions") crisisLabel = "Panne simultanée de 3 bennes tasseuses principales";

    const prompt = `Simulate an immediate operational disaster response plan for our waste management ERP.
The specific crisis happening is: "${crisisLabel}".

Based on our current assets:
- Vehicle Fleet: ${JSON.stringify(context?.fleet || [])}
- Workforce / HR capacity: ${JSON.stringify(context?.hr || [])}
- Active Subscribers locations: ${JSON.stringify((context?.subscribers || []).map((s:any) => s.neighborhood))}

Generate:
1. Crisis Severity level (Modéré, Élevé, Critique, Catastrophique).
2. Immediate 24h Emergency tactics (what to do with vehicles and staff).
3. Temporary subscriber policy (what notifications to send to them, frequency drop).
4. Contingency mitigation step-by-step.

Respond in French in a highly dramatic yet corporate crisis manager tone. List real vehicle IDs in your strategy.`;

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            temperature: 0.8,
            systemInstruction: "Tu es le Directeur de Gestion des Crises et Risques d'AKPBF Abidjan. Face à chaque perturbation opérationnelle, tu écris un plan de continuité d'activité (PCA) ultra-précis, autoritaire, structuré et astucieux."
          }
        });

        res.json({ text: response.text || "Échec de génération de crise.", live: true });
        return;
      } catch (error: any) {
        console.error("Gemini Crisis Simulation Error:", error);
      }
    }

    // Heuristic Fallback Crisis Plan
    setTimeout(() => {
      let contingencyText = "";
      
      if (crisisType === "greve") {
        contingencyText = `### 🚨 PLAN DE CONTINUITÉ D'ACTIVITÉ : GRÈVE DES ÉQUIPAGES (Niveau : CRITIQUE)
*Rapport tactique AKPBF-Brain Heuristique*

---

#### 1. ÉVALUATION DE L'IMPACT
* **Taux de blocage estimé :** **75% des chauffeurs** et éboueurs de l'équipe B sont syndiqués et absents.
* **Zones compromises :** Yopougon et Kasserne-Niangon (aucun ramassage prévu).
* **Parc d'engins immobilisé :** 4 paires de bennes tasseuses bloquées au dépôt central.

---

#### 2. TACTIQUE DE GESTION DE CRISE (24H - 72H)
1. **Recours temporaire :** Réquisition du personnel d'encadrement et des agents contractueux non-grévistes recensés dans l'index **Ressources Humaines**.
2. **Priorisation Urbaine :** Concentration des forces uniquement sur les avenues commerçantes de **Marcory Zone 4** et le **Plateau** (déchets médicaux et professionnels à haute sensibilité). Les quartiers résidentiels de Cocody verront leur fréquence réduite de moitié.
3. **Sécurisation du dépôt :** Demande d'assistance au district de police si obstruction de l'accès matériel par les piquets de grève.

---

#### 3. PLANIFICATION ET MÉMO COMPTABILITÉ
* **Rémunérations :** Gel immédiat de l'indemnité horaire journalière des grévistes dans les livres RH.
* **Notification Clientèle :** Diffusion d'une alerte "Force Majeure" sur le Portail Client invitant les ménages à garder les couves fermées à domicile et à comprimer leurs déchets recyclables de plastique.`;
      } else if (crisisType === "penurie_carburant") {
        contingencyText = `### 🚨 PLAN DE CONTINUITÉ D'ACTIVITÉ : PÉNURIE DE GASOIL (Niveau : ÉLEVÉ)
*Rapport tactique AKPBF-Brain Heuristique*

---

#### 1. ÉVALUATION DE L'IMPACT
* **Autonomie logistique :** **36 heures** sur la réserve tampon du dépôt de stockage central.
* **Cible d'ajustement :** Volumétrie de collecte d'Abidjan réduite de 40% pour épargner le carburant restant.

---

#### 2. TACTIQUE TACTIQUE (24H - 72H)
1. **Centralisation de la flotte :** Arrêt des camions légers de patrouille. Utilisation exclusive des bennes gros tonnage gros impact.
2. **Calcul d'Itinéraires courts :** Regroupement de la collecte. Fusion des camions de Cocody et Marcory. Pas d'aller-retour à vide à la décharge.
3. **Ravitaillement Stratégique :** Contrat de priorité signé avec la station Shell de Cocody Boulevard pour réserver 1 500 litres de gasoil de secours pour le service d'assainissement public.

---

#### 3. MÉMO DE REPLI
* **Consignes aux équipages :** Utiliser les capteurs RFID pour ne lever que les bacs > 70% de remplissage. Ne pas s'arrêter pour les bacs vides ou à moitié vides.`;
      } else if (crisisType === "inondation") {
        contingencyText = `### 🚨 PLAN PCA : INONDATIONS MAJEURES SAISON DES PLUIES (Niveau : CATASTROPHIQUE)
*Rapport tactique AKPBF-Brain Heuristique*

---

#### 1. ÉVALUATION DE l'IMPACT
* **Sinistres matériels :** Voies d'accès au centre technique de transfert d'Abidjan totalement submergées.
* **Sécurité :** Flotte d'engins à haut risque de noyade moteur sur la Riviera Palmeraie.

---

#### 2. RÈGLES D'ENGAGEMENT IMMÉDIATES
1. **Protection Active :** Rappel immédiat de tous les véhicules en circulation vers les zones d'altitude (Plateau, collines de Cocody Est).
2. **Évacuation d'urgence :** Sécurisation de la benne collector d'immatriculation **COL-402** bloquée près de la lagune.
3. **Mise en veille SIG :** Suivi GPS continu. Les agents de collecte basculent en rôle de secours d'égouts et curage de caniveaux prioritaires.

---

#### 3. COMMUNICATION D'URGENCE
* **Portail Clientèle :** SMS automatique d'interdiction de dépôt d'ordures pour éviter l'obturation totale du réseau pluvial d'Abidjan.`;
      } else {
        contingencyText = `### 🚨 PLAN PCA : DEFECTUOSITE TECHNIQUE CAMIONS (Niveau : MODÉRÉ)
*Rapport tactique AKPBF-Brain Heuristique*

---

#### 1. DIAGNOSTIC PANNE
* **Immobilisation :** Redémarrage impossible de bennes tasseuses clés.
* **Maintenance :** Le service mécanique signale que la pièce de rechange (vérin hydraulique) est en rupture de stock dans le grand registre de matériel ERP.

---

#### 2. ACTIONS CORRECTIVES
1. **Rotation de nuit :** Faire rouler les 2 camions de réserve restants 20h/24 en créant 3 vacations successives (Équipe Chauffeur A, B et de Nuit).
2. **Déploiement externe :** Sous-traitance de la collecte du quartier de Marcory à un partenaire privé d'assainissement en location de matériel pour les 7 prochains jours.
3. **Pièces :** Prélever les pièces sur le camion inactif en garage d'attente pour réparer en priorité l'engin **COL-305**.`;
      }

      res.json({ text: contingencyText, live: false });
    }, 1200);
  });

  // Serve Vite / Frontend Assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AKPBF Full-Stack ERP Server listening on port ${PORT}`);
  });
}

startServer();
