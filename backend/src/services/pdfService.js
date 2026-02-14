const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Payment, Customer, Company, User } = require('../models');

class PDFService {
  constructor() {
    this.fontsPath = path.join(__dirname, '..', 'fonts');
  }

  /**
   * Generate payment receipt PDF
   */
  async generatePaymentReceipt(paymentId) {
    try {
      // Fetch payment with customer details
      const payment = await Payment.findByPk(paymentId, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'email', 'phone', 'address', 'father_name', 'gender', 'whatsapp_number']
          }
        ]
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Fetch company details
      let company = null;
      if (payment.company_id) {
        company = await Company.findByPk(payment.company_id);
      }

      // Fetch receiver details separately using user ID since received_by contains UUID
      let receiver = null;
      if (payment.received_by) {
        receiver = await User.findOne({
          where: { id: payment.received_by },
          attributes: ['id', 'username']
        });
      }

      return await this.createPaymentPDF(payment, payment.customer, company, receiver);
    } catch (error) {
      console.error('Error generating payment receipt:', error);
      throw error;
    }
  }

  /**
   * Create PDF document for payment receipt
   */
  async createPaymentPDF(payment, customer, company, receiver) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        // Add font support (fallback to built-in if custom fonts not available)
        try {
          doc.font('Helvetica');
        } catch (fontError) {
          console.warn('Font loading error, using default font:', fontError);
        }

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Generate PDF content
        this.addPDFContent(doc, payment, customer, company, receiver);
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add content to PDF document
   */
  addPDFContent(doc, payment, customer, company, receiver) {
    const pageWidth = doc.page.width - 100; // Account for margins
    let yPosition = 50;

    // Company Header
    if (company) {
      doc.fontSize(20).fillColor('#1a365d').text(company.name, 50, yPosition, { align: 'center' });
      yPosition += 30;
      
      if (company.email) {
        doc.fontSize(10).fillColor('#666').text(`Email: ${company.email}`, 50, yPosition, { align: 'center' });
        yPosition += 15;
      }
    } else {
      doc.fontSize(20).fillColor('#1a365d').text('Payment Receipt', 50, yPosition, { align: 'center' });
      yPosition += 30;
    }

    // Receipt Title and Date
    doc.fontSize(16).fillColor('#333').text('PAYMENT RECEIPT', 50, yPosition, { align: 'center' });
    yPosition += 25;
    
    doc.fontSize(10).fillColor('#666').text(
      `Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 
      50, yPosition, 
      { align: 'center' }
    );
    yPosition += 40;

    // Customer Details Section
    doc.fontSize(14).fillColor('#1a365d').text('Customer Details', 50, yPosition);
    yPosition += 20;

    const customerDetails = [
      ['Name:', customer?.name || 'N/A'],
      ['Email:', customer?.email || 'N/A'],
      ['Phone:', customer?.phone || 'N/A'],
      ['Address:', customer?.address || 'N/A'],
      ['Father Name:', customer?.father_name || 'N/A'],
      ['WhatsApp:', customer?.whatsapp_number || 'N/A']
    ];

    doc.fontSize(11).fillColor('#333');
    customerDetails.forEach(([label, value]) => {
      doc.text(label, 50, yPosition);
      doc.text(value, 150, yPosition);
      yPosition += 15;
    });

    yPosition += 20;

    // Payment Details Section
    doc.fontSize(14).fillColor('#1a365d').text('Payment Details', 50, yPosition);
    yPosition += 20;

    const paymentDetails = [
      ['Transaction ID:', payment.trx_id || 'N/A'],
      ['Payment Date:', payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'],
      ['Amount:', `PKR ${parseFloat(payment.amount || 0).toLocaleString()}`],
      ['Payment Method:', this.formatPaymentMethod(payment.payment_method)],
      ['Status:', this.formatStatus(payment.status)],
      ['Received By:', receiver?.username || 'N/A']
    ];

    doc.fontSize(11).fillColor('#333');
    paymentDetails.forEach(([label, value]) => {
      doc.text(label, 50, yPosition);
      doc.text(value, 150, yPosition);
      yPosition += 15;
    });

    yPosition += 20;

    // Receipt Image Section
    if (payment.receipt_image) {
      doc.fontSize(14).fillColor('#1a365d').text('Receipt Image', 50, yPosition);
      yPosition += 20;
      
      try {
        // Construct full path to receipt image
        const imagePath = path.join(__dirname, '..', '..', payment.receipt_image);
        
        // Check if image file exists
        if (fs.existsSync(imagePath)) {
          // Add image to PDF with proper sizing
          const maxWidth = pageWidth - 100; // Account for margins
          const imageHeight = 150; // Fixed height for receipt images
          
          doc.image(imagePath, 50, yPosition, {
            width: maxWidth,
            height: imageHeight,
            align: 'center',
            fit: [maxWidth, imageHeight]
          });
          yPosition += imageHeight + 20;
        } else {
          doc.fontSize(10).fillColor('#666').text('Receipt image not found', 50, yPosition);
          yPosition += 20;
        }
      } catch (imageError) {
        console.error('Error adding receipt image to PDF:', imageError);
        doc.fontSize(10).fillColor('#666').text('Error loading receipt image', 50, yPosition);
        yPosition += 20;
      }
    }

    // Additional Information
    if (payment.reference_number) {
      doc.text('Reference Number:', 50, yPosition);
      doc.text(payment.reference_number, 150, yPosition);
      yPosition += 15;
    }

    if (payment.notes) {
      doc.text('Notes:', 50, yPosition);
      yPosition += 15;
      
      // Handle multi-line notes
      const noteLines = doc.font('Helvetica').fontSize(11).widthOfString(payment.notes, { width: pageWidth - 100 });
      if (noteLines > pageWidth - 100) {
        const words = payment.notes.split(' ');
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine + word + ' ';
          if (doc.font('Helvetica').fontSize(11).widthOfString(testLine) > pageWidth - 100) {
            doc.text(currentLine, 50, yPosition);
            currentLine = word + ' ';
            yPosition += 15;
          } else {
            currentLine = testLine;
          }
        });
        doc.text(currentLine, 50, yPosition);
      } else {
        doc.text(payment.notes, 50, yPosition);
      }
      yPosition += 25;
    }

    // Summary Table
    yPosition = this.addSummaryTable(doc, yPosition, payment);

    // Footer
    this.addFooter(doc, company);

    return doc;
  }

  /**
   * Add summary table to PDF
   */
  addSummaryTable(doc, yPosition, payment) {
    const tableTop = yPosition + 20;
    const tableLeft = 50;
    const tableWidth = doc.page.width - 100;
    const rowHeight = 25;
    const colWidth = tableWidth / 2;

    // Table header
    doc.fontSize(12).fillColor('#1a365d');
    doc.rect(tableLeft, tableTop, colWidth, rowHeight).fillAndStroke('#f0f4f8', '#1a365d');
    doc.rect(tableLeft + colWidth, tableTop, colWidth, rowHeight).fillAndStroke('#f0f4f8', '#1a365d');
    
    doc.fillColor('#1a365d').text('Description', tableLeft + 10, tableTop + 8);
    doc.fillColor('#1a365d').text('Amount', tableLeft + colWidth + 10, tableTop + 8);

    // Table rows
    doc.fontSize(11).fillColor('#333');
    
    // Payment amount row
    doc.rect(tableLeft, tableTop + rowHeight, colWidth, rowHeight).stroke();
    doc.rect(tableLeft + colWidth, tableTop + rowHeight, colWidth, rowHeight).stroke();
    doc.text('Payment Amount', tableLeft + 10, tableTop + rowHeight + 8);
    doc.text(`PKR ${parseFloat(payment.amount || 0).toLocaleString()}`, tableLeft + colWidth + 10, tableTop + rowHeight + 8);

    // Total row
    const totalTop = tableTop + (rowHeight * 2);
    doc.rect(tableLeft, totalTop, tableWidth, rowHeight).fillAndStroke('#f8f9fa', '#1a365d');
    doc.fontSize(12).fillColor('#1a365d');
    doc.text('TOTAL', tableLeft + 10, totalTop + 8);
    doc.text(`PKR ${parseFloat(payment.amount || 0).toLocaleString()}`, tableLeft + tableWidth - 150, totalTop + 8, { align: 'right' });

    return tableTop + (rowHeight * 3) + 30;
  }

  /**
   * Add footer to PDF
   */
  addFooter(doc, company) {
    const footerY = doc.page.height - 80;
    
    doc.fontSize(9).fillColor('#666');
    
    if (company) {
      doc.text(`${company.name} - Payment Receipt`, 50, footerY, { align: 'center' });
    } else {
      doc.text('Payment Receipt - Generated Automatically', 50, footerY, { align: 'center' });
    }
    
    doc.text('This is a computer-generated receipt and does not require a signature', 50, footerY + 15, { align: 'center' });
    
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 30, { align: 'center' });
  }

  /**
   * Format payment method for display
   */
  formatPaymentMethod(method) {
    const methods = {
      'cash': 'Cash',
      'bank_transfer': 'Bank Transfer',
      'mobile_wallet': 'Mobile Wallet',
      'card': 'Credit/Debit Card',
      'jazz_cash': 'JazzCash',
      'easypaisa': 'EasyPaisa'
    };
    return methods[method] || method || 'N/A';
  }

  /**
   * Format status for display
   */
  formatStatus(status) {
    const statuses = {
      'pending': 'Pending',
      'paid': 'Paid',
      'completed': 'Completed',
      'confirmed': 'Confirmed',
      'approved': 'Approved',
      'unpaid': 'Unpaid'
    };
    return statuses[status] || status || 'N/A';
  }
}

module.exports = new PDFService();
