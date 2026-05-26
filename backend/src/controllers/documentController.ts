import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getPrismaClient } from '../config/database';
import { PdfService } from '../services/pdf/pdfService';

export const DocumentController = {
  /**
   * Helper to retrieve and format invoice data
   */
  async getInvoiceData(docId: string): Promise<any> {
    const prisma = getPrismaClient();
    const invoice = await prisma.invoice.findFirst({
      where: { id: docId },
      include: { customer: true }
    });

    if (invoice) {
      return {
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
    }

    // Fallback on JSON store in settings
    const invoicesSetting = await prisma.setting.findUnique({ where: { key: 'AKPBF_ERP_STATE' } });
    const altInvs = invoicesSetting ? JSON.parse(invoicesSetting.value)?.invoices || [] : [];
    const found = altInvs.find((i: any) => i.id === docId);
    if (found) {
      return found;
    }

    // Last resort mock data for testing
    return {
      id: docId,
      subscriberName: "Koffi Jean-Jacques",
      subscriberId: "SUB-4029",
      subscriberPhone: "+225 07 48 29 10 22",
      subscriberEmail: "koffi.jj@email.com",
      address: "Rue des Jardins, Villa 14, Cocody",
      amount: 3500,
      dueDate: new Date().toISOString().split('T')[0],
      status: "UNPAID",
      period: "Mensuel"
    };
  },

  /**
   * Helper to retrieve and format contract data
   */
  async getContractData(docId: string): Promise<any> {
    const prisma = getPrismaClient();
    const contractsSetting = await prisma.setting.findUnique({ where: { key: 'AKPBF_ERP_CONTRACTS' } });
    const contracts = contractsSetting ? JSON.parse(contractsSetting.value) : [];
    const found = contracts.find((c: any) => c.id === docId || c.contractNumber === docId);
    if (found) {
      return found;
    }

    const customer = await prisma.customer.findFirst({
      where: { OR: [{ id: docId }, { subscriberId: docId }] }
    });

    if (customer) {
      return {
        id: docId,
        contractNumber: docId,
        subscriberName: customer.name,
        subscriberId: customer.subscriberId,
        subscriberPhone: customer.phone,
        subscriberEmail: customer.email,
        address: customer.address,
        startDate: new Date().toLocaleDateString('fr-FR'),
        endDate: new Date(Date.now() + 365*24*3600*1000).toLocaleDateString('fr-FR'),
        amount: 5000,
        planName: "Formule Classique Plus"
      };
    }

    // Default template contract
    return {
      id: docId,
      contractNumber: docId,
      subscriberName: "Soro Aminata",
      subscriberId: "SUB-1933",
      subscriberPhone: "+225 01 02 83 94 00",
      subscriberEmail: "aminata.soro@outlook.com",
      address: "Avenue de la République, Face BICICI, Plateau",
      startDate: new Date().toLocaleDateString('fr-FR'),
      endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toLocaleDateString('fr-FR'),
      amount: 6000,
      planName: "Famille Nombreuse Mensuel"
    };
  },

  /**
   * Helper to retrieve and format receipt data
   */
  async getReceiptData(docId: string): Promise<any> {
    const prisma = getPrismaClient();
    const receiptsSetting = await prisma.setting.findUnique({ where: { key: 'AKPBF_ERP_RECEIPTS' } });
    const receipts = receiptsSetting ? JSON.parse(receiptsSetting.value) : [];
    const found = receipts.find((r: any) => r.id === docId || r.paymentRef === docId);
    if (found) {
      return found;
    }

    // Default mock payment receipt
    return {
      id: docId,
      paymentRef: docId,
      subscriberName: "Mamadou Diallo",
      subscriberId: "SUB-8842",
      subscriberPhone: "+225 05 55 92 11 39",
      address: "Cité des Arts, Bâtiment D2, Cocody",
      invoiceId: "INV-2900",
      paymentDate: new Date().toLocaleDateString('fr-FR'),
      paymentMethod: "Orange Money",
      amountPaid: 3500,
      amount: 3500,
      remainingBalance: 0
    };
  },

  /**
   * Helper to retrieve and format report data
   */
  async getReportData(docId: string, req: Request): Promise<any> {
    return {
      id: docId,
      generatedBy: req.query.name || "Chef de Bureau Central de Salubrité",
      address: req.query.address || "Abidjan, Cocody",
      phone: req.query.phone || "+225 07 00 00 00"
    };
  },

  /**
   * GET /api/documents/invoice/:id/pdf
   */
  async getInvoicePdf(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await DocumentController.getInvoiceData(id);
      const pdfBuffer = await PdfService.generateDocument('invoice', data);

      await DocumentController.saveAndRegisterPdf(id, 'invoice', `AKPBF_invoice_${id}.pdf`, pdfBuffer);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=AKPBF_invoice_${id}.pdf`);
      res.send(pdfBuffer);
    } catch (err: any) {
      console.error('getInvoicePdf error:', err);
      res.status(500).send(`Erreur de génération de facture PDF: ${err.message}`);
    }
  },

  /**
   * GET /api/documents/contract/:id/pdf
   */
  async getContractPdf(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await DocumentController.getContractData(id);
      const pdfBuffer = await PdfService.generateDocument('contract', data);

      await DocumentController.saveAndRegisterPdf(id, 'contract', `AKPBF_contract_${id}.pdf`, pdfBuffer);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=AKPBF_contract_${id}.pdf`);
      res.send(pdfBuffer);
    } catch (err: any) {
      console.error('getContractPdf error:', err);
      res.status(500).send(`Erreur de génération de contrat PDF: ${err.message}`);
    }
  },

  /**
   * GET /api/documents/receipt/:id/pdf
   */
  async getReceiptPdf(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await DocumentController.getReceiptData(id);
      const pdfBuffer = await PdfService.generateDocument('receipt', data);

      await DocumentController.saveAndRegisterPdf(id, 'receipt', `AKPBF_receipt_${id}.pdf`, pdfBuffer);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=AKPBF_receipt_${id}.pdf`);
      res.send(pdfBuffer);
    } catch (err: any) {
      console.error('getReceiptPdf error:', err);
      res.status(500).send(`Erreur de génération de reçu PDF: ${err.message}`);
    }
  },

  /**
   * GET /api/documents/report/:id/pdf
   */
  async getReportPdf(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = await DocumentController.getReportData(id, req);
      const pdfBuffer = await PdfService.generateDocument('report', data);

      await DocumentController.saveAndRegisterPdf(id, 'report', `AKPBF_report_${id}.pdf`, pdfBuffer);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=AKPBF_report_${id}.pdf`);
      res.send(pdfBuffer);
    } catch (err: any) {
      console.error('getReportPdf error:', err);
      res.status(500).send(`Erreur de génération de rapport PDF: ${err.message}`);
    }
  },

  /**
   * Helper to write PDF physically and register in Postgres
   */
  async saveAndRegisterPdf(docId: string, type: string, fileName: string, buffer: Buffer): Promise<void> {
    try {
      const prisma = getPrismaClient();
      const pdfsDir = path.join(process.cwd(), 'pdfs');
      if (!fs.existsSync(pdfsDir)) {
        fs.mkdirSync(pdfsDir, { recursive: true });
      }
      const filePath = path.join(pdfsDir, fileName);
      fs.writeFileSync(filePath, buffer);

      let dbCustomerId: string | null = null;
      if (type === 'invoice' || type === 'contract') {
        const matchingCustomer = await prisma.customer.findFirst({
          where: { OR: [ { subscriberId: docId }, { id: docId } ] }
        });
        if (matchingCustomer) {
          dbCustomerId = matchingCustomer.id;
        }
      }

      await prisma.document.create({
        data: {
          customerId: dbCustomerId,
          fileName,
          filePath,
          fileType: type.toUpperCase()
        }
      });
    } catch (e) {
      console.warn('Logging physical PDF filing or registration warning:', e);
    }
  },

  /**
   * Legacy generator trigger API endpoint (provides download link metadata)
   */
  async generatePdf(req: Request, res: Response): Promise<void> {
    try {
      const { docId, type } = req.query;

      if (!docId || !type) {
        res.status(400).json({ error: 'Identifiant du document et type requis (Facture, Recu, Contrat, Attestation).' });
        return;
      }

      // Convert type to match /api/documents/type/docId/pdf
      const pathType = String(type).toLowerCase() === 'attestation' ? 'report' : String(type).toLowerCase();

      res.json({
        success: true,
        docId,
        type,
        generatedAt: new Date().toISOString(),
        printableFormat: 'pdf_binary',
        downloadUrl: `/api/documents/${pathType}/${docId}/pdf`,
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
   * Backward-compatible direct downloader endpoint (proxies to specialized endpoint functions)
   */
  async downloadDocument(req: Request, res: Response): Promise<void> {
    const { docId } = req.params;
    const type = (req.query.type as string || 'invoice').toLowerCase();

    // Route dynamically based on parameter
    req.params.id = docId;
    if (type === 'invoice') {
      return await DocumentController.getInvoicePdf(req, res);
    } else if (type === 'contract') {
      return await DocumentController.getContractPdf(req, res);
    } else if (type === 'receipt') {
      return await DocumentController.getReceiptPdf(req, res);
    } else {
      return await DocumentController.getReportPdf(req, res);
    }
  }
};
