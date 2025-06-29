import os
import json
import logging
import secrets
import string
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix

# Logging config
logging.basicConfig(level=logging.DEBUG)

# Base model
class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# DB config
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///business_docs.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

db.init_app(app)

# --- Models ---

class DownloadCode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(8), unique=True, nullable=False)
    used = db.Column(db.Boolean, default=False)
    used_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=False)

class BusinessSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    business_name = db.Column(db.String(120))
    business_address = db.Column(db.String(255))
    business_phone = db.Column(db.String(50))
    business_email = db.Column(db.String(100))
    business_logo_url = db.Column(db.String(255))
    signature_url = db.Column(db.String(255))
    tax_rate = db.Column(db.Float)
    currency = db.Column(db.String(10))


# Create DB tables
with app.app_context():
    db.create_all()

# --- Routes ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/code-generator')
def code_generator():
    return render_template('code_generator.html')

@app.route('/api/generate-code', methods=['POST'])
def generate_code():
    """Generate 100 one-time unique download codes"""
    try:
        expiry = datetime.utcnow() + timedelta(hours=8760)
        generated_codes = set()
        codes_to_save = []

        while len(generated_codes) < 100:
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

            if code in generated_codes:
                continue

            # Ensure the code doesn't exist in the DB already
            if not DownloadCode.query.filter_by(code=code).first():
                generated_codes.add(code)
                codes_to_save.append(DownloadCode(code=code, expires_at=expiry))

        db.session.bulk_save_objects(codes_to_save)
        db.session.commit()

        return jsonify({
            'success': True,
            'codes': list(generated_codes),
            'expires_at': expiry.isoformat()
        })

    except Exception as e:
        logging.error(f"Error generating codes: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to generate codes'}), 500

@app.route('/api/verify-code', methods=['POST'])
def verify_code():
    try:
        data = request.get_json()
        code = data.get('code', '').upper()

        if not code:
            return jsonify({'success': False, 'error': 'Code is required'}), 400

        download_code = DownloadCode.query.filter_by(code=code, used=False).first()

        if not download_code:
            return jsonify({'success': False, 'error': 'Invalid or already used code'}), 400

        if download_code.expires_at < datetime.utcnow():
            return jsonify({'success': False, 'error': 'Code has expired'}), 400

        download_code.used = True
        download_code.used_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'success': True, 'message': 'Code verified successfully'})

    except Exception as e:
        logging.error(f"Error verifying code: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to verify code'}), 500

@app.route('/api/save-settings', methods=['POST'])
def save_settings():
    try:
        data = request.get_json()

        settings = BusinessSettings.query.first()
        if not settings:
            settings = BusinessSettings()
            db.session.add(settings)

        settings.business_name = data.get('businessName', '')
        settings.business_address = data.get('businessAddress', '')
        settings.business_phone = data.get('businessPhone', '')
        settings.business_email = data.get('businessEmail', '')
        settings.business_logo_url = data.get('businessLogoUrl', '')
        settings.signature_url = data.get('signatureUrl', '')
        settings.tax_rate = float(data.get('taxRate', 0))
        settings.currency = data.get('currency', 'USD')

        db.session.commit()

        return jsonify({'success': True, 'message': 'Settings saved successfully'})

    except Exception as e:
        logging.error(f"Error saving settings: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to save settings'}), 500

@app.route('/api/get-settings')
def get_settings():
    try:
        settings = BusinessSettings.query.first()
        if not settings:
            return jsonify({
                'success': True,
                'settings': {
                    'businessName': '',
                    'businessAddress': '',
                    'businessPhone': '',
                    'businessEmail': '',
                    'businessLogoUrl': '',
                    'signatureUrl': '',
                    'taxRate': 0,
                    'currency': 'USD'
                }
            })

        return jsonify({
            'success': True,
            'settings': {
                'businessName': settings.business_name,
                'businessAddress': settings.business_address,
                'businessPhone': settings.business_phone,
                'businessEmail': settings.business_email,
                'businessLogoUrl': settings.business_logo_url,
                'signatureUrl': settings.signature_url,
                'taxRate': settings.tax_rate,
                'currency': settings.currency
            }
        })

    except Exception as e:
        logging.error(f"Error getting settings: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to get settings'}), 500

@app.route('/api/export-settings')
def export_settings():
    try:
        settings = BusinessSettings.query.first()
        if not settings:
            return jsonify({'success': False, 'error': 'No settings found'}), 404

        settings_data = {
            'businessName': settings.business_name,
            'businessAddress': settings.business_address,
            'businessPhone': settings.business_phone,
            'businessEmail': settings.business_email,
            'businessLogoUrl': settings.business_logo_url,
            'signatureUrl': settings.signature_url,
            'taxRate': settings.tax_rate,
            'currency': settings.currency,
            'exportDate': datetime.utcnow().isoformat()
        }

        return jsonify({
            'success': True,
            'data': settings_data,
            'filename': f'business_settings_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        })

    except Exception as e:
        logging.error(f"Error exporting settings: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to export settings'}), 500

@app.route('/api/import-settings', methods=['POST'])
def import_settings():
    try:
        data = request.get_json()
        settings_data = data.get('settings', {})

        settings = BusinessSettings.query.first()
        if not settings:
            settings = BusinessSettings()
            db.session.add(settings)

        settings.business_name = settings_data.get('businessName', '')
        settings.business_address = settings_data.get('businessAddress', '')
        settings.business_phone = settings_data.get('businessPhone', '')
        settings.business_email = settings_data.get('businessEmail', '')
        settings.business_logo_url = settings_data.get('businessLogoUrl', '')
        settings.signature_url = settings_data.get('signatureUrl', '')
        settings.tax_rate = float(settings_data.get('taxRate', 0))
        settings.currency = settings_data.get('currency', 'USD')

        db.session.commit()

        return jsonify({'success': True, 'message': 'Settings imported successfully'})

    except Exception as e:
        logging.error(f"Error importing settings: {str(e)}")
        return jsonify({'success': False, 'error': 'Failed to import settings'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
