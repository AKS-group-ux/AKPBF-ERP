import { jsPDF } from 'jspdf';

export async function generateContractPdf(contractData: any): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Watermark
  doc.setTextColor(240, 243, 241);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('OFFICIEL AKPBF MUNICIPAL', 25, 130, { angle: 30 });
  doc.text('CONTRAT CADRE SÉCURISÉ', 15, 180, { angle: 30 });

  doc.setTextColor(30, 41, 59);

  // Republic headings
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("RÉPUBLIQUE DE CÔTE D'IVOIRE", 15, 12);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text("Union - Discipline - Travail", 15, 15);
  doc.text("MINISTÈRE DE L'ASSAINISSEMENT", 15, 18);
  doc.text("ET DE LA SALUBRITÉ PUBLIQUE", 15, 21);

  // System details
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text("AKPBF ERP", pageWidth - 48, 14);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("SERVICES DE SALUBRITÉ COMMUNALE", pageWidth - 62, 17.5);
  doc.text("DISTRICT AUTONOME D'ABIDJAN", pageWidth - 54, 21);

  // Separator line
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1);
  doc.line(15, 25, pageWidth - 15, 25);

  // Title block
  doc.setFillColor(30, 41, 59);
  doc.rect(15, 30, pageWidth - 30, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text("CONTRAT CADRE DE SALUBRITÉ EN CONCESSION COMMUNALE", pageWidth / 2, 37, { align: 'center' });
  doc.setTextColor(248, 250, 252);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`CONTRAT_N_ : ${contractData.id || contractData.contractNumber || 'N/A'}`, pageWidth / 2, 42, { align: 'center' });

  // Details boxes
  doc.setTextColor(30, 41, 59);
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 49, pageWidth / 2 - 18, 48, 'F');
  doc.rect(pageWidth / 2 + 3, 49, pageWidth / 2 - 18, 48, 'F');

  // Left: Subscriber Info
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.text("INFORMATIONS DE L'ABONNÉ", 18, 54);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Nom Complet: ${contractData.subscriberName || contractData.name || 'Inconnu'}`, 18, 60);
  doc.text(`Identifiant Unique: ${contractData.subscriberId || contractData.id || 'N/A'}`, 18, 65);
  doc.text(`Téléphone: ${contractData.subscriberPhone || contractData.phone || 'N/A'}`, 18, 70);
  doc.text(`Email: ${contractData.subscriberEmail || contractData.email || 'N/A'}`, 18, 75);
  doc.text(`Adresse: ${contractData.address || 'Riviera, Abidjan'}`, 18, 80);
  doc.text(`Commune: Abidjan, Côte d'Ivoire`, 18, 85);

  // Right: Contract Details
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.text("DÉTAILS ADMINISTRATIFS", pageWidth / 2 + 6, 54);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Date de Début: ${contractData.startDate || '01/01/2026'}`, pageWidth / 2 + 6, 60);
  doc.text(`Date de Fin: ${contractData.endDate || '31/12/2026'}`, pageWidth / 2 + 6, 65);
  doc.text(`Statut Administratif: ACTIF ET SIGNÉ`, pageWidth / 2 + 6, 70);
  doc.text(`Type d'Abonnement: ${contractData.planName || contractData.plan?.name || 'Forfait standard résidentiel'}`, pageWidth / 2 + 6, 75);
  doc.text(`Redevance Mensuelle: ${(contractData.amount || contractData.price || 5000).toLocaleString()} FCFA`, pageWidth / 2 + 6, 80);
  doc.text(`Agent Signataire: Services Techniques Mairie`, pageWidth / 2 + 6, 85);

  // Services
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("LIGNES DE SERVICES ET CLAUSES CONTRACTUELLES", 15, 104);

  doc.setFillColor(241, 245, 249);
  doc.rect(15, 108, pageWidth - 30, 8, 'F');
  doc.setFontSize(7);
  doc.text("DÉSIGNATION DES ENGAGEMENTS", 20, 113);
  doc.text("PÉRIODE / FRÉQUENCE", 110, 113);
  doc.text("MONTANT (FCFA)", pageWidth - 20, 113, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.line(15, 116, pageWidth - 15, 116);

  const line1 = `Service d'enlèvement régulier des bacs (${contractData.planName || 'Forfait Standard'})`;
  const amount = contractData.amount || contractData.price || 5000;
  doc.text(line1, 20, 122);
  doc.text("Mensuel (Récurrent)", 110, 122);
  doc.text(amount.toLocaleString(), pageWidth - 20, 122, { align: 'right' });
  doc.line(15, 126, pageWidth - 15, 126);

  doc.text("Frais de dossier, d'administration & fourniture de la puce d'identification", 20, 131);
  doc.text("Annuel / Fixe", 110, 131);
  doc.text("0 (Compris)", pageWidth - 20, 131, { align: 'right' });
  doc.line(15, 135, pageWidth - 15, 135);

  // Total
  doc.setFillColor(248, 250, 252);
  doc.rect(pageWidth - 75, 140, 60, 12, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("REDEVANCE BASE :", pageWidth - 70, 147.5);
  doc.setFontSize(9.5);
  doc.setTextColor(16, 185, 129);
  doc.text(`${amount.toLocaleString()} FCFA`, pageWidth - 20, 147.5, { align: 'right' });

  // Legal notice clauses
  doc.setTextColor(100, 116, 139);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  const legalText = contractData.termsAndConditions || "Le présent contrat engage l'abonné au règlement ponctuel de sa redevance. La mairie de Cocody / district d'Abidjan s'engage à l'exécution convenue des ramassages municipaux. Tout défaut de paiement entraîne une suspension des services sous un préavis de 72h avec astreinte réglementaire de recouvrement directe.";
  const lines = doc.splitTextToSize(legalText, pageWidth - 30);
  doc.text(lines, 15, 162);

  // Signature framework
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, 182, pageWidth / 2 - 18, 30);
  doc.rect(pageWidth / 2 + 3, 182, pageWidth / 2 - 18, 30);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(7.5);
  doc.text("SIGNATURE DE L'ACQUÉREUR", 18, 187);
  doc.text("LE CONCÉDANT (MUNICIPALITÉ)", pageWidth / 2 + 6, 187);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text("[SIGNÉ ÉLECTRONIQUEMENT]", 18, 194);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Nom: ${contractData.subscriberName || contractData.name || 'Abonné Concessionnaire'}`, 18, 198);
  doc.text(`Date de signature: ${contractData.signatureDate || new Date().toLocaleDateString()}`, 18, 202);
  doc.text(`Adresse IP: 196.47.228.109 (Vérifié)`, 18, 206);

  doc.text("Mairie d'Abidjan - Cocody", pageWidth / 2 + 6, 194);
  doc.text(`Le Maire de Cocody & Services Techniques`, pageWidth / 2 + 6, 198);
  doc.setTextColor(16, 185, 129);
  doc.setFont('Helvetica', 'bold');
  doc.text("CONTRAT ACTIF ET CERTIFIÉ", pageWidth / 2 + 6, 204);
  doc.text("VALIDITÉ COMPTABLE SÉCURISÉE", pageWidth / 2 + 6, 208);

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text("AL-KAÏDA PRESTATIONS - BUREAUX & FACTURATION (AKPBF) - SYSTÈME ERP SÉCURISÉ MULTI-ZONES", 15, pageHeight - 11);
  doc.text("Document numérique certifié conforme aux réglementations d'hygiène de l'Union Économique et Monétaire Ouest-Africaine (UEMOA).", 15, pageHeight - 8);

  const binaryString = doc.output();
  return Buffer.from(binaryString, 'binary');
}
