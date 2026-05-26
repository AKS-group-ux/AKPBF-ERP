import { jsPDF } from 'jspdf';

export async function generateReceiptPdf(receiptData: any): Promise<Buffer> {
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
  doc.text('FACTURE ACQUITTEE ET LIQUIDÉE', 15, 180, { angle: 30 });

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
  doc.text("REÇU D'ACQUITTEMENT FISCAL ET DE PAIEMENT SALUBRITÉ", pageWidth / 2, 37, { align: 'center' });
  doc.setTextColor(248, 250, 252);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`REÇU_N_ : ${receiptData.paymentRef || receiptData.id || 'N/A'}`, pageWidth / 2, 42, { align: 'center' });

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
  doc.text(`Nom Complet: ${receiptData.subscriberName || receiptData.name || 'Citoyen Contribuable'}`, 18, 60);
  doc.text(`Identifiant Unique: ${receiptData.subscriberId || receiptData.customerId || 'N/A'}`, 18, 65);
  doc.text(`Téléphone: ${receiptData.subscriberPhone || receiptData.phone || '+225'}`, 18, 70);
  doc.text(`Email: ${receiptData.subscriberEmail || receiptData.email || 'N/A'}`, 18, 75);
  doc.text(`Adresse: ${receiptData.address || 'Abidjan, Côte d\'Ivoire'}`, 18, 80);
  doc.text(`Commune: Abidjan, Côte d'Ivoire`, 18, 85);

  // Right: Receipt Metadata
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.text("DÉTAILS ADMINISTRATIFS", pageWidth / 2 + 6, 54);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Date d'Encaissement: ${receiptData.paymentDate || 'À l\'instant'}`, pageWidth / 2 + 6, 60);
  doc.text(`Facture Payée: ${receiptData.invoiceId || 'N/A'}`, pageWidth / 2 + 6, 65);
  doc.text(`Mode de Versement: ${receiptData.paymentMethod || 'Mobile Money'}`, pageWidth / 2 + 6, 70);
  doc.text(`Montant Reçu: ${(receiptData.amountPaid || receiptData.amount || 0).toLocaleString()} FCFA`, pageWidth / 2 + 6, 75);
  doc.text(`Référence Transaction: ${receiptData.paymentRef || 'N/A'}`, pageWidth / 2 + 6, 80);
  doc.text(`Solde Restant: ${(receiptData.remainingBalance !== undefined ? receiptData.remainingBalance : 0).toLocaleString()} FCFA`, pageWidth / 2 + 6, 85);

  // Services
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("LIGNES RÉGULARISÉES EN LOGISTIQUE DE SALUBRITÉ", 15, 104);

  doc.setFillColor(241, 245, 249);
  doc.rect(15, 108, pageWidth - 30, 8, 'F');
  doc.setFontSize(7);
  doc.text("DÉSIGNATION DES PRESTATIONS", 20, 113);
  doc.text("PÉRIODE / FRÉQUENCE", 110, 113);
  doc.text("MONTANT (FCFA)", pageWidth - 20, 113, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.line(15, 116, pageWidth - 15, 116);

  const line1 = `Apurement complet de la facture de redevance ${receiptData.invoiceId || 'Mois Courant'}`;
  const amount = receiptData.amountPaid || receiptData.amount || 5000;
  doc.text(line1, 20, 122);
  doc.text("Période Fiscale", 110, 122);
  doc.text(amount.toLocaleString(), pageWidth - 20, 122, { align: 'right' });
  doc.line(15, 126, pageWidth - 15, 126);

  doc.text("Frais de télétransmission de quittance en temps réel par SMS / WhatsApp", 20, 131);
  doc.text("Transactionnel", 110, 131);
  doc.text("0 (Compris)", pageWidth - 20, 131, { align: 'right' });
  doc.line(15, 135, pageWidth - 15, 135);

  // Total
  doc.setFillColor(248, 250, 252);
  doc.rect(pageWidth - 75, 140, 60, 12, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("TOTAL APURÉ :", pageWidth - 70, 147.5);
  doc.setFontSize(9.5);
  doc.setTextColor(16, 185, 129);
  doc.text(`${amount.toLocaleString()} FCFA`, pageWidth - 20, 147.5, { align: 'right' });

  // Legal Notice
  doc.setTextColor(100, 116, 139);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  const termsText = "La présente quittance de paiement atteste de l'acquittement de votre redevance de salubrité et éteint définitivement la dette relative au titre de recette concerné. Conservez ce reçu pour tout contrôle d'hygiène publique par les inspecteurs agréés.";
  const lines = doc.splitTextToSize(termsText, pageWidth - 30);
  doc.text(lines, 15, 162);

  // Signature Blocks
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, 182, pageWidth / 2 - 18, 30);
  doc.rect(pageWidth / 2 + 3, 182, pageWidth / 2 - 18, 30);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(7.5);
  doc.text("SIGNATURE DU CONTRIBUABLE", 18, 187);
  doc.text("LE SECRÉTARIAT GÉNÉRAL (AKPBF)", pageWidth / 2 + 6, 187);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text("[FACTURE COMPLÈTEMENT ACQUITTÉE]", 18, 194);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Canal: ${receiptData.paymentMethod || 'Mobile Money'}`, 18, 199);
  doc.text(`Référence: ${receiptData.paymentRef || 'N/A'}`, 18, 204);

  doc.text("Mairie d'Abidjan Cocody / AKPBF-Secure", pageWidth / 2 + 6, 194);
  doc.text("Télésignature certifiée de caisse active", pageWidth / 2 + 6, 199);
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text("EMMANUEL ABY - CONTRÔLEUR EN CHEF", pageWidth / 2 + 6, 205);

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text("AL-KAÏDA PRESTATIONS - BUREAUX & FACTURATION (AKPBF) - SYSTÈME ERP SÉCURISÉ MULTI-ZONES", 15, pageHeight - 11);
  doc.text("Document certifié conforme aux réglementations d'hygiène de l'Union Économique et Monétaire Ouest-Africaine (UEMOA).", 15, pageHeight - 8);

  const binaryString = doc.output();
  return Buffer.from(binaryString, 'binary');
}
