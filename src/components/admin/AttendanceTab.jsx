import React from 'react';

const AttendanceTab = ({
  attendanceData,
  teachers,
  expandedCourse,
  toggleCourseExpansion,
  onEditAttendanceClick,
  // Helper fonksiyonu props olarak alıyoruz
  parseMongoDate,
  // Modal için props'lar
  isModalOpen,
  closeModal,
  currentAttendance,
  studentAttendance,
  updateStudentAttendance,
  saveAttendanceChanges
}) => {
  return (
    <div className="content-container">
      <div className="level">
        <div className="level-left"><div className="level-item"><h2 className="title is-4">Yoklama Verileri</h2></div></div>
      </div>
      
      {attendanceData.length === 0 ? (
        <div className="notification is-info is-light">Henüz yoklama verisi bulunmamaktadır.</div>
      ) : (
        <div>
          {attendanceData.map((courseGroup) => (
            <div key={courseGroup.dersKodu} className="course-panel mb-4">
              <div className="course-header" onClick={() => toggleCourseExpansion(courseGroup.dersKodu)}>
                <div className="is-flex is-justify-content-space-between is-align-items-center py-2 px-3">
                  <div><span className="icon is-small mr-2"><i className="fas fa-book"></i></span><span className="has-text-weight-medium">{courseGroup.dersKodu} - {courseGroup.dersAdi}</span></div>
                  <div><span className="tag is-info is-light mr-2">{courseGroup.records.length} yoklama</span><span className="icon"><i className={`fas fa-chevron-${expandedCourse === courseGroup.dersKodu ? 'up' : 'down'}`}></i></span></div>
                </div>
              </div>
              
              {expandedCourse === courseGroup.dersKodu && (
                <div className="course-content">
                  <div className="table-container">
                    <table className="table is-fullwidth is-striped is-hoverable attendance-table">
                      <thead><tr><th>Tarih</th><th>Öğretmen</th><th>Durum</th><th>Katılım Oranı</th><th>İşlemler</th></tr></thead>
                      <tbody>
                        {courseGroup.records.map((attendance) => {
                          const katilimOrani = attendance.katilanlar?.length / attendance.tumOgrenciler?.length * 100 || 0;
                          const teacher = teachers.find(t => t.mail === attendance.ogretmenMail);
                          const parsedDate = parseMongoDate(attendance.tarih);
                          const formattedDate = parsedDate ? parsedDate.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Geçersiz Tarih";
                          
                          return (
                            <tr key={attendance._id.$oid || attendance._id}>
                              <td>{formattedDate}</td>
                              <td>{teacher ? `${teacher.ad} ${teacher.soyad}` : attendance.ogretmenMail}</td>
                              <td><span className={`tag ${attendance.durum === "aktif" ? "is-success" : "is-light"}`}>{attendance.durum === "aktif" ? "Aktif" : "Tamamlandı"}</span></td>
                              <td><progress className="progress is-small is-info" value={katilimOrani} max="100"></progress><span className="is-size-7">{`${Math.round(katilimOrani)}%`}</span></td>
                              <td><button className="button is-small is-info" onClick={() => onEditAttendanceClick(attendance)}><span className="icon"><i className="fas fa-edit"></i></span><span>Düzenle</span></button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* YOKLAMA DÜZENLEME MODAL'I */}
      <div className={`modal ${isModalOpen ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={closeModal}></div>
        <div className="modal-card attendance-edit-modal">
          <header className="modal-card-head"><p className="modal-card-title">Yoklama Düzenle</p><button className="delete" aria-label="close" onClick={closeModal}></button></header>
          <section className="modal-card-body">
            {currentAttendance && (
              <div>
                {/* ... Modal içeriği ... */}
                <table className="table is-fullwidth">
                  <thead><tr><th>Öğrenci No</th><th>Ad Soyad</th><th>Katılım</th></tr></thead>
                  <tbody>
                    {studentAttendance.map(student => (
                      <tr key={student.ogrenciNo}>
                        <td>{student.ogrenciNo}</td>
                        <td>{student.adSoyad}</td>
                        <td>
                          <input type="checkbox" className="switch is-rounded is-info" checked={student.katildi} onChange={(e) => updateStudentAttendance(student.ogrenciNo, e.target.checked)} id={`switch-${student.ogrenciNo}`} />
                          <label htmlFor={`switch-${student.ogrenciNo}`}>{student.katildi ? "Katıldı" : "Katılmadı"}</label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <footer className="modal-card-foot">
            <button className="button is-success" onClick={saveAttendanceChanges}><span className="icon"><i className="fas fa-save"></i></span><span>Kaydet</span></button>
            <button className="button" onClick={closeModal}>İptal</button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTab;