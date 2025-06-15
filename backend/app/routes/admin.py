from flask import Blueprint, request, jsonify
from ..utils.db import db
from bson import ObjectId
import json
from bson import json_util
from datetime import datetime, timedelta

admin_routes = Blueprint('admin', __name__)

# Helper function to parse MongoDB results
def parse_json(data):
    return json.loads(json_util.dumps(data))

# Courses
@admin_routes.route('/courses', methods=['GET'])
def get_all_courses():
    try:
        courses = list(db.courses.find())
        return jsonify(parse_json(courses))
    except Exception as e:
        print(f"Kurs getirme hatası: {e}")
        return jsonify({'error': str(e)}), 500

@admin_routes.route('/courses', methods=['POST'])
def create_course():
    try:
        data = request.get_json()
        
        # Gerekli alanları kontrol et
        if not data or 'dersKodu' not in data or 'dersAdi' not in data:
            return jsonify({'error': 'Eksik bilgi. Ders kodu ve ders adı gerekli.'}), 400
            
        # Aynı ders koduna sahip başka bir ders olup olmadığını kontrol et
        existing_course = db.courses.find_one({"dersKodu": data['dersKodu']})
        if existing_course:
            return jsonify({'error': 'Bu ders kodu zaten kullanılıyor.'}), 400
            
        # Yeni ders oluştur
        result = db.courses.insert_one({
            "dersKodu": data['dersKodu'],
            "dersAdi": data['dersAdi'],
            "ogretmenler": data.get('ogretmenler', []),
            "ogrenciler": data.get('ogrenciler', [])
        })
        
        return jsonify({
            'message': 'Ders başarıyla oluşturuldu',
            'id': str(result.inserted_id)
        })
        
    except Exception as e:
        print(f"Ders oluşturma hatası: {e}")
        return jsonify({'error': str(e)}), 500

@admin_routes.route('/courses/<course_id>', methods=['PUT'])
def update_course(course_id):
    try:
        data = request.get_json()
        
        # Gerekli alanları kontrol et
        if not data or 'dersKodu' not in data or 'dersAdi' not in data:
            return jsonify({'error': 'Eksik bilgi. Ders kodu ve ders adı gerekli.'}), 400
            
        # ObjectId dönüştürme
        course_obj_id = ObjectId(course_id)
        
        # Aynı ders koduna sahip başka bir ders olup olmadığını kontrol et (kendisi hariç)
        existing_course = db.courses.find_one({
            "dersKodu": data['dersKodu'], 
            "_id": {"$ne": course_obj_id}
        })
        
        if existing_course:
            return jsonify({'error': 'Bu ders kodu zaten kullanılıyor.'}), 400
            
        # Ders bilgilerini güncelle
        result = db.courses.update_one(
            {"_id": course_obj_id},
            {"$set": {
                "dersKodu": data['dersKodu'],
                "dersAdi": data['dersAdi'],
                "ogretmenler": data.get('ogretmenler', []),
                "ogrenciler": data.get('ogrenciler', [])
            }}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Ders bulunamadı.'}), 404
            
        return jsonify({'message': 'Ders başarıyla güncellendi'})
        
    except Exception as e:
        print(f"Ders güncelleme hatası: {e}")
        return jsonify({'error': str(e)}), 500

@admin_routes.route('/courses/<course_id>', methods=['DELETE'])
def delete_course(course_id):
    try:
        # ObjectId dönüştürme
        course_obj_id = ObjectId(course_id)
        
        # Öncelikle bununla ilişkili tüm yoklamaları bul
        related_attendance = list(db.attendance.find({"dersKodu": db.courses.find_one({"_id": course_obj_id})["dersKodu"]}))
        
        # Ders silinmeden önce ilgili yoklama kayıtlarını da sil
        for attendance in related_attendance:
            db.attendance.delete_one({"_id": attendance["_id"]})
        
        # Dersi sil
        result = db.courses.delete_one({"_id": course_obj_id})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Ders bulunamadı.'}), 404
            
        return jsonify({'message': 'Ders ve ilişkili yoklama kayıtları başarıyla silindi'})
        
    except Exception as e:
        print(f"Ders silme hatası: {e}")
        return jsonify({'error': str(e)}), 500

# Users (Teachers & Students)
@admin_routes.route('/teachers', methods=['GET'])
def get_all_teachers():
    try:
        teachers = list(db.users.find({"role": "teacher"}))
        return jsonify(parse_json(teachers))
    except Exception as e:
        print(f"Öğretmen getirme hatası: {e}")
        return jsonify({'error': str(e)}), 500

@admin_routes.route('/students', methods=['GET'])
def get_all_students():
    try:
        students = list(db.users.find({"role": "student"}))
        return jsonify(parse_json(students))
    except Exception as e:
        print(f"Öğrenci getirme hatası: {e}")
        return jsonify({'error': str(e)}), 500

@admin_routes.route('/users', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        
        # Gerekli alanları kontrol et
        if not data or 'mail' not in data or 'role' not in data or 'ad' not in data or 'soyad' not in data:
            return jsonify({'error': 'Eksik bilgi. Mail, rol, ad ve soyad gerekli.'}), 400
            
        # Öğrenci için özel kontrol
        if data['role'] == 'student' and 'ogrno' not in data:
            return jsonify({'error': 'Öğrenci için öğrenci numarası gerekli.'}), 400
            
        # Öğretmen için özel kontrol
        if data['role'] == 'teacher' and 'sifre' not in data:
            return jsonify({'error': 'Şifre gerekli.'}), 400
            
        # E-posta kullanılıyor mu kontrol et
        existing_user = db.users.find_one({"mail": data['mail']})
        if existing_user:
            return jsonify({'error': 'Bu e-posta adresi zaten kullanılıyor.'}), 400
            
        # Öğrenci numarası kullanılıyor mu kontrol et
        if data['role'] == 'student':
            existing_student = db.users.find_one({"ogrno": data['ogrno']})
            if existing_student:
                return jsonify({'error': 'Bu öğrenci numarası zaten kullanılıyor.'}), 400
        
        # Yeni kullanıcı oluştur
        new_user = {
            "mail": data['mail'],
            "role": data['role'],
            "ad": data['ad'],
            "soyad": data['soyad'],
            "sifre": data.get('sifre', '123456')  # Varsayılan şifre
        }
        
        # Rol tipine göre ekstra alanlar ekle
        if data['role'] == 'student':
            new_user["ogrno"] = data['ogrno']
        elif data['role'] == 'teacher':
            new_user["telno"] = data.get('telno', '')
            
        result = db.users.insert_one(new_user)
        
        return jsonify({
            'message': 'Kullanıcı başarıyla oluşturuldu',
            'id': str(result.inserted_id)
        })
        
    except Exception as e:
        print(f"Kullanıcı oluşturma hatası: {e}")
        return jsonify({'error': str(e)}), 500

@admin_routes.route('/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        data = request.get_json()
        
        # Gerekli alanları kontrol et
        if not data or 'mail' not in data or 'role' not in data or 'ad' not in data or 'soyad' not in data:
            return jsonify({'error': 'Eksik bilgi. Mail, rol, ad ve soyad gerekli.'}), 400
            
        # ObjectId dönüştürme
        user_obj_id = ObjectId(user_id)
        
        # Mevcut kullanıcıyı bul
        existing_user = db.users.find_one({"_id": user_obj_id})
        if not existing_user:
            return jsonify({'error': 'Kullanıcı bulunamadı.'}), 404
            
        # E-posta kullanılıyor mu kontrol et
        mail_check = db.users.find_one({"mail": data['mail'], "_id": {"$ne": user_obj_id}})
        if mail_check:
            return jsonify({'error': 'Bu e-posta adresi zaten başka bir kullanıcı tarafından kullanılıyor.'}), 400
            
        # Öğrenci numarası kullanılıyor mu kontrol et
        if data['role'] == 'student' and 'ogrno' in data:
            ogrno_check = db.users.find_one({"ogrno": data['ogrno'], "_id": {"$ne": user_obj_id}})
            if ogrno_check:
                return jsonify({'error': 'Bu öğrenci numarası zaten başka bir öğrenci tarafından kullanılıyor.'}), 400
        
        # Güncellenecek alanlar
        update_fields = {
            "mail": data['mail'],
            "ad": data['ad'],
            "soyad": data['soyad'],
        }
        
        # Rol tipine göre ekstra alanları güncelle
        if data['role'] == 'student' and 'ogrno' in data:
            update_fields["ogrno"] = data['ogrno']
        elif data['role'] == 'teacher' and 'telno' in data:
            update_fields["telno"] = data['telno']
            
        # Şifre sadece verilmişse güncellenir
        if 'sifre' in data and data['sifre']:
            update_fields["sifre"] = data['sifre']
            
        result = db.users.update_one(
            {"_id": user_obj_id},
            {"$set": update_fields}
        )
        
        return jsonify({'message': 'Kullanıcı başarıyla güncellendi'})
        
    except Exception as e:
        print(f"Kullanıcı güncelleme hatası: {e}")
        return jsonify({'error': str(e)}), 500

@admin_routes.route('/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        # ObjectId dönüştürme
        user_obj_id = ObjectId(user_id)
        
        # Kullanıcıyı bul
        user = db.users.find_one({"_id": user_obj_id})
        if not user:
            return jsonify({'error': 'Kullanıcı bulunamadı.'}), 404
        
        # Öğretmen ise, kendi verdiği derslerdeki yoklamaları kontrol et
        if user['role'] == 'teacher':
            # Bu öğretmenin verdiği dersleri bul
            teacher_courses = list(db.courses.find({"ogretmenler": user['mail']}))
            
            # Eğer dersler varsa ve tek öğretmen ise, uyarı ver
            for course in teacher_courses:
                if len(course['ogretmenler']) == 1:
                    return jsonify({
                        'error': f"Bu öğretmen {course['dersKodu']} dersinin tek öğretmenidir. " +
                                  "Silmeden önce dersi başka bir öğretmene aktarın veya dersi silin."
                    }), 400
            
            # Birden fazla öğretmeni olan derslerin öğretmen listesinden çıkar
            db.courses.update_many(
                {"ogretmenler": user['mail']},
                {"$pull": {"ogretmenler": user['mail']}}
            )
            
            # Öğretmenin aktif yoklamalarını iptal et
            db.attendance.update_many(
                {"ogretmenMail": user['mail'], "durum": "aktif"},
                {"$set": {"durum": "iptal edildi"}}
            )
        
        # Öğrenci ise, derslerdeki öğrenci listelerinden çıkar
        if user['role'] == 'student' and 'ogrno' in user:
            db.courses.update_many(
                {"ogrenciler": user['ogrno']},
                {"$pull": {"ogrenciler": user['ogrno']}}
            )
        
        # Kullanıcıyı sil
        result = db.users.delete_one({"_id": user_obj_id})
        
        return jsonify({'message': 'Kullanıcı başarıyla silindi'})
        
    except Exception as e:
        print(f"Kullanıcı silme hatası: {e}")
        return jsonify({'error': str(e)}), 500

# Attendance
@admin_routes.route('/attendance', methods=['GET'])
def get_all_attendance():
    try:
        attendance_data = list(db.attendance.find().sort("tarih", -1))
        return jsonify(parse_json(attendance_data))
    except Exception as e:
        print(f"Yoklama verileri getirme hatası: {e}")
        return jsonify({'error': str(e)}), 500

@admin_routes.route('/attendance/<attendance_id>', methods=['GET'])
def get_attendance_details(attendance_id):
    try:
        print(f"Fetching attendance details for ID: {attendance_id}")
        # ObjectId dönüştürme - handle validation
        try:
            attendance_obj_id = ObjectId(attendance_id)
        except Exception as e:
            print(f"Invalid ObjectId: {attendance_id}, Error: {str(e)}")
            return jsonify({'error': f"Geçersiz ID formatı: {str(e)}"}), 400
        
        # Yoklama kaydını bul
        attendance = db.attendance.find_one({"_id": attendance_obj_id})
        if not attendance:
            print(f"Attendance record not found for ID: {attendance_id}")
            return jsonify({'error': 'Yoklama kaydı bulunamadı.'}), 404
        
        print(f"Found attendance record with ID {attendance_id}")
            
        # Öğrenci detaylarını ekle
        ogrenci_detaylari = []
        for ogrenci_no in attendance['tumOgrenciler']:
            ogrenci = db.users.find_one({"ogrno": ogrenci_no})
            
            if ogrenci:
                ogrenci_detaylari.append({
                    "ogrenciNo": ogrenci_no,
                    "adSoyad": f"{ogrenci['ad']} {ogrenci['soyad']}",
                    "mail": ogrenci['mail'],
                    "katildi": ogrenci_no in attendance.get('katilanlar', [])
                })
            else:
                # Öğrenci bulunamazsa sadece numarasını ekle
                ogrenci_detaylari.append({
                    "ogrenciNo": ogrenci_no,
                    "adSoyad": f"Öğrenci (#{ogrenci_no})",
                    "katildi": ogrenci_no in attendance.get('katilanlar', [])
                })
        
        print(f"Added {len(ogrenci_detaylari)} student details")
        
        # Öğretmen bilgilerini ekle
        ogretmen = db.users.find_one({"mail": attendance['ogretmenMail']})
        
        # Convert MongoDB document to JSON-serializable object
        attendance_dict = json.loads(json_util.dumps(attendance))
        
        result = {
            **attendance_dict,
            "ogrenciDetaylari": ogrenci_detaylari,
            "ogretmenAdi": f"{ogretmen['ad']} {ogretmen['soyad']}" if ogretmen else "Bilinmeyen",
            "katilimOrani": f"{len(attendance.get('katilanlar', [])) * 100 / len(attendance['tumOgrenciler']):.1f}%" if len(attendance['tumOgrenciler']) > 0 else "0%"
        }
        
        return jsonify(result)
            
    except Exception as e:
        print(f"Error getting attendance details: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@admin_routes.route('/attendance/<attendance_id>', methods=['PUT'])
def update_attendance(attendance_id):
    try:
        data = request.get_json()
        
        # ObjectId dönüştürme
        attendance_obj_id = ObjectId(attendance_id)
        
        # Yoklama kaydını bul
        attendance = db.attendance.find_one({"_id": attendance_obj_id})
        if not attendance:
            return jsonify({'error': 'Yoklama kaydı bulunamadı.'}), 404
            
        # Güncelleme yapılacak alanlar
        update_fields = {}
        
        # Katılanlar listesini güncelle (varsa)
        if 'katilanlar' in data:
            update_fields["katilanlar"] = data['katilanlar']
            
            # Katılmayanları da güncelle
            if 'tumOgrenciler' in attendance:
                update_fields["katilmayanlar"] = list(set(attendance['tumOgrenciler']) - set(data['katilanlar']))
            
        # Durumu güncelle (varsa)
        if 'durum' in data:
            update_fields["durum"] = data['durum']
        
        # Güncelle
        if update_fields:
            result = db.attendance.update_one(
                {"_id": attendance_obj_id},
                {"$set": update_fields}
            )
            
            return jsonify({'message': 'Yoklama kaydı başarıyla güncellendi'})
        else:
            return jsonify({'message': 'Güncellenecek alan bulunamadı'})
            
    except Exception as e:
        print(f"Yoklama güncelleme hatası: {e}")
        return jsonify({'error': str(e)}), 500

@admin_routes.route('/attendance/<attendance_id>', methods=['DELETE'])
def delete_attendance(attendance_id):
    try:
        # ObjectId dönüştürme
        attendance_obj_id = ObjectId(attendance_id)
        
        # Yoklama kaydını sil
        result = db.attendance.delete_one({"_id": attendance_obj_id})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Yoklama kaydı bulunamadı.'}), 404
            
        return jsonify({'message': 'Yoklama kaydı başarıyla silindi'})
            
    except Exception as e:
        print(f"Yoklama silme hatası: {e}")
        return jsonify({'error': str(e)}), 500

# Dashboard stats
@admin_routes.route('/stats', methods=['GET'])
def get_admin_stats():
    try:
        # Toplam sayıları bul
        course_count = db.courses.count_documents({})
        teacher_count = db.users.count_documents({"role": "teacher"})
        student_count = db.users.count_documents({"role": "student"})
        attendance_count = db.attendance.count_documents({})
        
        # Aktif yoklama sayısı
        active_attendance_count = db.attendance.count_documents({"durum": "aktif"})
        
        # Son 7 gündeki yoklama sayısı
        one_week_ago = datetime.now() - timedelta(days=7)
        recent_attendance_count = db.attendance.count_documents({"tarih": {"$gt": one_week_ago}})
        
        return jsonify({
            "courseCount": course_count,
            "teacherCount": teacher_count,
            "studentCount": student_count,
            "attendanceCount": attendance_count,
            "activeAttendanceCount": active_attendance_count,
            "recentAttendanceCount": recent_attendance_count
        })
            
    except Exception as e:
        print(f"İstatistik getirme hatası: {e}")
        return jsonify({'error': str(e)}), 500 