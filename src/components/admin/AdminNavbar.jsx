import React from 'react';

const AdminNavbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar is-primary" role="navigation" aria-label="main navigation">
      <div className="container">
        <div className="navbar-brand">
          <a className="navbar-item py-2" href="#">
            <img src="/logo.png" alt="Üniversite Logosu" height="28" />
            <span className="has-text-weight-bold ml-2">e-Yoklama Admin</span>
          </a>
        </div>

        <div id="adminNavbar" className="navbar-menu is-active">
          <div className="navbar-end">
            <div className="navbar-item">
              <span className="has-text-weight-bold">{user.ad} {user.soyad}</span>
            </div>
            <div className="navbar-item">
              <div className="buttons">
                <button className="button is-light" onClick={onLogout}>
                  <span className="icon">
                    <i className="fas fa-sign-out-alt"></i>
                  </span>
                  <span>Çıkış Yap</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;