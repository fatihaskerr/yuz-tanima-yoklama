from flask import Blueprint, jsonify, request
from ..utils.db import db
from ..utils.email_sender import generate_verification_code, send_verification_email
from datetime import datetime, timedelta
from bson import ObjectId
import os
import numpy as np
import uuid
from pymongo import MongoClient

attendance_routes = Blueprint('attendance', __name__)


@attendance_routes.route('/active-courses/<ogrno>', methods=['GET'])
def get_active_courses(ogrno):
    try:
        ogrno = str(ogrno)  # Bu satır eklendi
        print(f"[DEBUG] Öğrenci no: {ogrno} için aktif dersler getiriliyor")
        
        active_courses = list(db.attendance.find({
            "durum": "aktif",
            "tumOgrenciler": ogrno
        }))
        
        formatted_courses = []
        for course in active_courses:
            course_id = str(course['_id'])

            ogretmen = db.users.find_one({"mail": course.get('ogretmenMail')})
            ogretmen_adi = f"{ogretmen['ad']} {ogretmen['soyad']}" if ogretmen else course.get('ogretmenMail')

            katilim_yapildi = ogrno in course.get('katilanlar', [])

            formatted_courses.append({
                '_id': course_id,
                'dersKodu': course['dersKodu'],
                'dersAdi': course['dersAdi'],
                'katilimYapildi': katilim_yapildi,
                'ogretmenler': [ogretmen_adi],
                'tarih': course.get('tarih')
            })

        return jsonify(formatted_courses)

    except Exception as e:
        print(f"[HATA] Aktif dersler getirme hatası: {str(e)}")
        return jsonify({'error': str(e)}), 500

@attendance_routes.route('/verify-attendance/<ders_id>/<ogrno>', methods=['POST'])
def verify_attendance(ders_id, ogrno):
    try:
        # Dersi bul ve öğrenciyi katilanlar listesine ekle
        result = db.attendance.update_one(
            {"_id": ObjectId(ders_id)},
            {"$addToSet": {"katilanlar": ogrno}}
        )
        
        if result.modified_count > 0:
            print(f"[DEBUG] Öğrenci {ogrno} dersin katılımcılarına eklendi")
            return jsonify({"message": "Yoklama kaydı başarılı"}), 200
        else:
            print(f"[DEBUG] Öğrenci zaten katılımcılarda var veya güncelleme başarısız")
            return jsonify({"message": "Bu ders için zaten yoklama kaydınız var"}), 200
            
    except Exception as e:
        print(f"[HATA] Yoklama kaydı hatası: {str(e)}")
        return jsonify({'error': str(e)}), 500 

@attendance_routes.route('/student-tracking/<ogrno>', methods=['GET'])
def get_student_tracking(ogrno):
    try:
        # Öğrencinin tüm derslerini bul
        all_courses = list(db.attendance.find({
            "tumOgrenciler": ogrno
        }).distinct("dersKodu"))
        
        tracking_data = []
        
        for ders_kodu in all_courses:
            # Her ders için yoklama verilerini topla
            dersler = list(db.attendance.find({
                "dersKodu": ders_kodu,
                "tumOgrenciler": ogrno
            }))
            
            if dersler:
                toplam_ders = len(dersler)
                katildigi_ders = sum(1 for ders in dersler if ogrno in ders.get('katilanlar', []))
                katilmadigi_ders = toplam_ders - katildigi_ders
                katilim_orani = round((katildigi_ders / toplam_ders) * 100) if toplam_ders > 0 else 0
                
                tracking_data.append({
                    "dersKodu": ders_kodu,
                    "dersAdi": dersler[0].get('dersAdi', ''),
                    "toplamDers": toplam_ders,
                    "katildigiDers": katildigi_ders,
                    "katilmadigiDers": katilmadigi_ders,
                    "katilimOrani": katilim_orani
                })
        
        return jsonify(tracking_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500 

@attendance_routes.route('/teacher-tracking/<teacher_mail>/<course_code>', methods=['GET'])
def get_teacher_tracking(teacher_mail, course_code):
    try:
        print(f"[DEBUG] Öğretmen devamsızlık takibi isteği - Öğretmen: {teacher_mail}, Ders: {course_code}")
        
        # Önce dersi bul
        course = db.courses.find_one({
            "dersKodu": course_code,
            "ogretmenler": teacher_mail
        })
        print(f"[DEBUG] Ders bulundu mu: {course is not None}")
        
        if not course:
            print("[DEBUG] Ders bulunamadı")
            return jsonify([])
            
        # Dersin tüm yoklama kayıtlarını bul
        all_attendance = list(db.attendance.find({
            "dersKodu": course_code,
            "ogretmenMail": teacher_mail
        }))
        print(f"[DEBUG] Bulunan yoklama kayıtları: {len(all_attendance)}")
        
        if not all_attendance:
            print("[DEBUG] Yoklama kaydı bulunamadı")
            return jsonify([])
            
        tracking_data = []
        
        # Her öğrenci için devamsızlık verilerini hesapla
        for ogrenci_no in course['ogrenciler']:
            print(f"[DEBUG] Öğrenci işleniyor: {ogrenci_no}")
            
            # Öğrenci bilgilerini al
            ogrenci = db.users.find_one({"ogrno": ogrenci_no})
            if not ogrenci:
                print(f"[DEBUG] Öğrenci bulunamadı: {ogrenci_no}")
                continue
                
            # Öğrencinin katıldığı dersleri say
            toplam_ders = len(all_attendance)
            katildigi_ders = sum(1 for ders in all_attendance if ogrenci_no in ders.get('katilanlar', []))
            katilmadigi_ders = toplam_ders - katildigi_ders
            katilim_orani = round((katildigi_ders / toplam_ders) * 100) if toplam_ders > 0 else 0
            
            print(f"[DEBUG] Öğrenci {ogrenci_no} - Toplam: {toplam_ders}, Katıldı: {katildigi_ders}, Katılmadı: {katilmadigi_ders}, Oran: {katilim_orani}")
            
            tracking_data.append({
                "ogrenciNo": ogrenci_no,
                "adSoyad": f"{ogrenci['ad']} {ogrenci['soyad']}",
                "toplamDers": toplam_ders,
                "katildigiDers": katildigi_ders,
                "katilmadigiDers": katilmadigi_ders,
                "katilimOrani": katilim_orani
            })
        
        print(f"[DEBUG] Toplam {len(tracking_data)} öğrenci verisi döndürülüyor")
        return jsonify(tracking_data)
        
    except Exception as e:
        print(f"[HATA] Öğretmen devamsızlık takibi hatası: {str(e)}")
        return jsonify({'error': str(e)}), 500 

@attendance_routes.route('/send-verification-email', methods=['POST'])
def send_verification_email_route():
    try:
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({'error': 'E-posta adresi gerekli'}), 400
            
        # Doğrulama kodu oluştur
        verification_code = generate_verification_code()
        
        # Kodu veritabanına kaydet (5 dakika geçerli)
        db.verification_codes.insert_one({
            'email': data['email'],
            'code': verification_code,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(minutes=5)
        })
        
        # E-postayı gönder
        if send_verification_email(data['email'], verification_code):
            return jsonify({'message': 'Doğrulama kodu gönderildi'})
        else:
            return jsonify({'error': 'E-posta gönderilemedi'}), 500
            
    except Exception as e:
        print(f"E-posta gönderme hatası: {e}")
        return jsonify({'error': str(e)}), 500

@attendance_routes.route('/verify-email-code', methods=['POST'])
def verify_email_code():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'code' not in data:
            return jsonify({'error': 'E-posta ve kod gerekli'}), 400
            
        # Kodu kontrol et
        verification = db.verification_codes.find_one({
            'email': data['email'],
            'code': data['code'],
            'expires_at': {'$gt': datetime.now()}
        })
        
        if verification:
            # Kullanılmış kodu sil
            db.verification_codes.delete_one({'_id': verification['_id']})
            return jsonify({'message': 'Kod doğrulandı'})
        else:
            return jsonify({'error': 'Geçersiz veya süresi dolmuş kod'}), 400
            
    except Exception as e:
        print(f"Kod doğrulama hatası: {e}")
        return jsonify({'error': str(e)}), 500 

@attendance_routes.route('/face-upload/<student_id>', methods=['POST'])
def face_upload(student_id):
    try:
        print(f"[DEBUG] Face upload API çağrıldı. Student ID: {student_id}")
        print(f"[DEBUG] Request içeriği: {request.files}")
        print(f"[DEBUG] Form verileri: {request.form}")
        
        if not student_id:
            return jsonify({'error': 'Öğrenci ID bilgisi eksik'}), 400

        student_number = request.form.get('ogrno') or student_id
        student_ad = request.form.get('ad')
        student_soyad = request.form.get('soyad')
        
        print(f"[DEBUG] Kullanılacak öğrenci numarası: {student_number}")
        
        image_file = request.files.get('file')
        if not image_file:
            return jsonify({'error': 'Dosya gönderilmedi'}), 400

        # ✅ Eğer encoding zaten varsa, işlemi reddet
        existing = db.ogrenciler.find_one({"ogrenci_id": student_number})
        if existing and "encoding" in existing:
            print("[ERROR] Bu öğrenci için zaten yüz verisi kayıtlı.")
            return jsonify({'error': 'Bu öğrenci için zaten yüz verisi kayıtlı. Önce silinmeli.'}), 400

        folder_id = student_number
        save_path = os.path.join(os.getcwd(), 'face_data', folder_id)
        os.makedirs(save_path, exist_ok=True)

        filename = f"{uuid.uuid4()}.jpg"
        file_path = os.path.join(save_path, filename)

        image_file.save(file_path)
        print(f"[DEBUG] Dosya kaydedildi: {file_path}")

        import face_recognition
        image = face_recognition.load_image_file(file_path)
        face_locations = face_recognition.face_locations(image)

        if not face_locations:
            os.remove(file_path)
            return jsonify({'error': 'Görselde yüz tespit edilemedi'}), 400

        face_encodings = face_recognition.face_encodings(image, face_locations)
        if not face_encodings:
            os.remove(file_path)
            return jsonify({'error': 'Yüz özellikleri çıkarılamadı'}), 400

        encoding = face_encodings[0].tolist()

        ogrenci_data = {
            "ogrenci_id": student_number,
            "ad": student_ad or "",
            "soyad": student_soyad or "",
            "encoding": encoding,
            "foto_galerisi": [file_path]
        }

        result = db.ogrenciler.update_one(
            {"ogrenci_id": student_number},
            {"$set": ogrenci_data},
            upsert=True
        )

        print(f"[DEBUG] Ogrenciler güncelleme sonucu: matched={result.matched_count}, modified={result.modified_count}")

        return jsonify({
            'message': 'Yüz verisi başarıyla kaydedildi',
            'face_path': file_path,
            'face_detected': True
        }), 200

    except Exception as e:
        import traceback
        print("[ERROR] Yüz verisi yükleme hatası:")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

# Yüz tanıma ile doğrulama için route
@attendance_routes.route('/face-verify', methods=['POST'])
def face_verify():
    try:
        print("[DEBUG] Face verify API çağrıldı")

        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'Dosya gönderilmedi'}), 400

        image_file = request.files['file']
        ogrenci_id = request.form.get('ogrenciId')  # 👈 Öğrenci ID'si artık zorunlu
        course_id = request.form.get('courseId')

        if not course_id or not ogrenci_id:
            return jsonify({'success': False, 'message': 'Ders veya öğrenci bilgisi eksik'}), 400

        if db is None:
            return jsonify({'success': False, 'message': 'Veritabanı bağlantısı yok'}), 500

        import face_recognition

        # 1. Yüz tanıma işlemi
        image = face_recognition.load_image_file(image_file)
        face_locations = face_recognition.face_locations(image)

        if len(face_locations) != 1:
            return jsonify({'success': False, 'message': 'Görselde bir (1) adet yüz olmalı'}), 400

        face_encodings = face_recognition.face_encodings(image, face_locations)
        if not face_encodings:
            return jsonify({'success': False, 'message': 'Yüz özellikleri çıkarılamadı'}), 400

        input_encoding = face_encodings[0]

        # 2. Sadece belirtilen öğrenciyle karşılaştır
        student = db.ogrenciler.find_one({"ogrenci_id": ogrenci_id})
        if not student or "encoding" not in student:
            return jsonify({'success': False, 'message': 'Öğrenci bulunamadı veya yüz verisi yok'}), 404

        student_encoding = np.array(student["encoding"])
        if len(student_encoding) != 128:
            return jsonify({'success': False, 'message': 'Öğrenci yüz verisi geçersiz'}), 500

        # 3. Karşılaştırma
        distance = face_recognition.face_distance([student_encoding], input_encoding)[0]
        print(f"[DEBUG] Eşleşme mesafesi: {distance}")

        if distance < 0.45:  # Daha sıkı eşik değeri
            return jsonify({
                'success': True,
                'ogrenci_id': ogrenci_id,
                'ogrno': ogrenci_id,
                'ad': student.get("ad", ""),
                'soyad': student.get("soyad", "")
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Yüz eşleşmedi'}), 200

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'success': False, 'message': f'Bir hata oluştu: {str(e)}'}), 500
