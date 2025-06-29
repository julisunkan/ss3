// PDF Generator for Business Documents

class PDFGenerator {
    constructor() {
        this.jsPDF = window.jspdf.jsPDF;
    }

    async generatePDF(documentData) {
        try {
            const doc = new this.jsPDF();
            
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

            // Save the PDF
            const fileName = `${documentData.type}_${documentData.number}.pdf`;
            doc.save(fileName);
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    async generatePDFForPreview(documentData) {
        try {
            const doc = new this.jsPDF();
            
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

            // Return PDF as data URL for preview
            return doc.output('dataurlstring');
            
        } catch (error) {
            console.error('Error generating PDF for preview:', error);
            throw error;
        }
    }

    async printPDF(documentData) {
        try {
            const doc = new this.jsPDF();
            
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

            // Open print dialog
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            // Create iframe for printing
            const printFrame = document.createElement('iframe');
            printFrame.style.display = 'none';
            printFrame.src = pdfUrl;
            document.body.appendChild(printFrame);
            
            printFrame.onload = function() {
                printFrame.contentWindow.print();
                // Clean up after a delay
                setTimeout(() => {
                    document.body.removeChild(printFrame);
                    URL.revokeObjectURL(pdfUrl);
                }, 1000);
            };
            
        } catch (error) {
            console.error('Error printing PDF:', error);
            throw error;
        }
    }

    async addHeader(doc, documentData) {
        // Add business logo if available
        if (documentData.business.businessLogoUrl) {
            try {
                const logoImg = await this.loadImage(documentData.business.businessLogoUrl);
                doc.addImage(logoImg, 'JPEG', 15, 15, 30, 30);
            } catch (error) {
                console.warn('Could not load business logo:', error);
            }
        }

        // Add document date
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
        const business = documentData.business;
        let yPos = 85;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('From:', 15, yPos);
        
        doc.setFont(undefined, 'normal');
        yPos += 10;
        
        if (business.businessName) {
            doc.text(business.businessName, 15, yPos);
            yPos += 7;
        }
        
        if (business.businessAddress) {
            const addressLines = business.businessAddress.split('\n');
            addressLines.forEach(line => {
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
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('To:', 110, yPos);
        
        doc.setFont(undefined, 'normal');
        yPos += 10;
        
        if (client.name) {
            doc.text(client.name, 110, yPos);
            yPos += 7;
        }
        
        if (client.address) {
            const addressLines = client.address.split('\n');
            addressLines.forEach(line => {
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
        
        // Table headers
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setFillColor(240, 240, 240);
        doc.rect(15, startY, 180, 10, 'F');
        
        doc.text('Description', 20, startY + 7);
        doc.text('Qty', 120, startY + 7);
        doc.text('Price', 140, startY + 7);
        doc.text('Discount', 160, startY + 7);
        doc.text('Total', 180, startY + 7);
        
        // Table content
        doc.setFont(undefined, 'normal');
        let yPos = startY + 15;
        
        documentData.items.forEach((item, index) => {
            // Alternate row colors
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
        
        // Table border
        doc.setDrawColor(200);
        doc.rect(15, startY, 180, yPos - startY);
    }

    addTotals(doc, documentData) {
        const currency = this.getCurrencySymbol(documentData.currency);
        const totals = documentData.totals;
        let yPos = 220;
        
        // Find the bottom of the items table
        const itemsEndY = 150 + 15 + (documentData.items.length * 10);
        if (itemsEndY > yPos) {
            yPos = itemsEndY + 20;
        }
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        // Subtotal
        doc.text('Subtotal:', 140, yPos);
        doc.text(`${currency}${totals.subtotal.toFixed(2)}`, 180, yPos);
        yPos += 10;
        
        // Tax
        doc.text(`Tax (${totals.taxRate}%):`, 140, yPos);
        doc.text(`${currency}${totals.taxAmount.toFixed(2)}`, 180, yPos);
        yPos += 10;
        
        // Grand total
        doc.setFont(undefined, 'bold');
        doc.setFontSize(12);
        doc.text('Total:', 140, yPos);
        doc.text(`${currency}${totals.grandTotal.toFixed(2)}`, 180, yPos);
    }

    async addFooter(doc, documentData) {
        const pageHeight = doc.internal.pageSize.height;
        let yPos = pageHeight - 40;
        
        // Add signature if available
        if (documentData.business.signatureUrl) {
            try {
                const signatureImg = await this.loadImage(documentData.business.signatureUrl);
                doc.addImage(signatureImg, 'JPEG', 15, yPos - 20, 40, 20);
                
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text('Authorized Signature', 15, yPos + 5);
            } catch (error) {
                console.warn('Could not load signature:', error);
            }
        }
        
        // Add footer text
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text('Thank you for your business!', 15, pageHeight - 15);
        
        // Add page number
        doc.text(`Page 1 of 1`, 180, pageHeight - 15);
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

    getCurrencySymbol(currency) {
        const symbols = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            INR: '₹',
		NGN: '₦'
        };
        return symbols[currency] || '$';
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
}

// Initialize PDF Generator
window.PDFGenerator = new PDFGenerator();
