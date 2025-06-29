class PDFGenerator {
  constructor() {
    this.jsPDF = window.jspdf.jsPDF;
  }

  async initFonts(doc) {
    // Load Noto Sans regular and bold from CDN
    await doc.addFont(
      'https://fonts.gstatic.com/s/notosans/v27/o-0IIpQlx3QUlC5A4PNb4g.ttf',
      'NotoSans',
      'normal'
    );
    await doc.addFont(
      'https://fonts.gstatic.com/s/notosans/v27/o-0IIpQlx3QUlC50XPNb4g.ttf',
      'NotoSans',
      'bold'
    );
  }

  getCurrencySymbol(currency) {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',           // Unicode U+20B9
      NGN: '\u20A6'       // Unicode U+20A6 (₦)
    };
    return symbols[currency] || '$';
  }

  async generatePDF(documentData) {
    const doc = new this.jsPDF();
    await this.initFonts(doc);
    doc.setFont('NotoSans', 'normal');

    // Set document properties
    doc.setProperties({
      title: `${this.getDocumentTitle(documentData.type)} ${documentData.number}`,
      subject: `${this.getDocumentTitle(documentData.type)} for ${documentData.client.name}`,
      author: documentData.business.businessName || 'Business Documents Generator',
      creator: 'Business Documents Generator'
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

  // Similar edits apply to generatePDFForPreview() and printPDF(), each starting with:
  // await this.initFonts(doc);
  // doc.setFont('NotoSans', 'normal');

  // Rest of your methods use doc.setFont('NotoSans', ...) as before
  async addHeader(doc, documentData) {
    doc.setFont('NotoSans', 'normal');
    if (documentData.business.businessLogoUrl) {
      try {
        const logoImg = await this.loadImage(documentData.business.businessLogoUrl);
        doc.addImage(logoImg, 'JPEG', 15, 15, 30, 30);
      } catch (e) {
        console.warn('Logo load error', e);
      }
    }
    doc.setFontSize(10).setTextColor(100);
    doc.text(`Date: ${documentData.date}`, 150, 20);
  }

  addDocumentTitle(doc, documentData) {
    doc.setFont('NotoSans', 'bold').setFontSize(24).setTextColor(0);
    doc.text(this.getDocumentTitle(documentData.type), 15, 60);
    doc.setFont('NotoSans', 'normal').setFontSize(12);
    doc.text(`${this.getDocumentTitle(documentData.type)} #: ${documentData.number}`, 15, 70);
  }

  addBusinessInfo(doc, documentData) {
    doc.setFont('NotoSans', 'normal').setFontSize(12);
    let y = 85;
    doc.setFont('NotoSans', 'bold').text('From:', 15, y);
    doc.setFont('NotoSans', 'normal');
    y += 10;
    const b = documentData.business;
    if (b.businessName) { doc.text(b.businessName, 15, y); y += 7; }
    (b.businessAddress || '').split('\n').forEach(line => { doc.text(line, 15, y); y += 7; });
    if (b.businessPhone) { doc.text(`Phone: ${b.businessPhone}`, 15, y); y += 7; }
    if (b.businessEmail) { doc.text(`Email: ${b.businessEmail}`, 15, y); }
  }

  addClientInfo(doc, documentData) {
    doc.setFont('NotoSans', 'normal').setFontSize(12);
    let y = 85;
    doc.setFont('NotoSans', 'bold').text('To:', 110, y);
    doc.setFont('NotoSans', 'normal');
    y += 10;
    const c = documentData.client;
    if (c.name) { doc.text(c.name, 110, y); y += 7; }
    (c.address || '').split('\n').forEach(line => { doc.text(line, 110, y); y += 7; });
    if (c.email) { doc.text(`Email: ${c.email}`, 110, y); }
  }

  addItemsTable(doc, documentData) {
    doc.setFont('NotoSans', 'normal').setFontSize(10);
    const startY = 150;
    const curr = this.getCurrencySymbol(documentData.currency);

    doc.setFont('NotoSans', 'bold').setFillColor(240).rect(15, startY, 180, 10, 'F');
    ['Description', 'Qty', 'Price', 'Discount', 'Total'].forEach((label, i) => {
      const x = [20, 120, 140, 160, 180][i];
      doc.text(label, x, startY + 7);
    });

    let y = startY + 15;
    documentData.items.forEach((item, idx) => {
      if (idx % 2) { doc.setFillColor(248, 249, 250).rect(15, y - 5, 180, 10, 'F'); }
      doc.text(item.description, 20, y);
      doc.text(item.quantity.toString(), 120, y);
      doc.text(`${curr}${item.price.toFixed(2)}`, 140, y);
      doc.text(`${item.discount}%`, 160, y);
      doc.text(`${curr}${item.total.toFixed(2)}`, 180, y);
      y += 10;
    });

    doc.setDrawColor(200).rect(15, startY, 180, y - startY);
  }

  addTotals(doc, documentData) {
    doc.setFont('NotoSans', 'normal').setFontSize(10);
    const curr = this.getCurrencySymbol(documentData.currency);
    const t = documentData.totals;
    const y = Math.max(220, 150 + 15 + documentData.items.length * 10 + 20);

    doc.text('Subtotal:', 140, y);
    doc.text(`${curr}${t.subtotal.toFixed(2)}`, 180, y);
    doc.text(`Tax (${t.taxRate}%):`, 140, y + 10);
    doc.text(`${curr}${t.taxAmount.toFixed(2)}`, 180, y + 10);
    doc.setFont('NotoSans', 'bold').setFontSize(12).text('Total:', 140, y + 20);
    doc.text(`${curr}${t.grandTotal.toFixed(2)}`, 180, y + 20);
  }

  async addFooter(doc, documentData) {
    doc.setFont('NotoSans', 'normal').setFontSize(8).setTextColor(100);
    const ph = doc.internal.pageSize.height;
    const y = ph - 40;

    if (documentData.business.signatureUrl) {
      try {
        const sig = await this.loadImage(documentData.business.signatureUrl);
        doc.addImage(sig, 'JPEG', 15, y - 20, 40, 20);
        doc.text('Authorized Signature', 15, y + 5);
      } catch {}
    }

    doc.text('Thank you for your patronage!', 15, ph - 15);
    doc.text(`Page 1 of 1`, 180, ph - 15);
  }

  // Implement generatePDFForPreview and printPDF similarly, calling initFonts() & setFont()

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = url;
    });
  }

  getDocumentTitle(type) {
    return {
      invoice: 'INVOICE',
      quotation: 'QUOTATION',
      purchase_order: 'PURCHASE ORDER',
      receipt: 'RECEIPT'
    }[type] || 'DOCUMENT';
  }
}

// Initialize
window.PDFGenerator = new PDFGenerator();
