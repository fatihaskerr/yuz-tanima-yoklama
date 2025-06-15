from flask import Blueprint, jsonify, request
from ..utils.db import db
from datetime import datetime, timedelta
from bson import ObjectId

courses = Blueprint('courses', __name__)

@courses.route('/teacher/<mail>', methods=['GET'])
def get_teacher_courses(mail):
    try:
        print(f"Aranan öğretmen maili: {mail}")  # Debug log
        
        # Tüm dersleri kontrol et
        all_courses = list(db.courses.find())
        print(f"Veritabanındaki tüm dersler: {all_courses}")  # Debug log
        
        # Öğretmenin verdiği dersleri getir
        teacher_courses = list(db.courses.find(
            {"ogretmenler": mail},
            {"_id": 1, "dersKodu": 1, "dersAdi": 1}
        ))
        print(f"Bulunan öğretmen dersleri: {teacher_courses}")  # Debug log
        
        # Frontend'in beklediği formata dönüştür
        formatted_courses = [{
            "_id": str(course["_id"]),
            "kod": course["dersKodu"],
            "ad": course["dersAdi"]
        } for course in teacher_courses]
        
        print(f"Frontend'e gönderilen dersler: {formatted_courses}")  # Debug log
        
        return jsonify({
            'courses': formatted_courses
        })
        
    except Exception as e:
        print(f"Ders getirme hatası: {e}")
        return jsonify({'error': str(e)}), 500

@courses.route('/attendance/start', methods=['POST'])
def start_attendance():
    try:
        data = request.get_json()
        
        # Gerekli alanları kontrol et
        if not data or 'dersKodu' not in data or 'ogretmenMail' not in data:
            return jsonify({'error': 'Eksik bilgi'}), 400
            
        # Dersi bul
        course = db.courses.find_one({"dersKodu": data['dersKodu']})
        if not course:
            return jsonify({'error': 'Ders bulunamadı'}), 404
            
        # Yeni yoklama kaydı oluştur
        attendance_record = {
            "dersKodu": data['dersKodu'],
            "dersAdi": course['dersAdi'],
            "ogretmenMail": data['ogretmenMail'],
            "tarih": datetime.now(),
            "durum": "aktif",
            "katilanlar": [],  # Derse katılan öğrenciler (öğrenci no ile)
            "tumOgrenciler": course['ogrenciler'],  # Dersi alan tüm öğrenciler (öğrenci no ile)
            "isAdvanceMode": data.get('isAdvanceMode', False),
            "duration": data.get('duration'),
            "endTime": None
        }
        
        # Eğer advance mode aktifse ve süre seçilmişse, bitiş zamanını hesapla
        if data.get('isAdvanceMode') and data.get('duration'):
            if data['duration'] == 'manual':
                attendance_record['duration'] = 'manual'
            else:
                duration_minutes = int(data['duration'])
                end_time = datetime.now() + timedelta(minutes=duration_minutes)
                attendance_record['endTime'] = end_time
                attendance_record['duration'] = duration_minutes
        
        # Yoklama kaydını veritabanına ekle
        result = db.attendance.insert_one(attendance_record)
        
        return jsonify({
            'message': 'Yoklama başlatıldı',
            'attendanceId': str(result.inserted_id)
        })
        
    except Exception as e:
        print(f"Yoklama başlatma hatası: {e}")
        return jsonify({'error': str(e)}), 500

@courses.route('/attendance/<attendance_id>/end', methods=['POST'])
def end_attendance(attendance_id):
    try:
        # Yoklamayı bul ve durumunu güncelle
        db.attendance.update_one(
            {"_id": ObjectId(attendance_id)},
            {"$set": {"durum": "tamamlandı"}}
        )
        
        # Yoklama kaydını getir
        attendance = db.attendance.find_one({"_id": ObjectId(attendance_id)})
        
        # Katılmayanları hesapla
        katilmayanlar = list(set(attendance['tumOgrenciler']) - set(attendance['katilanlar']))
        
        # Yoklama özetini güncelle
        db.attendance.update_one(
            {"_id": ObjectId(attendance_id)},
            {"$set": {"katilmayanlar": katilmayanlar}}
        )
        
        return jsonify({'message': 'Yoklama tamamlandı'})
        
    except Exception as e:
        print(f"Yoklama bitirme hatası: {e}")
        return jsonify({'error': str(e)}), 500

@courses.route('/attendance/<attendance_id>', methods=['GET'])
def get_attendance(attendance_id):
    try:
        print(f"Aranan yoklama ID: {attendance_id}")
        
        # Yoklama kaydını bul
        attendance = db.attendance.find_one({"_id": ObjectId(attendance_id)})
        if not attendance:
            return jsonify({'error': 'Yoklama bulunamadı'}), 404
        
        print(f"Yoklamadaki öğrenci listesi: {attendance['tumOgrenciler']}")
        
        # Öğrenci listesini oluştur
        ogrenci_detaylari = []
        for index, ogrenci_no in enumerate(attendance['tumOgrenciler'], 1):
            # users koleksiyonundan öğrenci bilgilerini çek
            ogrenci = db.users.find_one({"ogrno": ogrenci_no})
            
            if ogrenci:
                ogrenci_detaylari.append({
                    "ogrenciNo": ogrenci_no,
                    "adSoyad": f"{ogrenci['ad']} {ogrenci['soyad']}"
                })
            else:
                # Öğrenci bulunamazsa index ile göster
                ogrenci_detaylari.append({
                    "ogrenciNo": ogrenci_no,
                    "adSoyad": f"Öğrenci {index}"
                })
        
        print(f"Oluşturulan öğrenci detayları: {ogrenci_detaylari}")
            
        return jsonify({
            'tumOgrenciler': ogrenci_detaylari,
            'katilanlar': attendance['katilanlar']
        })
        
    except Exception as e:
        print(f"Yoklama getirme hatası: {e}")
        return jsonify({'error': str(e)}), 500

@courses.route('/attendance/<attendance_id>/update', methods=['POST'])
def update_attendance(attendance_id):
    try:
        data = request.get_json()
        if not data or 'ogrenci' not in data or 'isPresent' not in data:
            return jsonify({'error': 'Eksik bilgi'}), 400
            
        if data['isPresent']:
            # Öğrenciyi katılanlar listesine ekle (öğrenci no ile)
            db.attendance.update_one(
                {"_id": ObjectId(attendance_id)},
                {"$addToSet": {"katilanlar": data['ogrenci']}}  # ogrenci artık öğrenci no
            )
        else:
            # Öğrenciyi katılanlar listesinden çıkar
            db.attendance.update_one(
                {"_id": ObjectId(attendance_id)},
                {"$pull": {"katilanlar": data['ogrenci']}}
            )
            
        return jsonify({'message': 'Yoklama güncellendi'})
        
    except Exception as e:
        print(f"Yoklama güncelleme hatası: {e}")
        return jsonify({'error': str(e)}), 500

@courses.route('/active-attendance/<teacher_mail>', methods=['GET'])
def get_active_attendance(teacher_mail):
    try:
        # Öğretmenin aktif yoklamasını bul
        active_attendance = db.attendance.find_one({
            "ogretmenMail": teacher_mail,
            "durum": "aktif"
        })
        
        # ObjectId'yi string'e çevir
        if active_attendance:
            active_attendance['_id'] = str(active_attendance['_id'])
        
        return jsonify({
            'activeAttendance': active_attendance
        })
        
    except Exception as e:
        print(f"Aktif yoklama getirme hatası: {e}")
        return jsonify({'error': str(e)}), 500

@courses.route('/attendance/check-expired', methods=['GET'])
def check_expired_attendance():
    try:
        # Süresi dolmuş yoklamaları bul
        expired_attendance = list(db.attendance.find({
            "durum": "aktif",
            "isAdvanceMode": True,
            "endTime": {"$lt": datetime.now()}
        }))
        
        for attendance in expired_attendance:
            # Yoklamayı bitir
            db.attendance.update_one(
                {"_id": attendance["_id"]},
                {"$set": {"durum": "tamamlandı"}}
            )
            
            # Katılmayanları hesapla
            katilmayanlar = list(set(attendance['tumOgrenciler']) - set(attendance['katilanlar']))
            
            # Yoklama özetini güncelle
            db.attendance.update_one(
                {"_id": attendance["_id"]},
                {"$set": {"katilmayanlar": katilmayanlar}}
            )
            
            print(f"[DEBUG] Süresi dolan yoklama otomatik olarak bitirildi: {attendance['_id']}")
        
        return jsonify({
            'message': f'{len(expired_attendance)} yoklama otomatik olarak bitirildi'
        })
        
    except Exception as e:
        print(f"Otomatik yoklama bitirme hatası: {e}")
        return jsonify({'error': str(e)}), 500