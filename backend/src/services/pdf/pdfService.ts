import { generateInvoicePdf } from './invoicePdf';
import { generateContractPdf } from './contractPdf';
import { generateReceiptPdf } from './receiptPdf';
import { generateReportPdf } from './reportPdf';

export const PdfService = {
  async generateDocument(type: string, data: any): Promise<Buffer> {
    const normalizedType = type.toLowerCase();
    switch (normalizedType) {
      case 'invoice':
      case 'facture':
        return await generateInvoicePdf(data);
      case 'contract':
      case 'contrat':
        return await generateContractPdf(data);
      case 'receipt':
      case 'recu':
        return await generateReceiptPdf(data);
      case 'report':
      case 'rapport':
      case 'attestation':
        return await generateReportPdf(data);
      default:
        throw new Error(`Type de document non pris en charge pour la génération PDF : ${type}`);
    }
  }
};
