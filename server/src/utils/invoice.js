const PDFDocument = require('pdfkit');

const sellerName = process.env.HOMA_NAME || 'HOMA Beauty Pvt. Ltd.';
const sellerAddress = process.env.HOMA_ADDRESS || 'Kathmandu, Nepal';
const sellerEmail = process.env.ADMIN_EMAIL || '';
const sellerWebsite = process.env.CLIENT_URL || 'https://homabeauty.com';

/**
 * Generates a styled, professional PDF Invoice using PDFKit
 * @param {Object} order - Order object populated with user details
 */
const generateInvoicePDF = (order) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Colors
  const primaryColor = '#DC2626'; // Brand red
  const darkColor = '#1F2937'; // Slate 800
  const lightColor = '#F3F4F6'; // Grey 100
  const textMuted = '#4B5563'; // Grey 600

  // --- Header ---
  doc
    .fillColor(primaryColor)
    .font('Helvetica-Bold')
    .fontSize(24)
    .text('HOMA BEAUTY', 50, 45)
    .fontSize(10)
    .fillColor(textMuted)
    .text('E-Commerce beauty store', 50, 75);

  // Invoice Meta details (Right side)
  doc
    .fillColor(darkColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('INVOICE', 400, 45, { align: 'right' })
    .font('Helvetica')
    .fontSize(9)
    .text(`Invoice No: ${order.invoiceNumber}`, 400, 60, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 72, { align: 'right' })
    .text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 400, 84, { align: 'right' })
    .fillColor(order.paymentStatus === 'paid' ? '#059669' : '#D97706') // Green for paid, orange for pending
    .font('Helvetica-Bold')
    .text(`Status: ${order.paymentStatus.toUpperCase()}`, 400, 96, { align: 'right' });

  // Draw divider line
  doc
    .strokeColor(lightColor)
    .lineWidth(1)
    .moveTo(50, 115)
    .lineTo(545, 115)
    .stroke();

  // --- Bill To / Ship To Info ---
  const yInfo = 130;
  doc
    .fillColor(darkColor)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('BILL TO:', 50, yInfo)
    .font('Helvetica')
    .fontSize(9)
    .text(order.user?.name || 'Customer Name', 50, yInfo + 15)
    .text(`Email: ${order.user?.email || 'N/A'}`, 50, yInfo + 27)
    .text(`Phone: ${order.shippingAddress?.phone || order.user?.phone || 'N/A'}`, 50, yInfo + 39)
    .text(`Address: ${order.shippingAddress?.street}, ${order.shippingAddress?.city}`, 50, yInfo + 51);

  doc
    .font('Helvetica-Bold')
    .text('SOLD BY:', 350, yInfo)
    .font('Helvetica')
    .text(sellerName, 350, yInfo + 15)
    .text(sellerAddress, 350, yInfo + 27)
    .text(sellerEmail || 'N/A', 350, yInfo + 39)
    .text(sellerWebsite, 350, yInfo + 51);

  // --- Items Table ---
  let yTable = 210;

  // Draw Table Header Background
  doc
    .rect(50, yTable, 495, 20)
    .fill(lightColor);

  doc
    .fillColor(darkColor)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('S.N.', 60, yTable + 6)
    .text('Product Name', 100, yTable + 6)
    .text('Price (NPR)', 330, yTable + 6, { width: 70, align: 'right' })
    .text('Qty', 410, yTable + 6, { width: 40, align: 'center' })
    .text('Amount (NPR)', 460, yTable + 6, { width: 80, align: 'right' });

  yTable += 20;

  // Draw Table Rows
  doc.font('Helvetica');
  order.items.forEach((item, index) => {
    // Add new page if yTable is about to exceed printable area
    if (yTable > 700) {
      doc.addPage();
      yTable = 50;

      // Table Header on new page
      doc.rect(50, yTable, 495, 20).fill(lightColor);
      doc
        .fillColor(darkColor)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text('S.N.', 60, yTable + 6)
        .text('Product Name', 100, yTable + 6)
        .text('Price (NPR)', 330, yTable + 6, { width: 70, align: 'right' })
        .text('Qty', 410, yTable + 6, { width: 40, align: 'center' })
        .text('Amount (NPR)', 460, yTable + 6, { width: 80, align: 'right' });

      yTable += 20;
      doc.font('Helvetica');
    }

    const itemTotal = item.price * item.quantity;

    doc
      .fillColor(darkColor)
      .text(`${index + 1}`, 60, yTable + 6)
      .text(item.name, 100, yTable + 6, { width: 220 })
      .text(item.price.toFixed(2), 330, yTable + 6, { width: 70, align: 'right' })
      .text(`${item.quantity}`, 410, yTable + 6, { width: 40, align: 'center' })
      .text(itemTotal.toFixed(2), 460, yTable + 6, { width: 80, align: 'right' });

    // Underline row
    yTable += 22;
    doc
      .strokeColor(lightColor)
      .lineWidth(0.5)
      .moveTo(50, yTable)
      .lineTo(545, yTable)
      .stroke();
  });

  // --- Totals Section ---
  yTable += 10;
  if (yTable > 650) {
    doc.addPage();
    yTable = 50;
  }

  const labelX = 350;
  const valueX = 460;
  const rowHeight = 15;

  doc.fontSize(9).font('Helvetica');

  // Subtotal
  doc.text('Subtotal:', labelX, yTable).text(`Rs. ${order.subtotal.toFixed(2)}`, valueX, yTable, { align: 'right' });
  yTable += rowHeight;

  // Coupon Discount
  if (order.discount > 0) {
    doc
      .fillColor(primaryColor)
      .text(`Discount (${order.couponCode || 'Coupon'}):`, labelX, yTable)
      .text(`- Rs. ${order.discount.toFixed(2)}`, valueX, yTable, { align: 'right' })
      .fillColor(darkColor);
    yTable += rowHeight;
  }

  // Taxable Amount
  doc.text('Taxable Amount:', labelX, yTable).text(`Rs. ${order.taxableAmount.toFixed(2)}`, valueX, yTable, { align: 'right' });
  yTable += rowHeight;

  // VAT
  doc.text('VAT (13%):', labelX, yTable).text(`Rs. ${order.vatAmount.toFixed(2)}`, valueX, yTable, { align: 'right' });
  yTable += rowHeight;

  // Delivery Charge
  doc.text('Delivery Charge:', labelX, yTable).text(`Rs. ${order.deliveryCharge.toFixed(2)}`, valueX, yTable, { align: 'right' });
  yTable += rowHeight;

  // Divider
  doc
    .strokeColor(darkColor)
    .lineWidth(1)
    .moveTo(labelX, yTable + 2)
    .lineTo(545, yTable + 2)
    .stroke();
  yTable += 8;

  // Grand Total
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('Grand Total:', labelX, yTable)
    .text(`Rs. ${order.grandTotal.toFixed(2)}`, valueX, yTable, { align: 'right' });

  // --- Footer ---
  doc
    .fontSize(8)
    .fillColor(textMuted)
    .font('Helvetica')
    .text('Thank you for shopping with HOMA Beauty!', 50, 750, { align: 'center' })
    .text('This is a computer-generated invoice and does not require a signature.', 50, 762, { align: 'center' });

  return doc;
};

module.exports = { generateInvoicePDF };
