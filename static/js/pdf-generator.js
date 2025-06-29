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
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      NGN: '\u20A6'  // Unicode Naira
    };
    return symbols[currency] || '$';
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

  async addHeader(doc, documentData) {
    doc.setFont('NotoSans', 'normal');
    if (documentData.business.businessLogoUrl) {
      try {
        const logoImg = await this.loadImage(documentData.business.businessLogoUrl);
        doc.addImage(logoImg, 'JPEG', 15, 15, 30, 30);
      } catch (error) {
        console.warn('Could not load business logo:', error);
      }
    }
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${documentData.date}`, 150, 20);
  }

  addDocumentTitle(doc, documentData) {
    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(0);
    doc.text(this.getDocumentTitle(documentData.type), 15, 60);

    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(12);
    doc.text(`${this.getDocumentTitle(documentData.type)} #: ${documentData.number}`, 15, 70);
  }

  addBusinessInfo(doc, documentData) {
    const business = documentData.business;
    let yPos = 85;

    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(12);
    doc.text('From:', 15, yPos);

    doc.setFont('NotoSans', 'normal');
    yPos += 10;

    if (business.businessName) {
      doc.text(business.businessName, 15, yPos);
      yPos += 7;
    }

    if (business.businessAddress) {
      business.businessAddress.split('\n').forEach(line => {
        doc.text(line, 15, yPos);
        yPos += 7;
      });
    }

    if (business.businessPhone) {
      doc.text(`Phone: ${business.businessPhone}`, 15, yPos);
      yPos += 7;
    }

    if (business.businessEmail) {
      doc.text(`Email: ${business.businessEmail}`, 15, yPos);
    }
  }

  addClientInfo(doc, documentData) {
    const client = documentData.client;
    let yPos = 85;

    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(12);
    doc.text('To:', 110, yPos);

    doc.setFont('NotoSans', 'normal');
    yPos += 10;

    if (client.name) {
      doc.text(client.name, 110, yPos);
      yPos += 7;
    }

    if (client.address) {
      client.address.split('\n').forEach(line => {
        doc.text(line, 110, yPos);
        yPos += 7;
      });
    }

    if (client.email) {
      doc.text(`Email: ${client.email}`, 110, yPos);
    }
  }

  addItemsTable(doc, documentData) {
    const startY = 150;
    const currency = this.getCurrencySymbol(documentData.currency);

    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(15, startY, 180, 10, 'F');

    doc.text('Description', 20, startY + 7);
    doc.text('Qty', 120, startY + 7);
    doc.text('Price', 140, startY + 7);
    doc.text('Discount', 160, startY + 7);
    doc.text('Total', 180, startY + 7);

    doc.setFont('NotoSans', 'normal');
    let yPos = startY + 15;

    documentData.items.forEach((item, index) => {
      if (index % 2 === 1) {
        doc.setFillColor(248, 249, 250);
        doc.rect(15, yPos - 5, 180, 10, 'F');
      }

      doc.text(item.description, 20, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(`${currency}${item.price.toFixed(2)}`, 140, yPos);
      doc.text(`${item.discount}%`, 160, yPos);
      doc.text(`${currency}${item.total.toFixed(2)}`, 180, yPos);

      yPos += 10;
    });

    doc.setDrawColor(200);
    doc.rect(15, startY, 180, yPos - startY);
  }

  addTotals(doc, documentData) {
    const currency = this.getCurrencySymbol(documentData.currency);
    const totals = documentData.totals;
    let yPos = 220;

    const itemsEndY = 150 + 15 + documentData.items.length * 10;
    if (itemsEndY > yPos) {
      yPos = itemsEndY + 20;
    }

    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(10);

    doc.text('Subtotal:', 140, yPos);
    doc.text(`${currency}${totals.subtotal.toFixed(2)}`, 180, yPos);
    yPos += 10;

    doc.text(`Tax (${totals.taxRate}%):`, 140, yPos);
    doc.text(`${currency}${totals.taxAmount.toFixed(2)}`, 180, yPos);
    yPos += 10;

    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', 140, yPos);
    doc.text(`${currency}${totals.grandTotal.toFixed(2)}`, 180, yPos);
  }

  async addFooter(doc, documentData) {
    const pageHeight = doc.internal.pageSize.height;
    let yPos = pageHeight - 40;

    if (documentData.business.signatureUrl) {
      try {
        const signatureImg = await this.loadImage(documentData.business.signatureUrl);
        doc.addImage(signatureImg, 'JPEG', 15, yPos - 20, 40, 20);

        doc.setFont('NotoSans', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('Authorized Signature', 15, yPos + 5);
      } catch (error) {
        console.warn('Could not load signature:', error);
      }
    }

    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Thank you for your patronage!', 15, pageHeight - 15);
    doc.text(`Page 1 of 1`, 180, pageHeight - 15);
  }

  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const dataURL = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = function() {
        reject(new Error('Failed to load image'));
      };
      img.src = url;
    });
  }

  getDocumentTitle(type) {
    const titles = {
      invoice: 'INVOICE',
      quotation: 'QUOTATION',
      purchase_order: 'PURCHASE ORDER',
      receipt: 'RECEIPT'
    };
    return titles[type] || 'DOCUMENT';
  }
}

// Initialize
window.PDFGenerator = new PDFGenerator();
