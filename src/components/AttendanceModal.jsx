import React from 'react';
import html2pdf from 'html2pdf.js';

const AttendanceModal = ({ 
  isActive, 
  onClose, 
  attendanceDetails, 
  selectedCourse, 
  attendanceList, 
  onAttendanceChange 
}) => {
  const handlePdfDownload = () => {
    const element = document.getElementById('attendance-content');
    
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
    <div className={`modal ${isActive ? "is-active" : ""}`}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card" style={{ maxWidth: '800px', width: '90%' }}>
        <header className="modal-card-head">
          <div className="modal-card-title">
            <h1 className="title is-4 mb-2">{attendanceDetails.dersAdi}</h1>
            <h2 className="subtitle is-6 has-text-grey mb-0">{selectedCourse} - Yoklama Listesi</h2>
          </div>
        </header>
        
        <section className="modal-card-body">
          <div id="attendance-content">
            {/* Yoklama Detayları */}
            <div className="box mb-4">
              <div className="columns is-mobile">
                <div className="column">
                  <p className="heading">Başlangıç Zamanı</p>
                  <p className="title is-5">
                    {attendanceDetails.baslangicZamani?.toLocaleString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="column has-text-centered">
                  <p className="heading">Toplam Öğrenci</p>
                  <p className="title is-5">{attendanceList.tumOgrenciler?.length || 0}</p>
                </div>
                <div className="column has-text-centered">
                  <p className="heading">Katılan Öğrenci</p>
                  <p className="title is-5">{attendanceList.katilanlar?.length || 0}</p>
                </div>
                <div className="column has-text-right">
                  <p className="heading">Katılım Oranı</p>
                  <p className="title is-5">%{attendanceDetails.katilimOrani}</p>
                </div>
              </div>
            </div>

            {/* Öğrenci Listesi */}
            {!attendanceList.tumOgrenciler?.length ? (
              <p className="has-text-centered">Henüz öğrenci kaydı yok.</p>
            ) : (
              <div className="content">
                <div className="table-container">
                  <table className="table is-fullwidth is-hoverable">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>#</th>
                        <th>Öğrenci No</th>
                        <th>Ad Soyad</th>
                        <th style={{ width: '150px' }}>Durum</th>
                        <th style={{ width: '100px' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceList.tumOgrenciler.map((ogrenci, index) => {
                        const isPresent = attendanceList.katilanlar.includes(ogrenci.ogrenciNo);
                        return (
                          <tr key={ogrenci.ogrenciNo}>
                            <td>{index + 1}</td>
                            <td>{ogrenci.ogrenciNo}</td>
                            <td>{ogrenci.adSoyad}</td>
                            <td>
                              <span className={`tag ${isPresent ? 'is-success' : 'is-warning'} is-light`}>
                                {isPresent ? 'Katıldı' : 'Katılmadı'}
                              </span>
                            </td>
                            <td>
                              <button 
                                className={`button is-small ${isPresent ? 'is-light' : 'is-info'}`}
                                onClick={() => onAttendanceChange(ogrenci.ogrenciNo)}
                                disabled={isPresent}
                                style={isPresent ? {
                                  backgroundColor: '#f5f5f5',
                                  color: '#7a7a7a'
                                } : {}}
                              >
                                {isPresent ? 'İşaretlendi' : 'İşaretle'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
        
        <footer className="modal-card-foot" style={{ justifyContent: 'space-between' }}>
          <button className="button" onClick={onClose}>Kapat</button>
          <button 
            className="button is-info"
            onClick={handlePdfDownload}
          >
            <span className="icon">
              <i className="fas fa-file-pdf"></i>
            </span>
            <span>PDF İndir</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AttendanceModal; 