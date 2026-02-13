const pdfService = require('../services/pdfService');
const ApiResponse = require('../helpers/responses');

/**
 * Generate payment receipt PDF
 */
const generatePaymentReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return ApiResponse.error(res, 'Payment ID is required', 400);
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generatePaymentReceipt(paymentId);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payment-receipt-${paymentId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF as response
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    
    if (error.message === 'Payment not found') {
      return ApiResponse.error(res, 'Payment not found', 404);
    }
    
    return ApiResponse.error(res, 'Failed to generate PDF receipt', 500);
  }
};

/**
 * Generate payment receipt PDF (inline view)
 */
const viewPaymentReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return ApiResponse.error(res, 'Payment ID is required', 400);
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generatePaymentReceipt(paymentId);

    // Set response headers for inline viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="payment-receipt-${paymentId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF as response
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    
    if (error.message === 'Payment not found') {
      return ApiResponse.error(res, 'Payment not found', 404);
    }
    
    return ApiResponse.error(res, 'Failed to generate PDF receipt', 500);
  }
};

module.exports = {
  generatePaymentReceipt,
  viewPaymentReceipt
};
