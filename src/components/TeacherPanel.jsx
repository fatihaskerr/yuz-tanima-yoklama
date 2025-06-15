import React, { useState, useEffect } from "react";
import html2pdf from 'html2pdf.js';
import TeacherAttendanceTracking from './TeacherAttendanceTracking';
import AttendanceModal from './AttendanceModal';

const TeacherPanel = ({ user, onLogout }) => {
  // Debug için eklenen loglar
  console.log("TeacherPanel'e gelen user:", user);
  console.log("TeacherPanel'e gelen user.mail:", user?.mail);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [attendanceStarted, setAttendanceStarted] = useState(false);
  const [attendanceList, setAttendanceList] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [courses, setCourses] = useState([]);
  const [currentAttendanceId, setCurrentAttendanceId] = useState(null);
  const [attendanceDetails, setAttendanceDetails] = useState({
    baslangicZamani: null,
    katilimOrani: 0,
    dersAdi: ''
  });
  const [showAttendanceTracking, setShowAttendanceTracking] = useState(false);
  const [isAdvanceMode, setIsAdvanceMode] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    // Öğretmenin derslerini getir
    const fetchTeacherCourses = async () => {
      try {
        console.log("Dersler için istek atılıyor:", user.mail);
        const response = await fetch(`http://localhost:5000/api/courses/teacher/${user.mail}`);
        console.log("Backend yanıtı:", response);
        const data = await response.json();
        console.log("Gelen dersler:", data);
        
        if (response.ok) {
          setCourses(data.courses);
        } else {
          setAlertMessage({
            severity: "error",
            text: "Dersler yüklenirken bir hata oluştu: " + (data.error || "Bilinmeyen hata")
          });
        }
      } catch (error) {
        console.error('Ders yükleme hatası:', error);
        setAlertMessage({
          severity: "error",
          text: "Dersler yüklenirken bir hata oluştu: " + error.message
        });
      }
    };

    if (user && user.mail) {
      console.log("useEffect tetiklendi, user.mail:", user.mail);
      fetchTeacherCourses();
    } else {
      console.log("useEffect tetiklendi fakat user.mail yok!");
    }
  }, [user?.mail]);

  // Süreli yoklamaları kontrol et
  useEffect(() => {
    if (attendanceStarted && currentAttendanceId) {
      const checkExpiredAttendance = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/courses/attendance/check-expired');
          const data = await response.json();
          
          if (response.ok && data.message.includes('1 yoklama')) {
            // Yoklama otomatik olarak bitti
            setAttendanceStarted(false);
            setCurrentAttendanceId(null);
            setAlertMessage({
              severity: "info",
              text: "Yoklama süresi doldu ve otomatik olarak sonlandırıldı."
            });
          }
        } catch (error) {
          console.error('Süre kontrolü hatası:', error);
        }
      };

      const interval = setInterval(checkExpiredAttendance, 10000); // Her 10 saniyede bir kontrol et
      return () => clearInterval(interval);
    }
  }, [attendanceStarted, currentAttendanceId]);

  useEffect(() => {
    // Öğretmenin aktif yoklamasını kontrol et
    const checkActiveAttendance = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/courses/active-attendance/${user.mail}`);
        const data = await response.json();
        
        if (response.ok && data.activeAttendance) {
          setSelectedCourse(data.activeAttendance.dersKodu);
          setAttendanceStarted(true);
          setCurrentAttendanceId(data.activeAttendance._id);
        }
      } catch (error) {
        console.error('Aktif yoklama kontrolü hatası:', error);
      }
    };

    if (user?.mail) {
      checkActiveAttendance();
    }
  }, [user?.mail]);

  // Geri sayım için useEffect
  useEffect(() => {
    let timer;
    if (attendanceStarted && isAdvanceMode && selectedDuration && startTime) {
      const endTime = new Date(startTime.getTime() + selectedDuration * 60000);
      
      timer = setInterval(() => {
        const now = new Date();
        const diff = endTime - now;
        
        if (diff <= 0) {
          clearInterval(timer);
          setRemainingTime(null);
          return;
        }
        
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [attendanceStarted, isAdvanceMode, selectedDuration, startTime]);

  const startOrEndAttendance = async () => {
    if (!selectedCourse) {
      setAlertMessage({ severity: "warning", text: "Lütfen bir ders seçin." });
      return;
    }

    // Seçili dersin adını bul
    const selectedCourseName = courses.find(course => course.kod === selectedCourse)?.ad;

    try {
      if (attendanceStarted && currentAttendanceId) {
        // Yoklamayı bitir
        const response = await fetch(`http://localhost:5000/api/courses/attendance/${currentAttendanceId}/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          setAlertMessage({
            severity: "info",
            text: `${selectedCourseName} için yoklama bitirildi.`
          });
          setAttendanceStarted(false);
          setCurrentAttendanceId(null);
          setStartTime(null);
          setRemainingTime(null);
        } else {
          throw new Error('Yoklama bitirilemedi');
        }
      } else {
        // Yeni yoklama başlat
        const response = await fetch('http://localhost:5000/api/courses/attendance/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dersKodu: selectedCourse,
            ogretmenMail: user.mail,
            isAdvanceMode: isAdvanceMode,
            duration: selectedDuration
          })
        });

        const data = await response.json();

        if (response.ok) {
          setAlertMessage({
            severity: "success",
            text: `${selectedCourseName} için yoklama başlatıldı.`
          });
          setAttendanceStarted(true);
          setCurrentAttendanceId(data.attendanceId);
          setStartTime(new Date());
        } else {
          throw new Error(data.error || 'Yoklama başlatılamadı');
        }
      }
    } catch (error) {
      console.error('Yoklama işlem hatası:', error);
      setAlertMessage({
        severity: "error",
        text: "Bir hata oluştu: " + error.message
      });
    }
  };

  const handleShowAttendanceList = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/courses/attendance/${currentAttendanceId}`);
      const data = await response.json();
      
      if (response.ok) {
        const katilimOrani = (data.katilanlar.length / data.tumOgrenciler.length * 100).toFixed(1);
        const dersAdi = courses.find(course => course.kod === selectedCourse)?.ad;

        // Aktif yoklama bilgisini al
        const activeAttendanceResponse = await fetch(`http://localhost:5000/api/courses/active-attendance/${user.mail}`);
        const activeData = await activeAttendanceResponse.json();
        
        // Tarihi UTC olarak parse et
        let tarih;
        if (activeData?.activeAttendance?.tarih) {
          const utcDate = new Date(activeData.activeAttendance.tarih);
          // 3 saat geri al
          tarih = new Date(utcDate.getTime() - (3 * 60 * 60 * 1000));
        } else {
          tarih = new Date();
        }

        setAttendanceDetails({
          baslangicZamani: tarih,
          katilimOrani: katilimOrani,
          dersAdi: activeData?.activeAttendance?.dersAdi || dersAdi
        });

        setAttendanceList({
          tumOgrenciler: data.tumOgrenciler,
          katilanlar: data.katilanlar
        });
        setOpenModal(true);
      } else {
        throw new Error('Yoklama listesi alınamadı');
      }
    } catch (error) {
      console.error("Hata:", error);
      setAlertMessage({
        severity: "error",
        text: "Liste yüklenirken hata oluştu: " + error.message
      });
    }
  };

  const handleAttendanceChange = async (ogrenci) => {
    const ogrenciAdSoyad = attendanceList.tumOgrenciler.find(
      o => o.ogrenciNo === ogrenci
    )?.adSoyad;

    if (window.confirm(`${ogrenciAdSoyad} için yoklama durumunu değiştirmek istediğinize emin misiniz?`)) {
      try {
        const response = await fetch(`http://localhost:5000/api/courses/attendance/${currentAttendanceId}/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ogrenci,
            isPresent: !attendanceList.katilanlar.includes(ogrenci)
          })
        });

        if (response.ok) {
          // Listeyi güncelle
          setAttendanceList(prevList => {
            const newKatilanlar = prevList.katilanlar.includes(ogrenci)
              ? prevList.katilanlar.filter(k => k !== ogrenci)
              : [...prevList.katilanlar, ogrenci];

            // Katılım oranını güncelle
            const yeniKatilimOrani = (newKatilanlar.length / prevList.tumOgrenciler.length * 100).toFixed(1);
            setAttendanceDetails(prev => ({
              ...prev,
              katilimOrani: yeniKatilimOrani
            }));

            return {
              ...prevList,
              katilanlar: newKatilanlar
            };
          });
        } else {
          throw new Error('Yoklama güncellenemedi');
        }
      } catch (error) {
        setAlertMessage({
          severity: "error",
          text: "Yoklama güncellenirken hata oluştu: " + error.message
        });
      }
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const clearAlert = () => {
    setAlertMessage(null);
  };

  const handlePdfDownload = () => {
    const element = document.getElementById('attendance-content');
    
    // Tarihi formatla (GG-AA-YYYY)
    const tarih = new Date(attendanceDetails.baslangicZamani)
      .toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\./g, '-');

    const opt = {
      margin: 1,
      filename: `${selectedCourse}-yoklama-listesi-${tarih}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <>
      <p className="subtitle has-text-centered">
        Hoşgeldiniz, {user.ad} {user.soyad}
      </p>

      {/* Geri Sayım Göstergesi */}
      {attendanceStarted && isAdvanceMode && remainingTime && (
        <div className="notification is-info is-light has-text-centered mb-4">
          <p className="title is-4">Kalan Süre: {remainingTime}</p>
        </div>
      )}

      {/* Ders Seçimi */}
      <div className="field">
        <label className="label">Ders Seç</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              disabled={attendanceStarted}
              style={{ opacity: attendanceStarted ? 0.6 : 1 }}
            >
              <option value="">Ders Seçiniz</option>
              {courses.map((course) => (
                <option key={course._id} value={course.kod}>
                  {course.kod} - {course.ad}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Süreli Yoklama Seçimi */}
      {!attendanceStarted && (
        <>
          <div className="field">
            <div className="control">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={isAdvanceMode}
                  onChange={(e) => {
                    setIsAdvanceMode(e.target.checked);
                    if (!e.target.checked) {
                      setSelectedDuration(null);
                    }
                  }}
                />
                {' '}Süreli Yoklama
              </label>
            </div>
          </div>

          {isAdvanceMode && (
            <div className="field">
              <div className="control">
                <div className="columns is-mobile">
                  <div className="column">
                    <button
                      className={`button is-fullwidth ${selectedDuration === 15 ? 'is-dark' : 'is-light'}`}
                      onClick={() => setSelectedDuration(15)}
                    >
                      15 Dakika
                    </button>
                  </div>
                  <div className="column">
                    <button
                      className={`button is-fullwidth ${selectedDuration === 50 ? 'is-dark' : 'is-light'}`}
                      onClick={() => setSelectedDuration(50)}
                    >
                      50 Dakika
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Yoklama Kontrolleri */}
      <div className="mt-5">
        {!attendanceStarted ? (
          <button
            className="button is-primary is-fullwidth"
            onClick={startOrEndAttendance}
            disabled={isAdvanceMode && !selectedDuration}
          >
            Yoklama Başlat
          </button>
        ) : (
          <div className="columns is-mobile">
            <div className="column">
              <button
                className="button is-danger is-fullwidth"
                onClick={startOrEndAttendance}
              >
                Yoklama Bitir
              </button>
            </div>
            <div className="column">
              <button
                className="button is-info is-fullwidth"
                onClick={handleShowAttendanceList}
              >
                Listeyi Gör
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Çıkış Butonu */}
      <div className="has-text-centered mt-5">
        <button
          className="button is-danger is-light"
          onClick={onLogout}
        >
          <span className="icon">
            <i className="fas fa-sign-out-alt"></i>
          </span>
          <span>Çıkış Yap</span>
        </button>
      </div>

      {/* Devamsızlık Takibi Butonu */}
      <div style={{
        position: 'fixed',
        left: '36px',
        bottom: '36px',
        zIndex: 29  
      }}>
        <button
          className="button is-info is-light"
          onClick={() => setShowAttendanceTracking(true)}
        >
          <span className="icon">
            <i className="fas fa-calendar-check"></i>
          </span>
          <span>Devamsızlık Takibi</span>
        </button>
      </div>

      {/* Devamsızlık Takibi Modal */}
      <TeacherAttendanceTracking 
        isActive={showAttendanceTracking}
        onClose={() => setShowAttendanceTracking(false)}
        teacherMail={user.mail}
      />

      {/* Yoklama Listesi Modal */}
      <AttendanceModal
        isActive={openModal}
        onClose={handleCloseModal}
        attendanceDetails={attendanceDetails}
        selectedCourse={selectedCourse}
        attendanceList={attendanceList}
        onAttendanceChange={handleAttendanceChange}
      />

      {/* Alert Mesajı */}
      {alertMessage && (
        <div className="notification-container">
          <div
            className={`message is-${alertMessage.severity}`}
            style={{
              position: "fixed",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              minWidth: "300px",
              margin: 0,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
            }}
          >
            <div className="message-body" style={{
              backgroundColor: alertMessage.severity === 'success' ? '#ebffef' : undefined
            }}>
              <button className="delete" style={{ float: 'right' }} onClick={clearAlert}></button>
              {alertMessage.text}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeacherPanel;
