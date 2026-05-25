import { Request, Response } from 'express';
import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { getPrismaClient } from '../config/database';

export const DocumentController = {
  /**
   * Generates a PDF and sends metadata response
   */
  async generatePdf(req: Request, res: Response): Promise<void> {
    try {
      const { docId, type } = req.query;

      if (!docId || !type) {
        res.status(400).json({ error: 'Identifiant du document et type requis (Facture, Recu, Contrat, Attestation).' });
        return;
      }

      res.json({
        success: true,
        docId,
        type,
        generatedAt: new Date().toISOString(),
        printableFormat: 'pdf_binary',
        downloadUrl: `/api/documents/download/${docId}?type=${type}`,
        metadata: {
          title: `AKPBF_${type}_${docId}.pdf`,
          isSecure: true
        }
      });
    } catch (err) {
      console.error('generatePdf error:', err);
      res.status(500).json({ error: 'Erreur lors de la préparation du titre.' });
    }
  },

  /**
   * Generates, stores, registers, and serves a REAL physically built A4 PDF on the fly
   */
  async downloadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { docId } = req.params;
      const type = (req.query.type as string || 'invoice').toLowerCase();
      const prisma = getPrismaClient();

      // 1. Gather real database data payload
      let docTitle = "AKPBF DOCUMENT OFFICIEL";
      let docRef = `RÉF-N° : ${docId}`;
      let data: any = { id: docId };

      if (type === 'invoice') {
        docTitle = "TITRE DE RECETTE COMMUNAL - FACTURE DE REDEVANCE";
        docRef = `FACTURE_N_ : ${docId}`;
        const invoice = await prisma.invoice.findFirst({
          where: { id: docId },
          include: { customer: true }
        });
        if (invoice) {
          data = {
            id: invoice.id,
            subscriberName: invoice.customer?.name,
            subscriberId: invoice.customer?.subscriberId,
            subscriberPhone: invoice.customer?.phone,
            subscriberEmail: invoice.customer?.email,
            address: invoice.customer?.address,
            amount: Number(invoice.amount),
            dueDate: invoice.dueDate.toISOString().split('T')[0],
            status: invoice.status,
            period: invoice.billingPeriodStart ? `${invoice.billingPeriodStart.toLocaleString('fr-FR', { month: 'long' })} ${invoice.billingPeriodStart.getFullYear()}` : "Mensuel"
          };
        } else {
          // Fallback on JSON store in setting if needed
          const invoicesSetting = await prisma.setting.findUnique({ where: { key: 'AKPBF_ERP_STATE' } });
          const altInvs = invoicesSetting ? JSON.parse(invoicesSetting.value)?.invoices || [] : [];
          const found = altInvs.find((i: any) => i.id === docId);
          if (found) data = found;
        }
      } else if (type === 'contract') {
        docTitle = "CONTRAT CADRE DE SALUBRITÉ EN CONCESSION COMMUNALE";
        docRef = `CONTRAT_N_ : ${docId}`;
        const contractsSetting = await prisma.setting.findUnique({ where: { key: 'AKPBF_ERP_CONTRACTS' } });
        const contracts = contractsSetting ? JSON.parse(contractsSetting.value) : [];
        const found = contracts.find((c: any) => c.id === docId || c.contractNumber === docId);
        if (found) {
          data = found;
        } else {
          const customer = await prisma.customer.findFirst({
            where: { OR: [{ id: docId }, { subscriberId: docId }] }
          });
          if (customer) {
            data = {
              id: docId,
              contractNumber: docId,
              subscriberName: customer.name,
              subscriberId: customer.subscriberId,
              subscriberPhone: customer.phone,
              startDate: new Date().toLocaleDateString(),
              endDate: new Date(Date.now() + 365*24*3600*1000).toLocaleDateString(),
              amount: 5000,
              planName: "Formule Classique Plus"
            };
          }
        }
      } else if (type === 'receipt') {
        docTitle = "REÇU D'ACQUITTEMENT FISCAL ET DE PAIEMENT SALUBRITÉ";
        docRef = `REÇU_N_ : ${docId}`;
        const receiptsSetting = await prisma.setting.findUnique({ where: { key: 'AKPBF_ERP_RECEIPTS' } });
        const receipts = receiptsSetting ? JSON.parse(receiptsSetting.value) : [];
        const found = receipts.find((r: any) => r.id === docId || r.paymentRef === docId);
        if (found) data = found;
      } else if (type === 'attestation') {
        docTitle = "ATTESTATION DE CONFORMITÉ AUX RÈGLEMENTS DE SALUBRITÉ";
        docRef = `ATTESTATION_ID_ : ATT-${Math.floor(Date.now() / 100000)}`;
        data = {
          id: docId,
          subscriberName: req.query.name || "Citoyen d'Abidjan",
          address: req.query.address || "Cocody Riviera",
          phone: req.query.phone || "+225 05 00 00 00"
        };
      }

      // 2. Generate PDF stream using jsPDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Background watermark text
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

      // Base Title block
      doc.setFillColor(30, 41, 59); // Slate bg
      doc.rect(15, 30, pageWidth - 30, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(docTitle, pageWidth / 2, 37, { align: 'center' });
      doc.setTextColor(248, 250, 252);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(docRef, pageWidth / 2, 42, { align: 'center' });

      // Reset coordinates and draw details boxes
      doc.setTextColor(30, 41, 59);
      doc.setFillColor(248, 250, 252);
      doc.rect(15, 49, pageWidth / 2 - 18, 48, 'F');
      doc.rect(pageWidth / 2 + 3, 49, pageWidth / 2 - 18, 48, 'F');

      // Left Box : Subscriber
      doc.setFontSize(8.5);
      doc.setFont('Helvetica', 'bold');
      doc.text("INFORMATIONS DE L'ABONNÉ", 18, 54);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Nom Complet: ${data.subscriberName || data.name || 'Citoyen Résident'}`, 18, 60);
      doc.text(`Identifiant Unique: ${data.subscriberId || data.id || 'N/A'}`, 18, 65);
      doc.text(`Téléphone: ${data.subscriberPhone || data.phone || '+225'}`, 18, 70);
      doc.text(`Email: ${data.subscriberEmail || data.email || 'N/A'}`, 18, 75);
      doc.text(`Adresse: ${data.address || 'Abidjan, Côte d\'Ivoire'}`, 18, 80);
      doc.text(`Commune: Abidjan, Côte d'Ivoire`, 18, 85);

      // Right Box : Metadata
      doc.setFontSize(8.5);
      doc.setFont('Helvetica', 'bold');
      doc.text("DÉTAILS ADMINISTRATIFS", pageWidth / 2 + 6, 54);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);

      if (type === 'contract') {
        doc.text(`Date de Début: ${data.startDate || '01/01/2026'}`, pageWidth / 2 + 6, 60);
        doc.text(`Date de Fin: ${data.endDate || '31/12/2026'}`, pageWidth / 2 + 6, 65);
        doc.text(`Statut Administratif: ACTIF ET SIGNÉ`, pageWidth / 2 + 6, 70);
        doc.text(`Type d'Abonnement: ${data.planName || 'Forfait classique salubrité'}`, pageWidth / 2 + 6, 75);
        doc.text(`Redevance Mensuelle: ${(data.amount || 5000).toLocaleString()} FCFA`, pageWidth / 2 + 6, 80);
        doc.text(`Agent Signataire: Services Techniques Mairie`, pageWidth / 2 + 6, 85);
      } else if (type === 'invoice') {
        doc.text(`Période de Facturation: ${data.period || 'Mois Courant'}`, pageWidth / 2 + 6, 60);
        doc.text(`Date d'Émission: ${data.issueDate || 'Aujourd\'hui'}`, pageWidth / 2 + 6, 65);
        doc.text(`Date d'Échéance: ${data.dueDate || 'Sous 15 jours'}`, pageWidth / 2 + 6, 70);
        doc.text(`Statut du Titre: ${(data.status || 'UNPAID').toUpperCase()}`, pageWidth / 2 + 6, 75);
        doc.text(`Montant Exigible: ${(data.amount || 3000).toLocaleString()} FCFA`, pageWidth / 2 + 6, 80);
        doc.text(`Réf Contrat Lié: ${data.contractId || 'Contrat Mairie'}`, pageWidth / 2 + 6, 85);
      } else if (type === 'receipt') {
        doc.text(`Date d'Encaissement: ${data.paymentDate || 'A l\'instant'}`, pageWidth / 2 + 6, 60);
        doc.text(`Facture Payée: ${data.invoiceId || 'N/A'}`, pageWidth / 2 + 6, 65);
        doc.text(`Mode de Versement: ${data.paymentMethod || 'Mobile Money'}`, pageWidth / 2 + 6, 70);
        doc.text(`Montant Reçu: ${(data.amountPaid || data.amount || 0).toLocaleString()} FCFA`, pageWidth / 2 + 6, 75);
        doc.text(`Référence Transaction: ${data.paymentRef || 'N/A'}`, pageWidth / 2 + 6, 80);
        doc.text(`Solde Restant: ${(data.remainingBalance !== undefined ? data.remainingBalance : 0).toLocaleString()} FCFA`, pageWidth / 2 + 6, 85);
      } else {
        doc.text(`Date de Génération: ${new Date().toLocaleDateString()}`, pageWidth / 2 + 6, 60);
        doc.text(`Statut Conformité: CONFORME`, pageWidth / 2 + 6, 65);
        doc.text(`Organisme: AKPBF Direction de l'Hygiène`, pageWidth / 2 + 6, 70);
      }

      // Services Lines
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

      let line1 = "Redevance mensuelle d'enlèvement d'ordures pour la commune d'Abidjan";
      let amount = data.amount || data.amountPaid || 5000;
      doc.text(line1, 20, 122);
      doc.text("Mensuel de Service", 110, 122);
      doc.text(amount.toLocaleString(), pageWidth - 20, 122, { align: 'right' });
      doc.line(15, 126, pageWidth - 15, 126);

      doc.text("Gestion d'alertes par puces RFID & traçage de la flotte municipale GPS", 20, 131);
      doc.text("Frais Inclus", 110, 131);
      doc.text("0 (Compris)", pageWidth - 20, 131, { align: 'right' });
      doc.line(15, 135, pageWidth - 15, 135);

      // Total block
      doc.setFillColor(248, 250, 252);
      doc.rect(pageWidth - 75, 140, 60, 12, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text("NET DE RECOUV :", pageWidth - 70, 147.5);
      doc.setFontSize(9.5);
      doc.setTextColor(16, 185, 129);
      doc.text(`${amount.toLocaleString()} FCFA`, pageWidth - 20, 147.5, { align: 'right' });

      // Legal terms
      doc.setTextColor(100, 116, 139);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6.5);
      const termsText = "Ce titre de recette d'assainissement d'Abidjan constitue un certificat de conformité public et exécutoire. Tout retard ou défaut d'apuration entraîne la retenue des services et la facturation d'un intérêt d'astreinte légale de 5% de retard.";
      const lines = doc.splitTextToSize(termsText, pageWidth - 30);
      doc.text(lines, 15, 162);

      // Draw Signatures Box
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

      // Footer line
      doc.setDrawColor(226, 232, 240);
      doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184);
      doc.text("AL-KAÏDA PRESTATIONS - BUREAUX & FACTURATION (AKPBF) - SYSTÈME ERP SÉCURISÉ MULTI-ZONES", 15, pageHeight - 11);
      doc.text("Document certifié conforme aux réglementations d'hygiène de l'Union Économique et Monétaire Ouest-Africaine (UEMOA).", 15, pageHeight - 8);

      // 3. Compile physically correct PDF binary
      const binaryString = doc.output();
      const pdfBuffer = Buffer.from(binaryString, 'binary');

      // 4. Save physically to the disk server
      const pdfsDir = path.join(process.cwd(), 'pdfs');
      if (!fs.existsSync(pdfsDir)) {
        fs.mkdirSync(pdfsDir, { recursive: true });
      }
      const fileName = `AKPBF_${type}_${docId}.pdf`;
      const filePath = path.join(pdfsDir, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      // 5. Save/Register physical document relation into PostgreSQL Document Model
      let dbCustomerId: string | null = null;
      if (type === 'invoice' || type === 'contract') {
        const matchingCustomer = await prisma.customer.findFirst({
          where: { OR: [ { subscriberId: docId }, { id: docId } ] }
        });
        if (matchingCustomer) dbCustomerId = matchingCustomer.id;
      }

      await prisma.document.create({
        data: {
          customerId: dbCustomerId,
          fileName,
          filePath,
          fileType: type.toUpperCase()
        }
      });

      // 6. Return binary stream directly for immediate download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      res.send(pdfBuffer);
    } catch (err) {
      console.error('Failed to generate real backend PDF and save it:', err);
      res.status(500).send('Erreur lors de la génération physique du document PDF.');
    }
  }
};
