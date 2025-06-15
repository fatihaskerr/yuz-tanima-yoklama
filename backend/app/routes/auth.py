from flask import Blueprint, request, jsonify
from ..utils.db import db

auth = Blueprint('auth', __name__)

@auth.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = db.users.find_one({"mail": data['mail'], "sifre": data['sifre']})
        
        if user:
            # Tüm gerekli kullanıcı bilgilerini gönder
            return jsonify({
                'message': 'Giriş başarılı',
                'user': {
                    'mail': user['mail'],
                    'role': user['role'],
                    'ad': user['ad'],
                    'soyad': user['soyad'],
                    'ogrno': user.get('ogrno'),  # Öğrenci numarasını da ekle
                    'telno': user.get('telno')   # Telefon numarasını da ekle
                }
            })
        else:
            return jsonify({'error': 'Geçersiz kullanıcı adı veya şifre'}), 401
            
    except Exception as e:
        print(f"Login hatası: {e}")
        return jsonify({'error': str(e)}), 500

@auth.route('/create-admin', methods=['POST'])
def create_admin():
    try:
        # Güvenlik kontrolü - sadece yerel ağdan erişilebilir
        if request.remote_addr not in ['127.0.0.1', 'localhost']:
            return jsonify({'error': 'Bu işlem sadece yerel sunucudan yapılabilir.'}), 403
            
        # Admin kullanıcısı zaten var mı kontrol et
        existing_admin = db.users.find_one({"role": "admin"})
        if existing_admin:
            return jsonify({'error': 'Admin kullanıcısı zaten mevcut.'}), 400
            
        # Admin kullanıcısı oluştur
        admin_user = {
            "mail": "admin@example.com",
            "sifre": "admin123",
            "role": "admin",
            "ad": "Admin",
            "soyad": "User"
        }
        
        db.users.insert_one(admin_user)
        
        return jsonify({'message': 'Admin kullanıcısı başarıyla oluşturuldu.'})
            
    except Exception as e:
        print(f"Admin oluşturma hatası: {e}")
        return jsonify({'error': str(e)}), 500