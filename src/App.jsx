import React, { useState, useEffect } from "react";
import Login from "./components/login";
import TeacherPanel from "./components/TeacherPanel";
import StudentPanel from "./components/StudentPanel";
import AdminPanel from "./components/AdminPanel";
import "./styles/global.css";
import "bulma/css/bulma.min.css";

function App() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Role göre state güncelleme
    if (userData.role === "teacher") {
      // Öğretmen paneline yönlendir
      console.log("Öğretmen girişi yapıldı");
    } else if (userData.role === "student") {
      // Öğrenci paneline yönlendir
      console.log("Öğrenci girişi yapıldı");
    } else if (userData.role === "admin") {
      // Admin paneline yönlendir
      console.log("Admin girişi yapıldı");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const renderContent = () => {
    if (!user) {
      return (
        <div className="container">
          <div className="section">
            <div className="columns is-centered">
              <div className="column is-5-tablet is-4-desktop is-3-widescreen">
                <figure className="image is-96x96 mx-auto mb-5">
                  <img src="/logo.png" alt="Üniversite Logosu" />
                </figure>
                <h1 className="title has-text-centered">e-Yoklama</h1>
                <div className="box">
                  <Login onLogin={handleLogin} />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (user.role === "admin") {
      return <AdminPanel user={user} onLogout={handleLogout} />;
    } else {
      return (
        <div className="container">
          <div className="section">
            <div className="columns is-centered">
              <div className="column is-4">
                <figure className="image is-96x96 mx-auto mb-5">
                  <img src="/logo.png" alt="Üniversite Logosu" />
                </figure>
                <h1 className="title has-text-centered">e-Yoklama</h1>
                <div className="box">
                  {user.role === "teacher" ? (
                    <TeacherPanel user={user} onLogout={handleLogout} />
                  ) : (
                    <StudentPanel user={user} ogrenciId={user?.ogrno} onLogout={handleLogout} />

                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };
  
  return renderContent();
}

export default App;
