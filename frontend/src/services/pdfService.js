import apiClient from './api/apiClient';

class PDFService {
  /**
   * Download payment receipt PDF
   */
  static async downloadPaymentReceipt(paymentId) {
    try {
      const response = await apiClient.get(`/pdf/payment/${paymentId}/download`, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-receipt-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('Error downloading PDF receipt:', error);
      throw error;
    }
  }

  /**
   * View payment receipt PDF in new tab
   */
  static async viewPaymentReceipt(paymentId) {
    try {
      const response = await apiClient.get(`/pdf/payment/${paymentId}/view`, {
        responseType: 'blob'
      });

      // Create blob and open in new tab
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      return { success: true };
    } catch (error) {
      console.error('Error viewing PDF receipt:', error);
      throw error;
    }
  }

  /**
   * Generate and download payment receipt with loading state
   */
  static async generatePaymentReceipt(paymentId, options = {}) {
    const { action = 'download', onStart, onComplete, onError } = options;

    try {
      // Start loading
      if (onStart) onStart();

      const endpoint = action === 'view' 
        ? `/pdf/payment/${paymentId}/view`
        : `/pdf/payment/${paymentId}/download`;

      const response = await apiClient.get(endpoint, {
        responseType: 'blob'
      });

      // Handle the blob based on action
      const blob = new Blob([response.data], { type: 'application/pdf' });

      if (action === 'view') {
        // Open in new tab for viewing
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Clean up after a delay to allow PDF to load
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        // Download file
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payment-receipt-${paymentId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      if (onComplete) onComplete();
      return { success: true };

    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      if (onError) onError(error);
      throw error;
    }
  }
}

export default PDFService;
