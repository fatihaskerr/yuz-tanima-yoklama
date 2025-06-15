import requests

def create_admin():
    try:
        response = requests.post('http://localhost:5000/api/auth/create-admin')
        data = response.json()
        
        if response.status_code == 200:
            print("✅ Admin kullanıcısı başarıyla oluşturuldu.")
            print("Mail: admin@example.com")
            print("Şifre: admin123")
        else:
            print(f"❌ Hata: {data.get('error', 'Bilinmeyen hata')}")
            
    except Exception as e:
        print(f"❌ Bağlantı hatası: {e}")
        print("API sunucusunun çalıştığından emin olun.")

if __name__ == "__main__":
    print("Admin kullanıcısı oluşturuluyor...")
    create_admin() 