// src/components/AdminPanel.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/admin.css";

// Diğer component'leri import ediyoruz. Onların kodları sende mevcut.
import AdminNavbar from './admin/AdminNavbar.jsx';
import AdminTabs from './admin/AdminTabs.jsx';
import CoursesTab from './admin/CoursesTab.jsx';
import TeachersTab from './admin/TeachersTab.jsx';
import StudentsTab from './admin/StudentsTab.jsx';
import AttendanceTab from './admin/AttendanceTab.jsx';
import FaceUploadModal from './admin/FaceUploadModal.jsx';

// Bu ana component, tüm state'i ve mantığı barındıran "orkestra şefidir".
const AdminPanel = ({ user, onLogout }) => {
  // =================================================================
  // --- STATE'LER (Tüm veriler ve durumlar burada saklanır) ---
  // =================================================================
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);

  // Modal'ların açık/kapalı durumları
  const [openCourseDialog, setOpenCourseDialog] = useState(false);
  const [openTeacherDialog, setOpenTeacherDialog] = useState(false);
  const [openStudentDialog, setOpenStudentDialog] = useState(false);
  const [openFaceUploadModal, setOpenFaceUploadModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  // Yoklama sekmesi için özel state
  const [expandedCourse, setExpandedCourse] = useState(null);

  // Form verilerini tutan state'ler
  const [courseData, setCourseData] = useState({ dersKodu: "", dersAdi: "", ogretmenler: [], ogrenciler: [] });
  const [teacherData, setTeacherData] = useState({ ad: "", soyad: "", mail: "", sifre: "", telno: "", role: "teacher" });
  const [studentData, setStudentData] = useState({ ad: "", soyad: "", mail: "", sifre: "", ogrno: "", role: "student" });

  // Yüz tanıma için özel state'ler
  const [currentStudentForFace, setCurrentStudentForFace] = useState(null);
  const [faceImageFile, setFaceImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Yoklama düzenleme için özel state'ler
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);

  // =================================================================
  // --- FONKSİYONLAR (Tüm mantık, API çağrıları ve işlemler) ---
  // =================================================================
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = () => {
    fetchCourses();
    fetchTeachers();
    fetchStudents();
    fetchAttendanceData();
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/courses");
      if (response.ok) setCourses(await response.json());
      else setError("Dersler yüklenirken bir hata oluştu.");
    } catch (err) { setError("Bağlantı hatası: " + err.message); }
    finally { setLoading(false); }
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/teachers");
      if (response.ok) setTeachers(await response.json());
      else setError("Öğretmenler yüklenirken bir hata oluştu.");
    } catch (err) { setError("Bağlantı hatası: " + err.message); }
    finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/students");
      if (response.ok) setStudents(await response.json());
      else setError("Öğrenciler yüklenirken bir hata oluştu.");
    } catch (err) { setError("Bağlantı hatası: " + err.message); }
    finally { setLoading(false); }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/attendance");
      if (response.ok) {
        const data = await response.json();
        const groupedData = data.reduce((acc, item) => {
          if (!acc[item.dersKodu]) acc[item.dersKodu] = { dersKodu: item.dersKodu, dersAdi: item.dersAdi, records: [] };
          acc[item.dersKodu].records.push(item);
          return acc;
        }, {});
        const groupedArray = Object.values(groupedData);
        groupedArray.forEach(group => group.records.sort((a, b) => new Date(b.tarih) - new Date(a.tarih)));
        setAttendanceData(groupedArray);
      } else {
        setError("Yoklama verileri yüklenirken bir hata oluştu.");
      }
    } catch (err) { setError("Bağlantı hatası: " + err.message); }
    finally { setLoading(false); }
  };

  // --- CRUD Fonksiyonları (Create, Read, Update, Delete) ---

  const handleCreateCourse = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/courses", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(courseData)
      });
      if (response.ok) {
        setSuccess("Ders başarıyla oluşturuldu."); fetchCourses(); setOpenCourseDialog(false);
      } else { const errData = await response.json(); setError(errData.error || "Ders oluşturulamadı."); }
    } catch (err) { setError("Bağlantı hatası: " + err.message); }
    finally { setLoading(false); }
  };

  const handleUpdateCourse = async (courseId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/courses/${courseId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(courseData)
      });
      if (response.ok) {
        setSuccess("Ders başarıyla güncellendi."); fetchCourses(); setOpenCourseDialog(false);
      } else { const errData = await response.json(); setError(errData.error || "Ders güncellenemedi."); }
    } catch (err) { setError("Bağlantı hatası: " + err.message); }
    finally { setLoading(false); }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Bu dersi silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/courses/${courseId}`, { method: "DELETE" });
      if (response.ok) { setSuccess("Ders başarıyla silindi."); fetchCourses(); }
      else { const errData = await response.json(); setError(errData.error || "Ders silinemedi."); }
    } catch (err) { setError("Bağlantı hatası: " + err.message); }
    finally { setLoading(false); }
  };

  const handleCreateTeacher = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(teacherData)
      });
      if (response.ok) {
        setSuccess("Öğretmen başarıyla eklendi."); fetchTeachers(); setOpenTeacherDialog(false);
      } else { const errData = await response.json(); setError(errData.error || "Öğretmen eklenemedi."); }
    } catch (err) { setError("Bağlantı hatası: " + err.message); }
    finally { setLoading(false); }
  };

  const handleUpdateTeacher = async (teacherId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${teacherId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(teacherData)
      });
      if (response.ok) {
        setSuccess("Öğretmen başarıyla güncellendi."); fetchTeachers(); setOpenTeacherDialog(false);
      } else { const errData = await response.json(); setError(errData.error || "Öğretmen güncellenemedi."); }
    } catch (err) { setError("Bağlantı hatası: " + err.message); }
    finally { setLoading(false); }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm("Bu öğretmeni silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${teacherId}`, { method: "DELETE" });
      if (response.ok) { setSuccess("Öğretmen başarıyla silindi."); fetchTeachers(); }
      else { const errData = await response.json(); setError(errData.error || "Öğretmen silinemedi."); }
    } catch (err) { setError("Bağlantı hatası: " + err.message); }
    finally { setLoading(false); }
  };

  const handleCreateStudent = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(studentData)
      });
      if (response.ok) {
        setSuccess("Öğrenci başarıyla eklendi."); fetchStudents(); setOpenStudentDialog(false);
      } else { const errData = await response.json(); setError(errData.error || "Öğrenci eklenemedi."); }
    } catch (err) { setError("Bağlantı hatası: " + err.message); }
    finally { setLoading(false); }
  };

  const handleUpdateStudent = async (studentId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${studentId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(studentData)
      });
      if (response.ok) {
        setSuccess("Öğrenci başarıyla güncellendi."); fetchStudents(); setOpenStudentDialog(false);
      } else { const errData = await response.json(); setError(errData.error || "Öğrenci güncellenemedi."); }
    } catch (err) { setError("Bağlantı hatası: " + err.message); }
    finally { setLoading(false); }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Bu öğrenciyi silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${studentId}`, { method: "DELETE" });
      if (response.ok) { setSuccess("Öğrenci başarıyla silindi."); fetchStudents(); }
      else { const errData = await response.json(); setError(errData.error || "Öğrenci silinemedi."); }
    } catch (err) { setError("Bağlantı hatası: " + err.message); }
    finally { setLoading(false); }
  };

  const handleFaceUpload = async () => {
    if (!faceImageFile) { setError("Lütfen bir resim dosyası seçin."); return; }
    setLoading(true); setError(""); setSuccess("");

    if (!currentStudentForFace) {
      setError("Öğrenci bilgisi eksik.");
      setLoading(false);
      return;
    }

    // Öğrenci ID'si olarak öğrenci numarasını kullan
    const studentId = currentStudentForFace.ogrno || "unknown";

    console.log("[DEBUG] Yüz yükleme başlatılıyor:", {
      studentId: studentId,
      studentInfo: `${currentStudentForFace.ad || ''} ${currentStudentForFace.soyad || ''}`,
      ogrno: currentStudentForFace.ogrno || '',
      fileName: faceImageFile.name,
      fileSize: faceImageFile.size,
      fileType: faceImageFile.type
    });

    const formData = new FormData();
    formData.append('file', faceImageFile);

    // Öğrenci bilgilerini form verisi olarak ekle
    formData.append('ogrno', currentStudentForFace.ogrno || '');
    formData.append('ad', currentStudentForFace.ad || '');
    formData.append('soyad', currentStudentForFace.soyad || '');

    try {
      console.log("[DEBUG] API isteği gönderiliyor");
      const response = await axios.post(
        `http://localhost:5000/api/attendance/face-upload/${studentId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log("[DEBUG] API yanıtı:", response.data);
      setSuccess(response.data.message || "Yüz verisi başarıyla yüklendi");
      setOpenFaceUploadModal(false);
      fetchStudents(); // Öğrenci listesini yenile
    } catch (err) {
      console.error("[ERROR] Yüz yükleme hatası:", err);

      let errorMessage = "Yüz verisi yüklenirken bir hata oluştu.";

      if (err.response) {
        // Sunucu yanıtı ile birlikte bir hata geldi
        console.error("[ERROR] Sunucu yanıtı:", err.response.data);
        errorMessage = err.response.data.error || errorMessage;
        console.error("[ERROR] Durum kodu:", err.response.status);
      } else if (err.request) {
        // İstek yapıldı ama yanıt alınamadı
        console.error("[ERROR] İstek yapıldı, yanıt alınamadı:", err.request);
        errorMessage = "Sunucudan yanıt alınamadı. Bağlantınızı kontrol edin.";
      } else {
        // İstek ayarlarında bir hata oldu
        console.error("[ERROR] İstek hatası:", err.message);
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAttendanceRecord = async (attendanceId, updatedData) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/attendance/${attendanceId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedData)
      });
      if (response.ok) {
        setSuccess("Yoklama kaydı güncellendi"); fetchAttendanceData();
      } else { const errData = await response.json(); setError(errData.error || "Yoklama güncellenemedi"); }
    } catch (error) { setError("Bağlantı hatası: " + error.message); }
    finally { setLoading(false); }
  };

  const loadAttendanceDetails = async (attendance) => {
    setLoading(true);
    try {
      const attendanceId = attendance._id.$oid || attendance._id;
      const response = await fetch(`http://localhost:5000/api/admin/attendance/${attendanceId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(`Yoklama detayları yüklenemedi: ${response.status} ${errorData.error || ''}`); return;
      }
      const data = await response.json();
      setCurrentAttendance(data);
      setStudentAttendance(data.ogrenciDetaylari || []);
      setShowAttendanceModal(true);
    } catch (error) { setError("Bağlantı hatası: " + error.message); }
    finally { setLoading(false); }
  };

  const updateStudentAttendance = (studentNo, isPresent) => {
    setStudentAttendance(prev => prev.map(s => s.ogrenciNo === studentNo ? { ...s, katildi: isPresent } : s));
  };

  const saveAttendanceChanges = () => {
    const presentStudents = studentAttendance
      .filter((s) => s.katildi)
      .map((s) => s.ogrenciNo);

    const attendanceId =
      currentAttendance?._id?.$oid || currentAttendance?._id;

    handleUpdateAttendanceRecord(attendanceId, {
      katilanlar: presentStudents,
    });

    setShowAttendanceModal(false);
  };


  // --- Yardımcı Fonksiyonlar ---
  const toggleCourseExpansion = (courseCode) => {
    setExpandedCourse(expandedCourse === courseCode ? null : courseCode);
  };

  const handleFaceImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFaceImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const parseMongoDate = (dateObj) => {
    if (!dateObj) return null;
    try {
      if (typeof dateObj === 'object' && dateObj.$date) return new Date(dateObj.$date);
      if (typeof dateObj === 'string') return new Date(dateObj);
      return new Date(dateObj);
    } catch (err) { return null; }
  };


  // =================================================================
  // --- RENDER BÖLÜMÜ (JSX) ---
  // =================================================================

  // Hangi sekmenin içeriğinin gösterileceğini belirleyen fonksiyon
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <CoursesTab
            courses={courses} teachers={teachers} students={students}
            onAddNewClick={() => {
              setCourseData({ dersKodu: "", dersAdi: "", ogretmenler: [], ogrenciler: [] });
              setOpenCourseDialog(true);
            }}
            onEditClick={(course) => {
              const plainId = course._id?.$oid || course._id;
              setCourseData({ ...course, _id: plainId });
              setOpenCourseDialog(true);
            }}
            onDeleteClick={handleDeleteCourse}
            isModalOpen={openCourseDialog}
            closeModal={() => setOpenCourseDialog(false)}
            courseData={courseData}
            setCourseData={setCourseData}
            handleSaveCourse={() => {
              const courseId = courseData._id?.$oid || courseData._id;
              return courseId ? handleUpdateCourse(courseId) : handleCreateCourse();
            }}
          />
        );
      case 1:
        return (
          <TeachersTab
            teachers={teachers}
            onAddNewClick={() => {
              setTeacherData({ ad: "", soyad: "", mail: "", sifre: "", telno: "", role: "teacher" });
              setOpenTeacherDialog(true);
            }}
            onEditClick={(teacher) => {
              const plainId = teacher._id?.$oid || teacher._id;
              setTeacherData({ ...teacher, _id: plainId });
              setOpenTeacherDialog(true);
            }}
            onDeleteClick={(teacherId) => {
              const plainId = teacherId?.$oid || teacherId;
              handleDeleteTeacher(plainId);
            }}
            isModalOpen={openTeacherDialog}
            closeModal={() => setOpenTeacherDialog(false)}
            teacherData={teacherData}
            setTeacherData={setTeacherData}
            handleSaveTeacher={() =>
              teacherData._id ? handleUpdateTeacher(teacherData._id) : handleCreateTeacher()
            }
          />
        );

      case 2:
        return (
          <StudentsTab
            students={students}
            onAddNewClick={() => { setStudentData({ ad: "", soyad: "", mail: "", sifre: "", ogrno: "", role: "student" }); setOpenStudentDialog(true); }}
            onEditClick={(student) => { setStudentData(student); setOpenStudentDialog(true); }}
            onDeleteClick={(studentId) => {
              const plainId = studentId?.$oid || studentId;
              handleDeleteStudent(plainId);
            }}
            onFaceUploadClick={(student) => { setCurrentStudentForFace(student); setFaceImageFile(null); setImagePreview(null); setOpenFaceUploadModal(true); setError(""); setSuccess(""); }}
            isModalOpen={openStudentDialog} closeModal={() => setOpenStudentDialog(false)}
            studentData={studentData} setStudentData={setStudentData}
            handleSaveStudent={() => studentData._id ? handleUpdateStudent(studentData._id) : handleCreateStudent()}
          />
        );
      case 3:
        return (
          <AttendanceTab
            attendanceData={attendanceData} teachers={teachers}
            expandedCourse={expandedCourse} toggleCourseExpansion={toggleCourseExpansion}
            onEditAttendanceClick={loadAttendanceDetails} parseMongoDate={parseMongoDate}
            isModalOpen={showAttendanceModal} closeModal={() => setShowAttendanceModal(false)}
            currentAttendance={currentAttendance} studentAttendance={studentAttendance}
            updateStudentAttendance={updateStudentAttendance} saveAttendanceChanges={saveAttendanceChanges}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-panel">
      <AdminNavbar user={user} onLogout={onLogout} />
      <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="container section pt-0 px-5 py-4">
        {loading && <progress className="progress is-small is-primary" max="100"></progress>}
        {error && <div className="notification is-danger"><button className="delete" onClick={() => setError("")}></button>{error}</div>}
        {success && <div className="notification is-success"><button className="delete" onClick={() => setSuccess("")}></button>{success}</div>}

        {renderTabContent()}
      </div>

      {/* Yüz Yükleme Modal'ı tüm sekmelerden bağımsız olarak burada render ediliyor. */}
      <FaceUploadModal
        isOpen={openFaceUploadModal}
        onClose={() => setOpenFaceUploadModal(false)}
        student={currentStudentForFace}
        onFileChange={handleFaceImageChange}
        onUpload={handleFaceUpload}
        imagePreview={imagePreview}
        isLoading={loading}
        file={faceImageFile}
      />
    </div>
  );
};

export default AdminPanel;