import React, { useState, useEffect } from 'react';

const TeacherAttendanceTracking = ({ isActive, onClose, teacherMail }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [courseAttendanceData, setCourseAttendanceData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isActive) {
      fetchTeacherCourses();
    }
  }, [isActive]);

  const fetchTeacherCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5000/api/courses/teacher/${teacherMail}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Dersler getirilemedi');
      }
      
      const data = await response.json();
      
      if (!data.courses || !Array.isArray(data.courses)) {
        throw new Error('Geçersiz ders verisi');
      }
      
      setCourses(data.courses);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseAttendance = async (courseCode) => {
    try {
      setError(null);
      
      const response = await fetch(`http://localhost:5000/api/attendance/teacher-tracking/${teacherMail}/${courseCode}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Veri getirilemedi');
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Geçersiz devamsızlık verisi');
      }
      
      setCourseAttendanceData(prev => ({
        ...prev,
        [courseCode]: data
      }));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCourseClick = (courseCode) => {
    if (expandedCourse === courseCode) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(courseCode);
      if (!courseAttendanceData[courseCode]) {
        fetchCourseAttendance(courseCode);
      }
    }
  };

  return (
    <div className={`modal ${isActive ? "is-active" : ""}`}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card" style={{ 
        maxWidth: '800px', 
        width: '90%', 
        borderRadius: '6px',
        backgroundColor: '#fff',
        color: '#363636'
      }}>
        <header className="modal-card-head" style={{ 
          justifyContent: 'space-between', 
          borderTopLeftRadius: '6px', 
          borderTopRightRadius: '6px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #dbdbdb'
        }}>
          <div className="modal-card-title">
            <h1 className="title is-4 mb-2" style={{ color: '#363636' }}>Devamsızlık Takibi</h1>
            <h2 className="subtitle is-6 has-text-grey mb-0">Ders Bazlı Öğrenci Katılım Durumu</h2>
          </div>
          <button className="button" onClick={onClose}>Kapat</button>
        </header>
        
        <section className="modal-card-body" style={{ backgroundColor: '#fff' }}>
          {error && (
            <div className="notification is-danger is-light mb-4">
              <button className="delete" onClick={() => setError(null)}></button>
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="has-text-centered">
              <span className="icon">
                <i className="fas fa-spinner fa-pulse"></i>
              </span>
              <span>Yükleniyor...</span>
            </div>
          ) : (
            <div className="content">
              {courses.length === 0 ? (
                <div className="notification is-info is-light">
                  Henüz ders bulunmamaktadır.
                </div>
              ) : (
                <div className="accordion">
                  {courses.map((course) => (
                    <div key={course._id} className="box mb-2">
                      <div 
                        className="is-flex is-justify-content-space-between is-align-items-center"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleCourseClick(course.kod)}
                      >
                        <div>
                          <h3 className="title is-5 mb-0">{course.kod} - {course.ad}</h3>
                        </div>
                        <span className="icon">
                          <i className={`fas fa-chevron-${expandedCourse === course.kod ? 'up' : 'down'}`}></i>
                        </span>
                      </div>

                      {expandedCourse === course.kod && (
                        <div className="mt-4">
                          {!courseAttendanceData[course.kod] ? (
                            <div className="has-text-centered">
                              <span className="icon">
                                <i className="fas fa-spinner fa-pulse"></i>
                              </span>
                              <span>Yükleniyor...</span>
                            </div>
                          ) : courseAttendanceData[course.kod].length === 0 ? (
                            <div className="notification is-info is-light">
                              Bu ders için henüz yoklama kaydı bulunmamaktadır.
                            </div>
                          ) : (
                            <div className="table-container">
                              <table className="table is-fullwidth is-hoverable">
                                <thead>
                                  <tr>
                                    <th style={{ width: '60px' }}>#</th>
                                    <th>Öğrenci No</th>
                                    <th>Ad Soyad</th>
                                    <th style={{ width: '100px', textAlign: 'center' }}>Toplam Ders</th>
                                    <th style={{ width: '100px', textAlign: 'center' }}>Katıldığı</th>
                                    <th style={{ width: '100px', textAlign: 'center' }}>Katılmadığı</th>
                                    <th style={{ width: '120px', textAlign: 'center' }}>Katılım Oranı</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {courseAttendanceData[course.kod].map((ogrenci, index) => (
                                    <tr key={ogrenci.ogrenciNo}>
                                      <td>{index + 1}</td>
                                      <td>{ogrenci.ogrenciNo}</td>
                                      <td>{ogrenci.adSoyad}</td>
                                      <td className="has-text-centered">{ogrenci.toplamDers}</td>
                                      <td className="has-text-centered">{ogrenci.katildigiDers}</td>
                                      <td className="has-text-centered">{ogrenci.katilmadigiDers}</td>
                                      <td className="has-text-centered">
                                        <span className={`tag ${
                                          ogrenci.katilimOrani >= 70 ? 'is-success' : 'is-danger'
                                        } is-light`}>
                                          %{ogrenci.katilimOrani}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TeacherAttendanceTracking; 