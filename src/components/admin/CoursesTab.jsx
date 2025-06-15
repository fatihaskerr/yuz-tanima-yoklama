import React from 'react';

const CoursesTab = ({
  courses,
  teachers,
  students,
  onAddNewClick,
  onEditClick,
  onDeleteClick,
  isModalOpen,
  closeModal,
  courseData,
  setCourseData,
  handleSaveCourse,
}) => {
  return (
    <div className="content-container">
      {/* BAŞLIK */}
      <div className="level">
        <div className="level-left">
          <div className="level-item"><h2 className="title is-4">Dersler</h2></div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <button className="button is-primary" onClick={onAddNewClick}>
              <span className="icon"><i className="fas fa-plus"></i></span>
              <span>Yeni Ders Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* DERS TABLOSU */}
      <div className="table-container">
        <table className="table is-fullwidth is-striped is-hoverable">
          <thead>
            <tr>
              <th>Ders Kodu</th>
              <th>Ders Adı</th>
              <th>Öğretmen Sayısı</th>
              <th>Öğrenci Sayısı</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course, index) => (
              <tr key={course._id?.$oid || course._id || `${course.dersKodu}-${index}`}>
                <td>{course.dersKodu}</td>
                <td>{course.dersAdi}</td>
                <td>{course.ogretmenler?.length || 0}</td>
                <td>{course.ogrenciler?.length || 0}</td>
                <td>
                  <div className="buttons are-small">
                    <button className="button is-info" onClick={() => onEditClick(course)}>
                      <span className="icon"><i className="fas fa-edit"></i></span>
                    </button>
                    <button className="button is-danger" onClick={() => onDeleteClick(course._id?.$oid || course._id)}>
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
            <p className="modal-card-title">
              {courseData._id ? "Ders Düzenle" : "Yeni Ders Ekle"}
            </p>
            <button className="delete" onClick={closeModal}></button>
          </header>
          <section className="modal-card-body">
            <div className="field">
              <label className="label">Ders Kodu</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  value={courseData.dersKodu}
                  onChange={(e) => setCourseData({ ...courseData, dersKodu: e.target.value })}
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Ders Adı</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  value={courseData.dersAdi}
                  onChange={(e) => setCourseData({ ...courseData, dersAdi: e.target.value })}
                  readOnly={!!courseData._id}
                />
                {courseData._id && (
                  <p className="help is-info">Mevcut ders adı değiştirilemez</p>
                )}
              </div>
            </div>

            <div className="field">
              <label className="label">Öğretmenler</label>
              <div className="control">
                <div className="select is-multiple is-fullwidth">
                  <select
                    multiple
                    value={courseData.ogretmenler || []}
                    onChange={(e) =>
                      setCourseData({
                        ...courseData,
                        ogretmenler: Array.from(e.target.selectedOptions, (option) => option.value),
                      })
                    }
                    size="4"
                  >
                    {teachers.map((teacher, index) => (
                      <option key={teacher.mail || `teacher-${index}`} value={teacher.mail}>
                        {teacher.ad} {teacher.soyad} ({teacher.mail})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="field">
              <label className="label">Öğrenciler</label>
              <div className="control">
                <div className="select is-multiple is-fullwidth">
                  <select
                    multiple
                    value={courseData.ogrenciler || []}
                    onChange={(e) =>
                      setCourseData({
                        ...courseData,
                        ogrenciler: Array.from(e.target.selectedOptions, (option) => option.value),
                      })
                    }
                    size="4"
                  >
                    {students.map((student, index) => (
                      <option key={student.ogrno || `student-${index}`} value={student.ogrno}>
                        {student.ad} {student.soyad} ({student.ogrno})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>
          <footer className="modal-card-foot">
            <button className="button is-primary" onClick={handleSaveCourse}>
              {courseData._id ? "Güncelle" : "Oluştur"}
            </button>
            <button className="button" onClick={closeModal}>İptal</button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default CoursesTab;
