class PDFGenerator {
  constructor() {
    this.jsPDF = window.jspdf.jsPDF;
  }

  async initFonts(doc) {
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
    return {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      NGN: '\u20A6'
    }[currency] || '$';
  }

  async generatePDF(documentData) {
    const doc = new this.jsPDF();
    await this.initFonts(doc);
    doc.setFont('NotoSans', 'normal');

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

  async generatePDFForPreview(documentData) {
    const doc = new this.jsPDF();
    await this.initFonts(doc);
    doc.setFont('NotoSans', 'normal');

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

    return doc.output('dataurlstring');
  }

  async printPDF(documentData) {
    const doc = new this.jsPDF();
    await this.initFonts(doc);
    doc.setFont('NotoSans', 'normal');

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

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    printFrame.src = pdfUrl;
    document.body.appendChild(printFrame);
    printFrame.onload = () => {
      printFrame.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
    };
  }

  async addHeader(doc, data) {
    doc.setFont('NotoSans', 'normal');
    if (data.business.businessLogoUrl) {
      try {
        const logo = await this.loadImage(data.business.businessLogoUrl);
        doc.addImage(logo, 'JPEG', 15, 15, 30, 30);
      } catch (e) {
        console.warn('Logo load error', e);
      }
    }
    doc.setFontSize(10).setTextColor(100);
    doc.text(`Date: ${data.date}`, 150, 20);
  }

  addDocumentTitle(doc, data) {
    doc.setFont('NotoSans', 'bold').setFontSize(24).setTextColor(0);
    doc.text(this.getDocumentTitle(data.type), 15, 60);
    doc.setFont('NotoSans', 'normal').setFontSize(12);
    doc.text(`${this.getDocumentTitle(data.type)} #: ${data.number}`, 15, 70);
  }

  addBusinessInfo(doc, data) {
    doc.setFont('NotoSans', 'normal').setFontSize(12);
    let y = 85;
    doc.setFont('NotoSans', 'bold').text('From:', 15, y);
    doc.setFont('NotoSans', 'normal');
    y += 10;
    const b = data.business;
    if (b.businessName) { doc.text(b.businessName, 15, y); y += 7; }
    (b.businessAddress || '').split('\n').forEach(line => {
      doc.text(line, 15, y); y += 7;
    });
    if (b.businessPhone) { doc.text(`Phone: ${b.businessPhone}`, 15, y); y += 7; }
    if (b.businessEmail) { doc.text(`Email: ${b.businessEmail}`, 15, y); }
  }

  addClientInfo(doc, data) {
    doc.setFont('NotoSans', 'normal').setFontSize(12);
    let y = 85;
    doc.setFont('NotoSans', 'bold').text('To:', 110, y);
    doc.setFont('NotoSans', 'normal');
    y += 10;
    const c = data.client;
    if (c.name) { doc.text(c.name, 110, y); y += 7; }
    (c.address || '').split('\n').forEach(line => {
      doc.text(line, 110, y); y += 7;
    });
    if (c.email) { doc.text(`Email: ${c.email}`, 110, y); }
  }

  addItemsTable(doc, data) {
    doc.setFont('NotoSans', 'normal').setFontSize(10);
    const startY = 150;
    const curr = this.getCurrencySymbol(data.currency);

    doc.setFont('NotoSans', 'bold').setFillColor(240);
    doc.rect(15, startY, 180, 10, 'F');
    ['Description', 'Qty', 'Price', 'Discount', 'Total'].forEach((label,i) => {
      const x = [20,120,140,160,180][i];
      doc.text(label, x, startY + 7);
    });

    let y = startY + 15;
    data.items.forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 249, 250);
        doc.rect(15, y - 5, 180, 10, 'F');
      }
      doc.setFont('NotoSans', 'normal');
      doc.text(item.description, 20, y);
      doc.text(item.quantity.toString(), 120, y);
      doc.text(`${curr}${item.price.toFixed(2)}`, 140, y);
      doc.text(`${item.discount}%`, 160, y);
      doc.text(`${curr}${item.total.toFixed(2)}`, 180, y);
      y += 10;
    });

    doc.setDrawColor(200);
    doc.rect(15, startY, 180, y - startY);
  }

  addTotals(doc, data) {
    doc.setFont('NotoSans', 'normal').setFontSize(10);
    const curr = this.getCurrencySymbol(data.currency);
    const t = data.totals;
    const yBase = 150 + 15 + data.items.length * 10 + 20;
    let y = yBase < 220 ? 220 : yBase;

    doc.text('Subtotal:', 140, y);
    doc.text(`${curr}${t.subtotal.toFixed(2)}`, 180, y);
    doc.text(`Tax (${t.taxRate}%):`, 140, y + 10);
    doc.text(`${curr}${t.taxAmount.toFixed(2)}`, 180, y + 10);
    doc.setFont('NotoSans', 'bold').setFontSize(12).text('Total:', 140, y + 20);
    doc.text(`${curr}${t.grandTotal.toFixed(2)}`, 180, y + 20);
  }

  async addFooter(doc, data) {
    doc.setFont('NotoSans', 'normal').setFontSize(8).setTextColor(100);
    const ph = doc.internal.pageSize.height;
    const yStart = ph - 40;

    if (data.business.signatureUrl) {
      try {
        const sig = await this.loadImage(data.business.signatureUrl);
        doc.addImage(sig, 'JPEG', 15, yStart - 20, 40, 20);
        doc.text('Authorized Signature', 15, yStart + 5);
      } catch { }
    }

    doc.text('Thank you for your patronage!', 15, ph - 15);
    doc.text(`Page 1 of 1`, 180, ph - 15);
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = img.width; cv.height = img.height;
        cv.getContext('2d').drawImage(img, 0, 0);
        resolve(cv.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = url;
    });
  }

  getDocumentTitle(type) {
    return ({
      invoice: 'INVOICE',
      quotation: 'QUOTATION',
      purchase_order: 'PURCHASE ORDER',
      receipt: 'RECEIPT'
    })[type] || 'DOCUMENT';
  }
}

// Attach to window
window.PDFGenerator = new PDFGenerator();
