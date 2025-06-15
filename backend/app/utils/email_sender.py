import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import string

def generate_verification_code():
    """6 haneli rastgele doğrulama kodu oluşturur"""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(to_email, verification_code):
    """Doğrulama kodunu e-posta ile gönderir"""
    try:
        # E-posta ayarları
        sender_email = "emir.goc@gmx.com"
        sender_password = "yoklamasistemi"
        
        # E-posta içeriği
        message = MIMEMultipart()
        message["From"] = sender_email
        message["To"] = to_email
        message["Subject"] = "Yoklama Sistemi - Doğrulama Kodu"
        
        body = f"""
        Merhaba,
        
        Yoklama sistemine giriş yapmak için doğrulama kodunuz: {verification_code}
        
        Bu kod 5 dakika süreyle geçerlidir.
        
        Eğer bu işlemi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.
        
        Saygılarımızla,
        Yoklama Sistemi
        """
        
        message.attach(MIMEText(body, "plain"))
        
        # GMX SMTP ayarları
        with smtplib.SMTP("mail.gmx.com", 587) as server:
            server.starttls()  # TLS başlat
            server.login(sender_email, sender_password)
            server.send_message(message)
            
        return True
        
    except Exception as e:
        print(f"E-posta gönderme hatası: {e}")
        return False 