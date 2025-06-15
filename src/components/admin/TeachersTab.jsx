import React from 'react';

const TeachersTab = ({
  teachers,
  onAddNewClick,
  onEditClick,
  onDeleteClick,
  isModalOpen,
  closeModal,
  teacherData,
  setTeacherData,
  handleSaveTeacher,
}) => {
  return (
    <div className="content-container">
      {/* BAŞLIK */}
      <div className="level">
        <div className="level-left">
          <div className="level-item"><h2 className="title is-4">Öğretmenler</h2></div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <button className="button is-primary" onClick={onAddNewClick}>
              <span className="icon"><i className="fas fa-plus"></i></span>
              <span>Yeni Öğretmen Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLO */}
      <div className="table-container">
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Soyad</th>
              <th>E-posta</th>
              <th>Telefon</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher, index) => {
              const key = teacher._id?.$oid || teacher._id || `teacher-${teacher.mail || index}`;
              return (
                <tr key={key}>
                  <td>{teacher.ad}</td>
                  <td>{teacher.soyad}</td>
                  <td>{teacher.mail}</td>
                  <td>{teacher.telno}</td>
                  <td>
                    <div className="buttons are-small">
                      <button className="button is-info" onClick={() => onEditClick(teacher)}>
                        <span className="icon"><i className="fas fa-edit"></i></span>
                      </button>
                      <button className="button is-danger" onClick={() => onDeleteClick(teacher._id?.$oid || teacher._id)}>
                        <span className="icon"><i className="fas fa-trash"></i></span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      <div className={`modal ${isModalOpen ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={closeModal}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">{teacherData._id ? "Öğretmen Düzenle" : "Yeni Öğretmen Ekle"}</p>
            <button className="delete" aria-label="close" onClick={closeModal}></button>
          </header>
          <section className="modal-card-body">
            <div className="field"><label className="label">Ad</label><div className="control"><input className="input" type="text" value={teacherData.ad} onChange={(e) => setTeacherData({ ...teacherData, ad: e.target.value })} /></div></div>
            <div className="field"><label className="label">Soyad</label><div className="control"><input className="input" type="text" value={teacherData.soyad} onChange={(e) => setTeacherData({ ...teacherData, soyad: e.target.value })} /></div></div>
            <div className="field"><label className="label">E-posta</label><div className="control"><input className="input" type="email" value={teacherData.mail} onChange={(e) => setTeacherData({ ...teacherData, mail: e.target.value })} /></div></div>
            {!teacherData._id && (<div className="field"><label className="label">Şifre</label><div className="control"><input className="input" type="password" value={teacherData.sifre} onChange={(e) => setTeacherData({ ...teacherData, sifre: e.target.value })} /></div></div>)}
            <div className="field"><label className="label">Telefon</label><div className="control"><input className="input" type="text" value={teacherData.telno} onChange={(e) => setTeacherData({ ...teacherData, telno: e.target.value })} /></div></div>
          </section>
          <footer className="modal-card-foot">
            <button className="button is-primary" onClick={handleSaveTeacher}>{teacherData._id ? "Güncelle" : "Ekle"}</button>
            <button className="button" onClick={closeModal}>İptal</button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TeachersTab;
