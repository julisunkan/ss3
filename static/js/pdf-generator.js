// Import jsPDF and our converted font file
import { jsPDF } from 'jspdf';
import 'Roboto-Regular-normal.js'; // ensure this is correctly generated

class PDFGenerator {
  constructor() {
    this.jsPDF = jsPDF;
    this.defaultFont = 'Roboto-Regular'; // must match the font name in the converter file
  }

  async generatePDF(documentData) {
    const doc = new this.jsPDF();
    doc.addFont('Roboto-Regular.ttf', this.defaultFont, 'normal');
    doc.setFont(this.defaultFont, 'normal');

    doc.setProperties({
      title: `${this.getDocumentTitle(documentData.type)} ${documentData.number}`,
      subject: `${this.getDocumentTitle(documentData.type)} for ${documentData.client.name}`,
      author: documentData.business.businessName || 'Business Documents Generator',
      creator: 'Business Documents Generator',
    });

    await this.addHeader(doc, documentData);
    this.addDocumentTitle(doc, documentData);
    this.addBusinessInfo(doc, documentData);
    this.addClientInfo(doc, documentData);
    this.addItemsTable(doc, documentData);
    this.addTotals(doc, documentData);
    await this.addFooter(doc, documentData);

    doc.save(`${documentData.type}_${documentData.number}.pdf`);
  }

  async generatePDFForPreview(documentData) {
    const doc = new this.jsPDF();
    doc.addFont('Roboto-Regular.ttf', this.defaultFont, 'normal');
    doc.setFont(this.defaultFont, 'normal');

    doc.setProperties({
      title: `${this.getDocumentTitle(documentData.type)} ${documentData.number}`,
      subject: `${this.getDocumentTitle(documentData.type)} for ${documentData.client.name}`,
      author: documentData.business.businessName || 'Business Documents Generator',
      creator: 'Business Documents Generator',
    });

    await this.addHeader(doc, documentData);
    this.addDocumentTitle(doc, documentData);
    this.addBusinessInfo(doc, documentData);
    this.addClientInfo(doc, documentData);
    this.addItemsTable(doc, documentData);
    this.addTotals(doc, documentData);
    await this.addFooter(doc, documentData);

    return doc.output('dataurlstring');
  }

  async printPDF(documentData) {
    const doc = new this.jsPDF();
    doc.addFont('Roboto-Regular.ttf', this.defaultFont, 'normal');
    doc.setFont(this.defaultFont, 'normal');

    doc.setProperties({
      title: `${this.getDocumentTitle(documentData.type)} ${documentData.number}`,
      subject: `${this.getDocumentTitle(documentData.type)} for ${documentData.client.name}`,
      author: documentData.business.businessName || 'Business Documents Generator',
      creator: 'Business Documents Generator',
    });

    await this.addHeader(doc, documentData);
    this.addDocumentTitle(doc, documentData);
    this.addBusinessInfo(doc, documentData);
    this.addClientInfo(doc, documentData);
    this.addItemsTable(doc, documentData);
    this.addTotals(doc, documentData);
    await this.addFooter(doc, documentData);

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };
  }

  async addHeader(doc, documentData) {
    if (documentData.business.businessLogoUrl) {
      try {
        const logoImg = await this.loadImage(documentData.business.businessLogoUrl);
        doc.addImage(logoImg, 'JPEG', 15, 15, 30, 30);
      } catch (err) {
        console.warn('Logo load failed:', err);
      }
    }
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${documentData.date}`, 150, 20);
  }

  addDocumentTitle(doc, documentData) {
    doc.setFontSize(24);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    const title = this.getDocumentTitle(documentData.type);
    doc.text(title, 15, 60);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`${title} #: ${documentData.number}`, 15, 70);
  }

  addBusinessInfo(doc, documentData) {
    const b = documentData.business;
    let y = 85;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('From:', 15, y);
    doc.setFont(undefined, 'normal');
    y += 10;
    if (b.businessName) { doc.text(b.businessName, 15, y); y += 7; }
    if (b.businessAddress) {
      b.businessAddress.split('\n').forEach(line => { doc.text(line, 15, y); y += 7; });
    }
    if (b.businessPhone) { doc.text(`Phone: ${b.businessPhone}`, 15, y); y += 7; }
    if (b.businessEmail) doc.text(`Email: ${b.businessEmail}`, 15, y);
  }

  addClientInfo(doc, documentData) {
    const c = documentData.client;
    let y = 85;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('To:', 110, y);
    doc.setFont(undefined, 'normal');
    y += 10;
    if (c.name) { doc.text(c.name, 110, y); y += 7; }
    if (c.address) {
      c.address.split('\n').forEach(line => { doc.text(line, 110, y); y += 7; });
    }
    if (c.email) doc.text(`Email: ${c.email}`, 110, y);
  }

  addItemsTable(doc, documentData) {
    const startY = 150;
    const currency = this.getCurrencySymbol(documentData.currency);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(15, startY, 180, 10, 'F');
    doc.text('Description', 20, startY + 7);
    doc.text('Qty', 120, startY + 7);
    doc.text('Price', 140, startY + 7);
    doc.text('Discount', 160, startY + 7);
    doc.text('Total', 180, startY + 7);
    doc.setFont(undefined, 'normal');

    let y = startY + 15;
    documentData.items.forEach((it, i) => {
      if (i % 2 === 1) {
        doc.setFillColor(248, 249, 250);
        doc.rect(15, y - 5, 180, 10, 'F');
      }
      doc.text(it.description, 20, y);
      doc.text(it.quantity.toString(), 120, y);
      doc.text(`${currency}${it.price.toFixed(2)}`, 140, y);
      doc.text(`${it.discount}%`, 160, y);
      doc.text(`${currency}${it.total.toFixed(2)}`, 180, y);
      y += 10;
    });

    doc.setDrawColor(200);
    doc.rect(15, startY, 180, y - startY);
  }

  addTotals(doc, documentData) {
    const currency = this.getCurrencySymbol(documentData.currency);
    const t = documentData.totals;
    let y = 150 + 15 + documentData.items.length * 10 + 20;
    if (y < 220) y = 220;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Subtotal:', 140, y);
    doc.text(`${currency}${t.subtotal.toFixed(2)}`, 180, y);
    y += 10;
    doc.text(`Tax (${t.taxRate}%):`, 140, y);
    doc.text(`${currency}${t.taxAmount.toFixed(2)}`, 180, y);
    y += 10;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Total:', 140, y);
    doc.text(`${currency}${t.grandTotal.toFixed(2)}`, 180, y);
  }

  async addFooter(doc, documentData) {
    const h = doc.internal.pageSize.height;
    let y = h - 40;

    if (documentData.business.signatureUrl) {
      try {
        const sig = await this.loadImage(documentData.business.signatureUrl);
        doc.addImage(sig, 'JPEG', 15, y - 20, 40, 20);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('Authorized Signature', 15, y + 5);
      } catch (err) {
        console.warn('Signature failed:', err);
      }
    }

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Thank you for your patronage!', 15, h - 15);
    doc.text(`Page 1 of 1`, 180, h - 15);
  }

  getDocumentTitle(type) {
    const titles = {
      invoice: 'INVOICE',
      quotation: 'QUOTATION',
      purchase_order: 'PURCHASE ORDER',
      receipt: 'RECEIPT',
    };
    return titles[type] || 'DOCUMENT';
  }

  getCurrencySymbol(currency) {
    const s = { USD: '$', EUR: '€', GBP: '£', INR: '₹', NGN: '₦' };
    return s[currency] || '$';
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = url;
    });
  }
}

// Declare globally if needed
window.PDFGenerator = new PDFGenerator();
