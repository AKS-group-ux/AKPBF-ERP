import api from './api';

export const documentService = {
  /**
   * Action centralisée pour télécharger un document PDF physique depuis le backend
   */
  async downloadPdf(type: 'contract' | 'invoice' | 'receipt' | 'report' | 'attestation', id: string): Promise<void> {
    try {
      const apiType = type === 'attestation' ? 'report' : type;
      const url = `/documents/${apiType}/${id}/pdf`;
      
      const response = await api.get(url, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `AKPBF_${type}_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
      throw error;
    }
  },

  /**
   * Obtient l'URL d'un Blob d'aperçu pour le chargement en iframe sécurisé
   */
  async getPdfBlobUrl(type: 'contract' | 'invoice' | 'receipt' | 'report' | 'attestation', id: string): Promise<string> {
    try {
      const apiType = type === 'attestation' ? 'report' : type;
      const url = `/documents/${apiType}/${id}/pdf`;
      
      const response = await api.get(url, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      return window.URL.createObjectURL(blob);
    } catch (error) {
      console.error('Erreur lors de la récupération du blob d\'aperçu PDF:', error);
      throw error;
    }
  },

  /**
   * Imprime un document PDF en le téléchargeant sur le backend et en l'ouvrant dans une iframe masquée
   */
  async printPdf(type: 'contract' | 'invoice' | 'receipt' | 'report' | 'attestation', id: string): Promise<void> {
    try {
      const blobUrl = await this.getPdfBlobUrl(type, id);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      
      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          window.open(blobUrl, '_blank');
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'impression du PDF:', error);
      throw error;
    }
  }
};
