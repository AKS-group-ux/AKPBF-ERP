import { jsPDF } from 'jspdf';

export interface PdfDocumentData {
  type: 'contract' | 'invoice' | 'receipt' | 'attestation';
  data: any;
}

export function generateAndDownloadPdf(type: 'contract' | 'invoice' | 'receipt' | 'attestation', data: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Helper lines
  const drawHeaderLine = (y: number, color: [number, number, number] = [16, 185, 129]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(1);
    doc.line(15, y, pageWidth - 15, y);
  };

  const drawFooterLine = (y: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, y, pageWidth - 15, y);
  };

  // Watermark text in the background
  doc.setTextColor(240, 243, 241);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('OFFICIEL AKPBF MUNICIPAL', 25, 130, { angle: 30 });
  doc.text('VALIDE & SIGNÉ NUMÉRIQUEMENT', 15, 180, { angle: 30 });

  // Reset text color
  doc.setTextColor(30, 41, 59);

  // 1. REPUBLIQUE GOVT HEADINGS
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("RÉPUBLIQUE DE CÔTE D'IVOIRE", 15, 12);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text("Union - Discipline - Travail", 15, 15);
  doc.text("MINISTÈRE DE L'ASSAINISSEMENT", 15, 18);
  doc.text("ET DE LA SALUBRITÉ PUBLIQUE", 15, 21);

  // Logo text or badge on right
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129); // Emerald-500
  doc.text("AKPBF ERP", pageWidth - 48, 14);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("SERVICES DE SALUBRITÉ COMMUNALE", pageWidth - 62, 17.5);
  doc.text("DISTRICT AUTONOME D'ABIDJAN", pageWidth - 54, 21);

  drawHeaderLine(25);

  // 2. SPECIFIC TITLE BLOCK
  let docTitle = "";
  let docRef = "";
  let targetFileName = "Document_AKPBF.pdf";

  if (type === 'contract') {
    docTitle = "CONTRAT CADRE DE SALUBRITÉ EN CONCESSION COMMUNALE";
    docRef = `CONTRAT_N° : ${data.contractNumber || data.id || 'N/A'}`;
    targetFileName = `AKPBF_Contrat_${data.contractNumber || data.id || 'export'}.pdf`;
  } else if (type === 'invoice') {
    docTitle = "TITRE DE RECETTE COMMUNAL - FACTURE DE REDEVANCE";
    docRef = `FACTURE_N° : ${data.id || 'N/A'}`;
    targetFileName = `AKPBF_Facture_${data.id || 'export'}.pdf`;
  } else if (type === 'receipt') {
    docTitle = "REÇU D'ACQUITTEMENT FISCAL ET DE PAIMENT SALUBRITÉ";
    docRef = `REÇU_N° : ${data.paymentRef || data.id || 'N/A'}`;
    targetFileName = `AKPBF_Recu_${data.paymentRef || data.id || 'export'}.pdf`;
  } else {
    docTitle = "ATTESTATION DE CONFORMATION AUX RÈGLEMENTS DE SALUBRITÉ";
    docRef = `RÉF_N° : ATT-${Math.floor(Date.now() / 10000)}`;
    targetFileName = `AKPBF_Attestation_${data.id || 'export'}.pdf`;
  }

  // Draw Title Area
  doc.setFillColor(30, 41, 59); // Slate-800 background
  doc.rect(15, 30, pageWidth - 30, 15, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(docTitle, pageWidth / 2, 37, { align: 'center' });
  
  doc.setTextColor(248, 250, 252);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(docRef, pageWidth / 2, 42, { align: 'center' });

  // Restore client color
  doc.setTextColor(30, 41, 59);

  // 3. SUBSCRIBER & GENERAL DETAILS
  doc.setFillColor(248, 250, 252); // Soft Gray bg
  doc.rect(15, 49, pageWidth / 2 - 18, 48, 'F');
  doc.rect(pageWidth / 2 + 3, 49, pageWidth / 2 - 18, 48, 'F');

  // Subscriber box - Left
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.text("INFORMATIONS DE L'ABONNÉ", 18, 54);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Nom Complet: ${data.subscriberName || data.name || 'Inconnu'}`, 18, 60);
  doc.text(`Identifiant Unique: ${data.subscriberId || data.id || 'N/A'}`, 18, 65);
  doc.text(`Téléphone: ${data.subscriberPhone || data.phone || 'N/A'}`, 18, 70);
  doc.text(`Email: ${data.subscriberEmail || data.email || 'N/A'}`, 18, 75);
  doc.text(`Adresse: ${data.address || 'Riviera 3, Abidjan'}`, 18, 80);
  doc.text(`Commune: Abidjan Cocody, Côte d'Ivoire`, 18, 85);

  // Transaction metadata box - Right
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.text("DÉTAILS ADMINISTRATIFS", pageWidth / 2 + 6, 54);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  if (type === 'contract') {
    doc.text(`Date de Début: ${data.startDate || '01/01/2026'}`, pageWidth / 2 + 6, 60);
    doc.text(`Date de Fin: ${data.endDate || '31/12/2026'}`, pageWidth / 2 + 6, 65);
    doc.text(`Statut Administratif: ACTIF ET SIGNÉ`, pageWidth / 2 + 6, 70);
    doc.text(`Type d'Abonnement: ${data.planName || 'Forfait standard résidentiel'}`, pageWidth / 2 + 6, 75);
    doc.text(`Redevance Mensuelle: ${(data.amount || 0).toLocaleString()} FCFA`, pageWidth / 2 + 6, 80);
    doc.text(`Agent Signataire: Services Techniques Mairie`, pageWidth / 2 + 6, 85);
  } else if (type === 'invoice') {
    doc.text(`Période de Facturation: ${data.period || 'Mois Courant'}`, pageWidth / 2 + 6, 60);
    doc.text(`Date d'Émission: ${data.dueDate || '10/05/2026'}`, pageWidth / 2 + 6, 65);
    doc.text(`Date d'Échéance: Immédiate`, pageWidth / 2 + 6, 70);
    doc.text(`Statut du Titre: ${data.status || 'IMPAYÉ'}`, pageWidth / 2 + 6, 75);
    doc.text(`Montant Exigible: ${(data.amount || 0).toLocaleString()} FCFA`, pageWidth / 2 + 6, 80);
    doc.text(`Réf Contrat Lié: ${data.contractId || data.contractNumber || 'Contrat Cadre'}`, pageWidth / 2 + 6, 85);
  } else if (type === 'receipt') {
    doc.text(`Date d'Encaissement: ${data.paymentDate || 'N/A'}`, pageWidth / 2 + 6, 60);
    doc.text(`Facture Payée: ${data.invoiceId || 'N/A'}`, pageWidth / 2 + 6, 65);
    doc.text(`Contrat Source: ${data.contractNumber || 'N/A'}`, pageWidth / 2 + 6, 70);
    doc.text(`Mode de Versement: ${data.paymentMethod || 'Mobile Money'}`, pageWidth / 2 + 6, 75);
    doc.text(`Montant Reçu: ${(data.amountPaid || data.amount || 0).toLocaleString()} FCFA`, pageWidth / 2 + 6, 80);
    doc.text(`Référence d'Opération: ${data.paymentRef || 'N/A'}`, pageWidth / 2 + 6, 85);
  } else {
    doc.text(`Date de Génération: ${new Date().toLocaleDateString()}`, pageWidth / 2 + 6, 60);
    doc.text(`Statut Conformité: CONFORME AUX DIRECTIVES`, pageWidth / 2 + 6, 65);
    doc.text(`Organisme Émetteur: Direction de l'Environnement`, pageWidth / 2 + 6, 70);
    doc.text(`Validité de Pièce: Année fiscale 2026`, pageWidth / 2 + 6, 75);
  }

  // 4. MAIN DETAILS LIST TABLE
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("LIGNES DE SERVICES ET CALCUL DE REDEVANCES", 15, 104);

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 108, pageWidth - 30, 8, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.text("DÉSIGNATION DES PRESTATIONS", 20, 113);
  doc.text("PÉRIODE / FRÉQUENCE", 110, 113);
  doc.text("MONTANT (FCFA)", pageWidth - 20, 113, { align: 'right' });

  // Rows Background
  doc.setFont('Helvetica', 'normal');
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 116, pageWidth - 15, 116);

  let firstLineName = "";
  let secondLineName = "";
  let totalAmount = 0;
  let periodStr = "";

  if (type === 'contract') {
    firstLineName = `Service d'enlèvement régulier des bacs (${data.planName || 'Forfait standard'})`;
    secondLineName = "Assistance administrative & Traitement d'avis municipaux";
    totalAmount = data.amount || 4500;
    periodStr = "Mensuel (Récurrent)";
  } else if (type === 'invoice') {
    firstLineName = `Collecte de déchets municipaux connectée par RFID`;
    secondLineName = "Planification de flotte verte par GPS & Frais techniques d'alertes";
    totalAmount = data.amount || 4500;
    periodStr = data.period || "Mensuel";
  } else if (type === 'receipt') {
    firstLineName = `Règlement de la facture de redevance ${data.invoiceId || 'N/A'}`;
    secondLineName = "Télétransmission de reçu de voirie instantané certifié";
    totalAmount = data.amountPaid || data.amount || 4500;
    periodStr = data.paymentDate || "Mensuel";
  } else {
    firstLineName = "Conformité d'assainissement régulier d'Abidjan Cocody";
    secondLineName = "Frais administratifs de visite technique d'hygiène";
    totalAmount = 5000;
    periodStr = "Annuel";
  }

  // Draw Row 1
  doc.text(firstLineName, 20, 122);
  doc.text(periodStr, 110, 122);
  doc.text(totalAmount.toLocaleString(), pageWidth - 20, 122, { align: 'right' });
  doc.line(15, 126, pageWidth - 15, 126);

  // Draw Row 2
  doc.text(secondLineName, 20, 131);
  doc.text("Frais Inclus", 110, 131);
  doc.text("0 (Compris)", pageWidth - 20, 131, { align: 'right' });
  doc.line(15, 135, pageWidth - 15, 135);

  // Total amount block
  doc.setFillColor(248, 250, 252);
  doc.rect(pageWidth - 75, 140, 60, 12, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("NET À PAYER :", pageWidth - 70, 147.5);
  doc.setFontSize(9.5);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(`${totalAmount.toLocaleString()} FCFA`, pageWidth - 20, 147.5, { align: 'right' });
  doc.setTextColor(30, 41, 59);

  // 5. LEGAL NOTICE & COMMUNE DISCLAIMER
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text("DISPOSITIONS LÉGALES ET DISPOSITIONS GÉNÉRALES", 15, 160);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  
  const legalText = type === 'contract' 
    ? (data.termsAndConditions || "Le présent contrat engage l'abonné au règlement ponctuel de sa redevance. La mairie d'Abidjan s'engage à l'exécution convenue des ramassages municipaux. Tout défaut de paiement entraîne une suspension des services sous un préavis de 72h avec astreinte réglementaire.")
    : "La présente facture municipale constitue un titre de recette officiel exécutoire à Côte d'Ivoire. Le versement doit être exécuté de façon sécurisée par Mobile Money (Orange, MTN, Wave) ou virement. Tout retard entraîne l'indexation de pénalités selon le barème des impôts directs d'Abidjan.";
  
  const splitLegalText = doc.splitTextToSize(legalText, pageWidth - 30);
  doc.text(splitLegalText, 15, 164);

  // Signature Blocks
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, 182, pageWidth / 2 - 18, 30);
  doc.rect(pageWidth / 2 + 3, 182, pageWidth / 2 - 18, 30);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(7.5);
  doc.text("SIGNATURE DE L'ACQUÉREUR", 18, 187);
  doc.text("LE CONCÉDANT (MUNICIPALITÉ)", pageWidth / 2 + 6, 187);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  
  if (type === 'contract' && data.signatureDate) {
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Blue signature text
    doc.text(`[SIGNÉ ÉLECTRONIQUEMENT]`, 18, 194);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Nom: ${data.subscriberName}`, 18, 198);
    doc.text(`Date de signature: ${data.signatureDate}`, 18, 202);
    doc.text(`Adresse IP: 196.47.228.109 (Vérifié)`, 18, 206);
  } else if (type === 'receipt') {
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Green text
    doc.text(`[FACTURE ACQUITTEE]`, 18, 194);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Opération: Mobile Money`, 18, 198);
    doc.text(`Date de paiement: ${data.paymentDate || 'N/A'}`, 18, 202);
    doc.text(`Réf Transaction: ${data.paymentRef}`, 18, 206);
  } else {
    doc.text("Signature et cachet du citoyen", 18, 194);
    doc.text("portant acceptation des clauses", 18, 198);
    doc.text("du règlement d'assainissement.", 18, 202);
  }

  // Mayor stamp simulation
  doc.setTextColor(100, 116, 139);
  doc.text("Mairie d'Abidjan - Cocody", pageWidth / 2 + 6, 194);
  doc.text(`Le Maire de Cocody & Services Techniques`, pageWidth / 2 + 6, 198);
  doc.setTextColor(16, 185, 129);
  doc.setFont('Helvetica', 'bold');
  doc.text("CÉDULE DE SÉCURITÉ ACTIVE - EN ATTENTE DE VISU", pageWidth / 2 + 6, 204);
  doc.text("VALIDIÉ CERTIFIÉE PAR AKPBF SECURE", pageWidth / 2 + 6, 208);

  // Footer metadata
  drawFooterLine(pageHeight - 15);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text("AL-KAÏDA PRESTATIONS - BUREAUX & FACTURATION (AKPBF) - SYSTÈME ERP SÉCURISÉ MULTI-ZONES", 15, pageHeight - 11);
  doc.text("Document numérique certifié conforme aux réglementations d'hygiène de l'Union Économique et Monétaire Ouest-Africaine (UEMOA).", 15, pageHeight - 8);

  // Trigger Save File
  doc.save(targetFileName);
}
