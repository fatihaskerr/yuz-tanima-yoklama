import React, { useState, useEffect } from "react";
import AttendanceTracking from './AttendanceTracking';
import FaceVerification from './FaceVerification';

const StudentPanel = ({ user, onLogout }) => {
  const [activeCourses, setActiveCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isSmsVerified, setIsSmsVerified] = useState(false);
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [showAttendanceTracking, setShowAttendanceTracking] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showFaceVerification, setShowFaceVerification] = useState(false);

  const fetchActiveCourses = async () => {
    try {
      console.log("[DEBUG] Aktif dersler isteniyor...");
      console.log("[DEBUG] Kullanıcı bilgileri:", user);

      if (!user || !user.ogrno) {
        console.log("[HATA] Kullanıcı bilgileri eksik!");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/attendance/active-courses/${user.ogrno}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("[DEBUG] API yanıtı:", response);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("[DEBUG] Backend'den gelen dersler ve katılım durumları:", data);
      data.forEach(course => {
        console.log(`[DEBUG] ${course.dersKodu}: katilimYapildi = ${course.katilimYapildi}`);
      });

      setActiveCourses(data);

    } catch (error) {
      console.error('[HATA] Aktif dersler yüklenirken hata:', error);
      setAlertMessage({
        severity: "error",
        text: "Aktif dersler yüklenirken bir hata oluştu."
      });
    }
  };

  useEffect(() => {
    fetchActiveCourses();
  }, [user]);

  useEffect(() => {
    let timer;
    if (showCodeInput && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowCodeInput(false);
            setVerificationCode('');
            setCountdown(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showCodeInput, countdown]);

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setIsAuthenticated(false);
    setShowPopup(true);
    setAlertMessage(null);
    setIsSmsVerified(false);
    setIsFaceVerified(false);
    setShowFaceVerification(false);
    setShowCodeInput(false);
    setVerificationCode('');
  };

  const handleEmailVerification = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/attendance/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.mail
        })
      });

      if (response.ok) {
        setShowCodeInput(true);
        setCountdown(300); // 5 dakika = 300 saniye
        setAlertMessage({
          severity: "success",
          text: "Doğrulama kodu e-posta adresinize gönderildi."
        });
      } else {
        throw new Error('E-posta gönderilemedi');
      }
    } catch (error) {
      setAlertMessage({
        severity: "error",
        text: "E-posta gönderilirken hata oluştu: " + error.message
      });
    }
  };

  const handleVerifyCode = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/attendance/verify-email-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.mail,
          code: verificationCode
        })
      });

      if (response.ok) {
        setIsSmsVerified(true);
        setShowCodeInput(false);
        setVerificationCode('');
        setAlertMessage({
          severity: "success",
          text: "E-posta doğrulaması başarıyla tamamlandı."
        });
      } else {
        throw new Error('Geçersiz kod');
      }
    } catch (error) {
      setAlertMessage({
        severity: "error",
        text: "Kod doğrulanırken hata oluştu: " + error.message
      });
    }
  };

  const handleFaceVerification = () => {
    setShowFaceVerification(true);
  };

  const handleFaceSuccess = (data) => {
    setIsFaceVerified(true);
    setShowFaceVerification(false);
    setAlertMessage({
      severity: "success",
      text: "Yüz tanıma doğrulaması başarıyla tamamlandı.",
    });
  };

  const handleFaceError = (error) => {
    setAlertMessage({
      severity: "error",
      text: "Yüz tanıma doğrulaması başarısız: " + error.message,
    });
  };

  const handleFaceCancel = () => {
    setShowFaceVerification(false);
  };

  const handleAuthentication = async () => {
    if (isSmsVerified && isFaceVerified) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/attendance/verify-attendance/${selectedCourse._id}/${user.ogrno}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (response.ok) {
          setIsAuthenticated(true);
          setShowPopup(false);

          await fetchActiveCourses();

          setAlertMessage({
            severity: "success",
            text: `${selectedCourse.dersAdi} dersine başarıyla giriş yaptınız.`
          });
        } else {
          throw new Error('Yoklama kaydı başarısız');
        }
      } catch (error) {
        setAlertMessage({
          severity: "error",
          text: "Yoklama kaydı yapılırken hata oluştu: " + error.message
        });
      }
    } else {
      setAlertMessage({
        severity: "warning",
        text: "Lütfen tüm doğrulamaları tamamlayın."
      });
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setIsSmsVerified(false);
    setIsFaceVerified(false);
    setAlertMessage(null);
  };

  const clearAlert = () => {
    setAlertMessage(null);
  };

  return (
    <>
      <div className="container">
        <p className="subtitle has-text-centered mb-4">
          Merhaba, {user.username}
        </p>

        <h2 className="title is-5 has-text-centered mb-4">
          <span className="icon-text">
            <span className="icon">
              <i className="fas fa-book"></i>
            </span>
            <span>Aktif Dersler</span>
          </span>
        </h2>

        {/* Aktif Dersler Listesi */}
        {activeCourses.length === 0 ? (
          <div className="notification is-info is-light has-text-centered">
            <span className="icon-text">
              <span className="icon">
                <i className="fas fa-info-circle"></i>
              </span>
              <span>Aktif dersiniz bulunmamaktadır.</span>
            </span>
          </div>
        ) : (
          <div className="list has-hoverable-list-items">
            {activeCourses.map((course) => (
              <div key={course._id} className="list-item" style={{ marginBottom: '1rem' }}>
                <div className="level is-mobile">
                  <div className="level-left" style={{ flex: 1 }}>
                    <div className="level-item" style={{ width: '100%' }}>
                      <div style={{ width: '100%' }}>
                        <div className="is-flex is-justify-content-space-between is-align-items-center mb-1">
                          <div style={{ flex: 1, marginRight: '1rem', overflow: 'hidden' }}>
                            <p className="mb-0" style={{
                              wordBreak: 'break-word',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {course.dersKodu} - {course.dersAdi}
                            </p>
                          </div>
                          <div style={{ flexShrink: 0 }}>
                            <button
                              className={`button ${course.katilimYapildi ? 'is-light' : 'is-primary'}`}
                              onClick={() => handleCourseSelect(course)}
                              disabled={course.katilimYapildi}
                              style={course.katilimYapildi ? {
                                backgroundColor: '#f5f5f5',
                                color: '#7a7a7a'
                              } : {}}
                            >
                              {course.katilimYapildi ? 'Derse Katılındı' : 'Derse Katıl'}
                            </button>
                          </div>
                        </div>
                        <div className="is-size-7 has-text-grey mt-2">
                          <p className="mb-1">
                            <span className="icon-text">
                              <span className="icon">
                                <i className="fas fa-user-tie"></i>
                              </span>
                              <span>{course.ogretmenler?.[0]}</span>
                            </span>
                          </p>
                          {course.tarih && (
                            <p className="mb-0">
                              <span className="icon-text">
                                <span className="icon">
                                  <i className="fas fa-clock"></i>
                                </span>
                                <span>
                                  {(() => {
                                    const date = new Date(course.tarih);
                                    date.setHours(date.getHours() - 3);
                                    return date.toLocaleString('tr-TR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    });
                                  })()}
                                </span>
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
      <AttendanceTracking
        isActive={showAttendanceTracking}
        onClose={() => setShowAttendanceTracking(false)}
        studentId={user.ogrno}
      />

      {/* Doğrulama Modal */}
      <div className={`modal ${showPopup ? "is-active" : ""}`}>
        <div className="modal-background" onClick={closePopup}></div>
        <div className="modal-card" style={{ borderRadius: '6px' }}>
          <header className="modal-card-head" style={{ justifyContent: 'space-between' }}>
            <p className="modal-card-title">Doğrulama</p>
            <button className="button" onClick={closePopup}>Kapat</button>
          </header>
          <section className="modal-card-body">
            <div className="content">
              <h3 className="has-text-centered mb-4">
                {selectedCourse ? `${selectedCourse.dersKodu} - ${selectedCourse.dersAdi}` : ''} dersine giriş yapmak için doğrulama yapın.
              </h3>

              <div className="buttons is-flex is-flex-direction-column">
                {!showCodeInput ? (
                  <button
                    className={`button is-fullwidth ${isSmsVerified ? "is-light" : "is-info"
                      }`}
                    onClick={handleEmailVerification}
                    disabled={isSmsVerified}
                    style={isSmsVerified ? {
                      backgroundColor: '#f5f5f5',
                      color: '#7a7a7a'
                    } : {}}
                  >
                    {isSmsVerified ? "E-posta Doğrulandı" : "E-posta Doğrula"}
                  </button>
                ) : (
                  <>
                    <div className="field has-addons" style={{ marginBottom: '0.25rem' }}>
                      <div className="control is-expanded">
                        <input
                          className="input"
                          type="text"
                          placeholder="Doğrulama Kodu"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          style={{ marginBottom: 0 }}
                        />
                      </div>
                      <div className="control">
                        <button
                          className="button is-info"
                          onClick={handleVerifyCode}
                          style={{ marginBottom: 0 }}
                        >
                          Doğrula
                        </button>
                      </div>
                    </div>
                    <div className="has-text-centered" style={{
                      opacity: 0.7,
                      fontSize: '0.9rem',
                      color: '#666',
                      marginBottom: '0.15rem',
                      marginTop: '0.15rem'
                    }}>
                      Kalan süre: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                    </div>
                    <button
                      className="button is-text is-fullwidth"
                      onClick={handleEmailVerification}
                      style={{
                        opacity: 0.7,
                        fontSize: '0.9rem',
                        color: '#666',
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '0.15rem',
                        marginTop: 0,
                        marginBottom: 0,
                        height: 'auto',
                        minHeight: 'unset'
                      }}
                    >
                      Kodu Tekrar Yolla
                    </button>
                  </>
                )}

                {!showFaceVerification ? (
                  <button
                    className={`button is-fullwidth ${isFaceVerified ? "is-light" : "is-info"
                      }`}
                    onClick={handleFaceVerification}
                    disabled={isFaceVerified}
                    style={isFaceVerified ? {
                      backgroundColor: '#f5f5f5',
                      color: '#7a7a7a'
                    } : {}}
                  >
                    {isFaceVerified ? "Yüz Tanıma Doğrulandı" : "Yüz Tanıma Doğrula"}
                  </button>
                ) : (
                  <FaceVerification
                    courseId={selectedCourse?._id}
                    ogrenciId={user.ogrno} // 🟢 ÖĞRENCİ ID'Yİ GÖNDERİYORSUN
                    onSuccess={handleFaceSuccess}
                    onError={handleFaceError}
                    onCancel={handleFaceCancel}
                  />

                )}

                {isSmsVerified && isFaceVerified && (
                  <button
                    className="button is-primary is-fullwidth"
                    onClick={handleAuthentication}
                  >
                    Giriş Yap
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

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

export default StudentPanel;
