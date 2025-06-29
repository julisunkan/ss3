// Business Documents Generator - Main Application Logic

class DocumentGenerator {
    constructor() {
        this.items = [];
        this.settings = {};
        this.documentCounter = this.getDocumentCounter();
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.generateDocumentNumber();
        this.addInitialItem();
    }

    setupEventListeners() {
        // Document type change
        document.getElementById('documentType').addEventListener('change', () => {
            this.generateDocumentNumber();
        });

        // Add item button
        document.getElementById('addItemBtn').addEventListener('click', () => {
            this.addItem();
            this.updateLivePreview(); // Update preview when new item is added
        });

        // Settings buttons
        document.getElementById('saveSettingsBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('exportSettingsBtn').addEventListener('click', () => {
            this.exportSettings();
        });

        document.getElementById('importSettingsBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.importSettings(e.target.files[0]);
        });

        // Verify and download button
        document.getElementById('verifyAndDownloadBtn').addEventListener('click', () => {
            this.verifyAndDownload();
        });

        // Live preview updates
        this.setupLivePreview();

        // Tab change event
        document.getElementById('settings-tab').addEventListener('shown.bs.tab', () => {
            this.loadSettingsForm();
        });
    }

    getDocumentCounter() {
        const counters = JSON.parse(localStorage.getItem('documentCounters')) || {
            invoice: 1000,
            quotation: 2000,
            purchase_order: 3000,
            receipt: 4000
        };
        return counters;
    }

    saveDocumentCounter() {
        localStorage.setItem('documentCounters', JSON.stringify(this.documentCounter));
    }

    generateDocumentNumber() {
        const type = document.getElementById('documentType').value;
        const prefix = {
            invoice: 'INV',
            quotation: 'QUO',
            purchase_order: 'PO',
            receipt: 'REC'
        };

        const number = `${prefix[type]}-${this.documentCounter[type]++}`;
        document.getElementById('documentNumber').value = number;
        this.saveDocumentCounter();
    }

    addItem() {
        const tableBody = document.getElementById('itemsTableBody');
        const row = document.createElement('tr');
        row.className = 'item-row';
        row.innerHTML = `
            <td><input type="text" class="form-control item-description" placeholder="Item description"></td>
            <td><input type="number" class="form-control item-quantity" min="1" value="1" step="1"></td>
            <td><input type="number" class="form-control item-price" min="0" step="0.01" placeholder="0.00"></td>
            <td><input type="number" class="form-control item-discount" min="0" max="100" step="0.1" value="0" placeholder="0"></td>
            <td><span class="item-total">$0.00</span></td>
            <td>
                <button type="button" class="btn btn-danger btn-sm remove-item-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(row);

        // Add event listeners for calculations
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.calculateRowTotal(row);
                this.calculateGrandTotal();
                this.updateLivePreview(); // Update preview when items change
            });
        });

        // Add remove button listener
        row.querySelector('.remove-item-btn').addEventListener('click', () => {
            if (tableBody.children.length > 1) {
                row.remove();
                this.calculateGrandTotal();
                this.updateLivePreview(); // Update preview when item is removed
            } else {
                this.showToast('At least one item is required', 'warning');
            }
        });
    }

    addInitialItem() {
        this.addItem();
    }

    calculateRowTotal(row) {
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const discount = parseFloat(row.querySelector('.item-discount').value) || 0;

        const subtotal = quantity * price;
        const discountAmount = (subtotal * discount) / 100;
        const total = subtotal - discountAmount;

        const currency = this.settings.currency || 'USD';
        const symbol = this.getCurrencySymbol(currency);
        row.querySelector('.item-total').textContent = `${symbol}${total.toFixed(2)}`;
    }

    calculateGrandTotal() {
        const rows = document.querySelectorAll('#itemsTableBody tr');
        let subtotal = 0;

        rows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const discount = parseFloat(row.querySelector('.item-discount').value) || 0;

            const itemSubtotal = quantity * price;
            const discountAmount = (itemSubtotal * discount) / 100;
            const itemTotal = itemSubtotal - discountAmount;
            subtotal += itemTotal;
        });

        const taxRate = this.settings.taxRate || 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const grandTotal = subtotal + taxAmount;

        const currency = this.settings.currency || 'USD';
        const symbol = this.getCurrencySymbol(currency);

        document.getElementById('subtotal').textContent = `${symbol}${subtotal.toFixed(2)}`;
        document.getElementById('taxAmount').textContent = `${symbol}${taxAmount.toFixed(2)}`;
        document.getElementById('grandTotal').textContent = `${symbol}${grandTotal.toFixed(2)}`;
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

    async saveSettings() {
        const settings = {
            businessName: document.getElementById('businessName').value,
            businessAddress: document.getElementById('businessAddress').value,
            businessPhone: document.getElementById('businessPhone').value,
            businessEmail: document.getElementById('businessEmail').value,
            businessLogoUrl: document.getElementById('businessLogoUrl').value,
            signatureUrl: document.getElementById('signatureUrl').value,
            taxRate: parseFloat(document.getElementById('taxRate').value) || 0,
            currency: document.getElementById('currency').value
        };

        try {
            const response = await fetch('/api/save-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            const data = await response.json();
            if (data.success) {
                this.settings = settings;
                this.showToast('Settings saved successfully!', 'success');
                this.calculateGrandTotal(); // Recalculate with new tax rate
            } else {
                throw new Error(data.error || 'Failed to save settings');
            }
        } catch (error) {
            this.showToast('Error saving settings: ' + error.message, 'error');
        }
    }

    async loadSettings() {
        try {
            const response = await fetch('/api/get-settings');
            const data = await response.json();
            
            if (data.success) {
                this.settings = data.settings;
                this.updateLivePreview(); // Update preview when settings are loaded
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    loadSettingsForm() {
        document.getElementById('businessName').value = this.settings.businessName || '';
        document.getElementById('businessAddress').value = this.settings.businessAddress || '';
        document.getElementById('businessPhone').value = this.settings.businessPhone || '';
        document.getElementById('businessEmail').value = this.settings.businessEmail || '';
        document.getElementById('businessLogoUrl').value = this.settings.businessLogoUrl || '';
        document.getElementById('signatureUrl').value = this.settings.signatureUrl || '';
        document.getElementById('taxRate').value = this.settings.taxRate || 0;
        document.getElementById('currency').value = this.settings.currency || 'USD';
    }

    async exportSettings() {
        try {
            const response = await fetch('/api/export-settings');
            const data = await response.json();
            
            if (data.success) {
                const blob = new Blob([JSON.stringify(data.data, null, 2)], {
                    type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = data.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showToast('Settings exported successfully!', 'success');
            } else {
                throw new Error(data.error || 'Failed to export settings');
            }
        } catch (error) {
            this.showToast('Error exporting settings: ' + error.message, 'error');
        }
    }

    async importSettings(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const settings = JSON.parse(text);

            const response = await fetch('/api/import-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ settings })
            });

            const data = await response.json();
            if (data.success) {
                this.settings = settings;
                this.loadSettingsForm();
                this.showToast('Settings imported successfully!', 'success');
                this.calculateGrandTotal();
            } else {
                throw new Error(data.error || 'Failed to import settings');
            }
        } catch (error) {
            this.showToast('Error importing settings: ' + error.message, 'error');
        }
    }

    async verifyAndDownload() {
        const code = document.getElementById('downloadCode').value.trim();
        
        if (!code) {
            this.showToast('Please enter a download code', 'warning');
            return;
        }

        // Validate form data
        if (!this.validateForm()) {
            return;
        }

        try {
            // Verify the code
            const response = await fetch('/api/verify-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            });

            const data = await response.json();
            if (data.success) {
                // Code is valid, generate and download PDF
                this.generatePDF();
                this.showToast('PDF generated successfully!', 'success');
                document.getElementById('downloadCode').value = '';
            } else {
                throw new Error(data.error || 'Invalid code');
            }
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }
    }

    validateForm() {
        const clientName = document.getElementById('clientName').value.trim();
        const items = document.querySelectorAll('#itemsTableBody tr');
        
        if (!clientName) {
            this.showToast('Please enter client name', 'warning');
            return false;
        }

        let hasValidItem = false;
        items.forEach(row => {
            const description = row.querySelector('.item-description').value.trim();
            const quantity = parseFloat(row.querySelector('.item-quantity').value);
            const price = parseFloat(row.querySelector('.item-price').value);
            
            if (description && quantity > 0 && price > 0) {
                hasValidItem = true;
            }
        });

        if (!hasValidItem) {
            this.showToast('Please add at least one valid item', 'warning');
            return false;
        }

        return true;
    }

    generatePDF() {
        // This will be handled by the PDF generator
        if (window.PDFGenerator) {
            const documentData = this.getDocumentData();
            window.PDFGenerator.generatePDF(documentData);
        } else {
            this.showToast('PDF generator not loaded', 'error');
        }
    }

    getDocumentData() {
        const items = [];
        const rows = document.querySelectorAll('#itemsTableBody tr');
        
        rows.forEach(row => {
            const description = row.querySelector('.item-description').value.trim();
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
            
            if (description && quantity > 0 && price > 0) {
                const subtotal = quantity * price;
                const discountAmount = (subtotal * discount) / 100;
                const total = subtotal - discountAmount;
                
                items.push({
                    description,
                    quantity,
                    price,
                    discount,
                    total
                });
            }
        });

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const taxRate = this.settings.taxRate || 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const grandTotal = subtotal + taxAmount;

        return {
            type: document.getElementById('documentType').value,
            number: document.getElementById('documentNumber').value,
            client: {
                name: document.getElementById('clientName').value,
                email: document.getElementById('clientEmail').value,
                address: document.getElementById('clientAddress').value
            },
            business: this.settings,
            items,
            totals: {
                subtotal,
                taxAmount,
                grandTotal,
                taxRate
            },
            currency: this.settings.currency || 'USD',
            date: new Date().toLocaleDateString()
        };
    }

    setupLivePreview() {
        // Set up event listeners for live preview updates
        const inputs = [
            'documentType', 'clientName', 'clientEmail', 'clientAddress'
        ];
        
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.updateLivePreview());
                element.addEventListener('change', () => this.updateLivePreview());
            }
        });

        // Initial preview update
        this.updateLivePreview();
    }

    updateLivePreview() {
        try {
            const previewContainer = document.getElementById('previewContent');
            const documentData = this.getBasicDocumentData();
            
            const previewHTML = this.generatePreviewHTML(documentData);
            previewContainer.innerHTML = previewHTML;
        } catch (error) {
            console.error('Error updating live preview:', error);
        }
    }

    getBasicDocumentData() {
        // Get form data for preview (doesn't require validation)
        const items = [];
        const rows = document.querySelectorAll('#itemsTableBody tr');
        
        rows.forEach(row => {
            const description = row.querySelector('.item-description')?.value || '';
            const quantity = parseFloat(row.querySelector('.item-quantity')?.value) || 0;
            const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
            const discount = parseFloat(row.querySelector('.item-discount')?.value) || 0;
            
            if (description || quantity > 0 || price > 0) {
                const subtotal = quantity * price;
                const discountAmount = (subtotal * discount) / 100;
                const total = subtotal - discountAmount;
                
                items.push({
                    description: description || 'Item description',
                    quantity: quantity || 1,
                    price: price || 0,
                    discount: discount || 0,
                    total: total
                });
            }
        });

        // Add default item if none exist
        if (items.length === 0) {
            items.push({
                description: 'Sample item',
                quantity: 1,
                price: 0,
                discount: 0,
                total: 0
            });
        }

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const taxRate = this.settings.taxRate || 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const grandTotal = subtotal + taxAmount;

        return {
            type: document.getElementById('documentType')?.value || 'invoice',
            number: document.getElementById('documentNumber')?.value || 'INV-1000',
            client: {
                name: document.getElementById('clientName')?.value || 'Client Name',
                email: document.getElementById('clientEmail')?.value || 'client@example.com',
                address: document.getElementById('clientAddress')?.value || 'Client Address'
            },
            business: this.settings,
            items,
            totals: {
                subtotal,
                taxAmount,
                grandTotal,
                taxRate
            },
            currency: this.settings.currency || 'USD',
            date: new Date().toLocaleDateString()
        };
    }

    generatePreviewHTML(documentData) {
        const currency = this.getCurrencySymbol(documentData.currency);
        const documentTitle = this.getDocumentTitle(documentData.type);
        
        return `
            <div style="max-width: 100%; margin: 0 auto; background: white; padding: 20px; border: 1px solid #ddd;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
                    <div>
                        ${documentData.business.businessLogoUrl ? 
                            `<img src="${documentData.business.businessLogoUrl}" alt="Logo" style="max-width: 80px; max-height: 80px; margin-bottom: 10px;">` : 
                            '<div style="width: 80px; height: 60px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999; margin-bottom: 10px;">Logo</div>'
                        }
                    </div>
                    <div style="text-align: right; font-size: 10px; color: #666;">
                        Date: ${documentData.date}
                    </div>
                </div>

                <!-- Document Title -->
                <div style="margin-bottom: 25px;">
                    <h2 style="font-size: 20px; font-weight: bold; margin: 0; color: #333;">${documentTitle}</h2>
                    <p style="font-size: 11px; margin: 5px 0 0 0; color: #666;">${documentTitle} #: ${documentData.number}</p>
                </div>

                <!-- Business and Client Info -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 25px;">
                    <div style="width: 45%;">
                        <strong style="font-size: 11px;">From:</strong>
                        <div style="margin-top: 8px; font-size: 10px; line-height: 1.4;">
                            <div><strong>${documentData.business.businessName || 'Your Business Name'}</strong></div>
                            <div>${(documentData.business.businessAddress || 'Your Business Address').replace(/\n/g, '<br>')}</div>
                            ${documentData.business.businessPhone ? `<div>Phone: ${documentData.business.businessPhone}</div>` : ''}
                            ${documentData.business.businessEmail ? `<div>Email: ${documentData.business.businessEmail}</div>` : ''}
                        </div>
                    </div>
                    <div style="width: 45%;">
                        <strong style="font-size: 11px;">To:</strong>
                        <div style="margin-top: 8px; font-size: 10px; line-height: 1.4;">
                            <div><strong>${documentData.client.name}</strong></div>
                            <div>${documentData.client.address.replace(/\n/g, '<br>')}</div>
                            ${documentData.client.email ? `<div>Email: ${documentData.client.email}</div>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Items Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9px;">
                    <thead>
                        <tr style="background-color: #f5f5f5;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Description</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 60px;">Qty</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: right; width: 70px;">Price</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 50px;">Disc</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: right; width: 70px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${documentData.items.map((item, index) => `
                            <tr style="${index % 2 === 1 ? 'background-color: #f9f9f9;' : ''}">
                                <td style="border: 1px solid #ddd; padding: 8px;">${item.description}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${currency}${item.price.toFixed(2)}</td>
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.discount}%</td>
                                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${currency}${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <!-- Totals -->
                <div style="display: flex; justify-content: flex-end; margin-bottom: 25px;">
                    <div style="width: 200px; font-size: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Subtotal:</span>
                            <span>${currency}${documentData.totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Tax (${documentData.totals.taxRate}%):</span>
                            <span>${currency}${documentData.totals.taxAmount.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px;">
                            <span>Total:</span>
                            <span>${currency}${documentData.totals.grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        ${documentData.business.signatureUrl ? 
                            `<img src="${documentData.business.signatureUrl}" alt="Signature" style="max-width: 120px; max-height: 60px; margin-bottom: 5px;">
                             <div style="font-size: 8px; color: #666;">Authorized Signature</div>` : 
                            '<div style="width: 120px; height: 40px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #999; margin-bottom: 5px;">Signature</div>'
                        }
                    </div>
                    <div style="font-size: 8px; color: #666; text-align: right;">
                        <div>Thank you for your patronage!</div>
                        <div>Page 1 of 1</div>
                    </div>
                </div>
            </div>
        `;
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

    showToast(message, type = 'info') {
        const toast = document.getElementById('alertToast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.className = `toast bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'} text-white`;
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.docGenerator = new DocumentGenerator();
});
