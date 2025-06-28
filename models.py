from datetime import datetime
from app import db

class DownloadCode(db.Model):
    """Model for storing one-time download codes"""
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(8), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    used_at = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f'<DownloadCode {self.code}>'

class BusinessSettings(db.Model):
    """Model for storing business settings"""
    id = db.Column(db.Integer, primary_key=True)
    business_name = db.Column(db.String(200), nullable=True)
    business_address = db.Column(db.Text, nullable=True)
    business_phone = db.Column(db.String(50), nullable=True)
    business_email = db.Column(db.String(100), nullable=True)
    business_logo_url = db.Column(db.String(500), nullable=True)
    signature_url = db.Column(db.String(500), nullable=True)
    tax_rate = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(10), default='USD')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<BusinessSettings {self.business_name}>'
