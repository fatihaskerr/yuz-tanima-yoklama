import React from 'react';

const StudentsTab = ({
  students,
  onAddNewClick,
  onEditClick,
  onDeleteClick,
  onFaceUploadClick,
  isModalOpen,
  closeModal,
  studentData,
  setStudentData,
  handleSaveStudent,
}) => {
  return (
    <div className="content-container">
      {/* BAŞLIK */}
      <div className="level">
        <div className="level-left">
          <div className="level-item"><h2 className="title is-4">Öğrenciler</h2></div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <button className="button is-primary" onClick={onAddNewClick}>
              <span className="icon"><i className="fas fa-plus"></i></span>
              <span>Yeni Öğrenci Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLO */}
      <div className="table-container">
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th>Öğrenci No</th>
              <th>Ad</th>
              <th>Soyad</th>
              <th>E-posta</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student._id?.$oid || student._id || `student-${student.ogrno || index}`}>
                <td>{student.ogrno}</td>
                <td>{student.ad}</td>
                <td>{student.soyad}</td>
                <td>{student.mail}</td>
                <td>
                  <div className="buttons are-small">
                    <button className="button is-link" onClick={() => onFaceUploadClick(student)} title="Yüz Verisi Ekle/Güncelle">
                      <span className="icon"><i className="fas fa-camera-retro"></i></span>
                    </button>
                    <button className="button is-info" onClick={() => onEditClick(student)}>
                      <span className="icon"><i className="fas fa-edit"></i></span>
                    </button>
                    <button className="button is-danger" onClick={() => onDeleteClick(student._id || student.ogrno)}>
                      <span className="icon"><i className="fas fa-trash"></i></span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      <div className={`modal ${isModalOpen ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={closeModal}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">{studentData._id ? "Öğrenci Düzenle" : "Yeni Öğrenci Ekle"}</p>
            <button className="delete" aria-label="close" onClick={closeModal}></button>
          </header>
          <section className="modal-card-body">
            <div className="field"><label className="label">Ad</label><div className="control"><input className="input" type="text" value={studentData.ad} onChange={(e) => setStudentData({ ...studentData, ad: e.target.value })} /></div></div>
            <div className="field"><label className="label">Soyad</label><div className="control"><input className="input" type="text" value={studentData.soyad} onChange={(e) => setStudentData({ ...studentData, soyad: e.target.value })} /></div></div>
            <div className="field"><label className="label">Öğrenci Numarası</label><div className="control"><input className="input" type="text" value={studentData.ogrno} onChange={(e) => setStudentData({ ...studentData, ogrno: e.target.value })} /></div></div>
            <div className="field"><label className="label">E-posta</label><div className="control"><input className="input" type="email" value={studentData.mail} onChange={(e) => setStudentData({ ...studentData, mail: e.target.value })} /></div></div>
            {!studentData._id && (<div className="field"><label className="label">Şifre</label><div className="control"><input className="input" type="password" value={studentData.sifre} onChange={(e) => setStudentData({ ...studentData, sifre: e.target.value })} /></div></div>)}
          </section>
          <footer className="modal-card-foot">
            <button className="button is-primary" onClick={handleSaveStudent}>{studentData._id ? "Güncelle" : "Ekle"}</button>
            <button className="button" onClick={closeModal}>İptal</button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default StudentsTab;
