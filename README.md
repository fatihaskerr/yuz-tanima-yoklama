# e-Yoklama Sistemi

Üniversite dersleri için elektronik yoklama sistemi.

## Özellikler

- Öğretmenler için ders yoklama yönetimi
- Öğrenciler için yoklama takibi
- Admin paneli ile sistem yönetimi
- Derslerin, öğretmenlerin ve öğrencilerin yönetimi
- Yoklama verilerinin analizi

## Kurulum

1. Projeyi klonlayın
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   cd backend
   pip install -r requirements.txt
   ```
3. Backend sunucusunu başlatın:
   ```bash
   cd backend
   python run.py
   ```
4. Frontend geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## Admin Kullanıcısı Oluşturma

Admin paneline erişmek için bir admin kullanıcısı oluşturmanız gerekir:

1. Backend sunucusu çalışırken, yeni bir terminal açın
2. Aşağıdaki komutu çalıştırın:
   ```bash
   cd backend
   python create_admin.py
   ```
3. Oluşturulan admin bilgileri:
   - E-posta: admin@example.com
   - Şifre: admin123

## Admin Paneli Kullanımı

Admin paneli aşağıdaki özellikleri sunar:

1. **Dersler Yönetimi**
   - Yeni ders ekleme
   - Mevcut dersleri düzenleme
   - Derslere öğretmen ve öğrenci atama
   - Dersleri silme

2. **Öğretmenler Yönetimi**
   - Yeni öğretmen ekleme
   - Öğretmen bilgilerini düzenleme
   - Öğretmenleri silme

3. **Öğrenciler Yönetimi**
   - Yeni öğrenci ekleme
   - Öğrenci bilgilerini düzenleme
   - Öğrencileri silme

4. **Yoklama Verileri**
   - Tüm yoklama kayıtlarını görüntüleme
   - Yoklama verilerini analiz etme
   - Yoklama kayıtlarını düzenleme

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
