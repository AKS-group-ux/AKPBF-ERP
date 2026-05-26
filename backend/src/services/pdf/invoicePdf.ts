import { jsPDF } from 'jspdf';

export async function generateInvoicePdf(invoiceData: any): Promise<Buffer> {
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
  doc.text('VALIDE & SIGNÉ NUMÉRIQUEMENT', 15, 180, { angle: 30 });

  // Reset text details
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
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text("AKPBF ERP", pageWidth - 48, 14);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("SERVICES DE SALUBRITÉ COMMUNALE", pageWidth - 62, 17.5);
  doc.text("DISTRICT AUTONOME D'ABIDJAN", pageWidth - 54, 21);

  // Draw separator line
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1);
  doc.line(15, 25, pageWidth - 15, 25);

  // Title block
  doc.setFillColor(30, 41, 59); // Slate bg
  doc.rect(15, 30, pageWidth - 30, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text("TITRE DE RECETTE COMMUNAL - FACTURE DE REDEVANCE", pageWidth / 2, 37, { align: 'center' });
  doc.setTextColor(248, 250, 252);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`FACTURE_N_ : ${invoiceData.id || 'N/A'}`, pageWidth / 2, 42, { align: 'center' });

  // Box coordinates & setup
  doc.setTextColor(30, 41, 59);
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 49, pageWidth / 2 - 18, 48, 'F');
  doc.rect(pageWidth / 2 + 3, 49, pageWidth / 2 - 18, 48, 'F');

  // Left Box: Customer Info
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.text("INFORMATIONS DE L'ABONNÉ", 18, 54);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Nom Complet: ${invoiceData.subscriberName || invoiceData.name || 'Citoyen Résident'}`, 18, 60);
  doc.text(`Identifiant Unique: ${invoiceData.subscriberId || invoiceData.customerId || 'N/A'}`, 18, 65);
  doc.text(`Téléphone: ${invoiceData.subscriberPhone || invoiceData.phone || '+225'}`, 18, 70);
  doc.text(`Email: ${invoiceData.subscriberEmail || invoiceData.email || 'N/A'}`, 18, 75);
  doc.text(`Adresse: ${invoiceData.address || 'Abidjan, Côte-d\'Ivoire'}`, 18, 80);
  doc.text(`Commune: Abidjan, Côte d'Ivoire`, 18, 85);

  // Right Box: Invoice Details
  doc.setFontSize(8.5);
  doc.setFont('Helvetica', 'bold');
  doc.text("DÉTAILS ADMINISTRATIFS", pageWidth / 2 + 6, 54);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Période de Facturation: ${invoiceData.period || 'Mois Courant'}`, pageWidth / 2 + 6, 60);
  doc.text(`Date d'Émission: ${invoiceData.issueDate || 'Aujourd\'hui'}`, pageWidth / 2 + 6, 65);
  doc.text(`Date d'Échéance: ${invoiceData.dueDate || 'Sous 15 jours'}`, pageWidth / 2 + 6, 70);
  doc.text(`Statut du Titre: ${(invoiceData.status || 'UNPAID').toUpperCase()}`, pageWidth / 2 + 6, 75);
  doc.text(`Montant Exigible: ${(invoiceData.amount || 3000).toLocaleString()} FCFA`, pageWidth / 2 + 6, 80);
  doc.text(`Réf Contrat Lié: ${invoiceData.contractId || 'Contrat Mairie'}`, pageWidth / 2 + 6, 85);

  // Table Lignes des services
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("LIGNES DE PRESTATIONS ET FRAIS DE SERVICES", 15, 104);

  doc.setFillColor(241, 245, 249);
  doc.rect(15, 108, pageWidth - 30, 8, 'F');
  doc.setFontSize(7);
  doc.text("DÉSIGNATION DES PRESTATIONS", 20, 113);
  doc.text("PÉRIODE / FRÉQUENCE", 110, 113);
  doc.text("MONTANT (FCFA)", pageWidth - 20, 113, { align: 'right' });

  doc.setFont('Helvetica', 'normal');
  doc.line(15, 116, pageWidth - 15, 116);

  const line1 = "Redevance mensuelle d'enlèvement d'ordures pour la commune d'Abidjan";
  const amount = invoiceData.amount || 3000;
  doc.text(line1, 20, 122);
  doc.text("Mensuel de Service", 110, 122);
  doc.text(amount.toLocaleString(), pageWidth - 20, 122, { align: 'right' });
  doc.line(15, 126, pageWidth - 15, 126);

  doc.text("Gestion d'alertes par puces RFID & traçage de la flotte municipale GPS", 20, 131);
  doc.text("Frais Inclus", 110, 131);
  doc.text("0 (Compris)", pageWidth - 20, 131, { align: 'right' });
  doc.line(15, 135, pageWidth - 15, 135);

  // Total
  doc.setFillColor(248, 250, 252);
  doc.rect(pageWidth - 75, 140, 60, 12, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("NET DE RECOUV :", pageWidth - 70, 147.5);
  doc.setFontSize(9.5);
  doc.setTextColor(16, 185, 129);
  doc.text(`${amount.toLocaleString()} FCFA`, pageWidth - 20, 147.5, { align: 'right' });

  // Legal Notice
  doc.setTextColor(100, 116, 139);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(6.5);
  const termsText = "Ce titre de recette d'assainissement d'Abidjan constitue un certificat de conformité public et exécutoire. Tout retard ou défaut d'apuration entraîne la retenue des services et la facturation d'un intérêt d'astreinte légale de 5% de retard.";
  const lines = doc.splitTextToSize(termsText, pageWidth - 30);
  doc.text(lines, 15, 162);

  // Signatures
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, 182, pageWidth / 2 - 18, 30);
  doc.rect(pageWidth / 2 + 3, 182, pageWidth / 2 - 18, 30);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(7.5);
  doc.text("SIGNATURE DU CONCITOYEN", 18, 187);
  doc.text("LE SECRÉTARIAT GÉNÉRAL (AKPBF)", pageWidth / 2 + 6, 187);

  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text("[DOCUMENT NUMÉRIQUE INTÈGRE]", 18, 194);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Acteur: Citoyen d'Abidjan`, 18, 199);
  doc.text(`Vérifié conforme le ${new Date().toLocaleDateString()}`, 18, 204);

  doc.text("Mairie d'Abidjan Cocody / AKPBF-Secure", pageWidth / 2 + 6, 194);
  doc.text("Télésignature certifiée conforme", pageWidth / 2 + 6, 199);
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
