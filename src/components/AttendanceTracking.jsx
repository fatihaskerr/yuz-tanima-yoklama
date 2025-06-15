import React, { useState, useEffect } from 'react';

const AttendanceTracking = ({ isActive, onClose, studentId }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isActive) {
      fetchAttendanceData();
    }
  }, [isActive, studentId]);

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/attendance/student-tracking/${studentId}`);
      if (!response.ok) throw new Error('Veri getirilemedi');
      const data = await response.json();
      setAttendanceData(data);
    } catch (error) {
      console.error('Devamsızlık verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`modal ${isActive ? "is-active" : ""}`}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card" style={{ maxWidth: '800px', width: '90%', borderRadius: '6px' }}>
        <header className="modal-card-head" style={{ justifyContent: 'space-between', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}>
          <div className="modal-card-title">
            <h1 className="title is-4 mb-2">Devamsızlık Takibi</h1>
            <h2 className="subtitle is-6 has-text-grey mb-0">Ders Bazlı Katılım Durumu</h2>
          </div>
          <button className="button" onClick={onClose}>Kapat</button>
        </header>
        
        <section className="modal-card-body">
          {loading ? (
            <div className="has-text-centered">
              <span className="icon">
                <i className="fas fa-spinner fa-pulse"></i>
              </span>
              <span>Yükleniyor...</span>
            </div>
          ) : (
            <div className="content">
              <div className="table-container">
                <table className="table is-fullwidth is-hoverable">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th>Ders Kodu</th>
                      <th>Ders Adı</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Toplam Ders</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Katıldığı</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Katılmadığı</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Katılım Oranı</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((ders, index) => (
                      <tr key={ders.dersKodu}>
                        <td>{index + 1}</td>
                        <td>{ders.dersKodu}</td>
                        <td>{ders.dersAdi}</td>
                        <td className="has-text-centered">{ders.toplamDers}</td>
                        <td className="has-text-centered">{ders.katildigiDers}</td>
                        <td className="has-text-centered">{ders.katilmadigiDers}</td>
                        <td className="has-text-centered">
                          <span className={`tag ${
                            ders.katilimOrani >= 70 ? 'is-success' : 'is-danger'
                          } is-light`}>
                            %{ders.katilimOrani}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AttendanceTracking; 