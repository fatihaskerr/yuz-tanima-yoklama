import React, { useState, useEffect } from "react";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("rememberMe"));
    if (savedUser?.username) {
      setUsername(savedUser.username);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async () => {
    try {
      const loginData = {
        mail: username,
        sifre: password,
      };

      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();
      console.log("[DEBUG] Login yanıtı:", data);

      if (response.ok) {
        // Öğrenci numarasını sakla
        localStorage.setItem("ogrenciId", data.user.ogrno);
        console.log("[DEBUG] ogrenciId localStorage'a yazıldı:", data.user.ogrno);

        // Beni Hatırla
        if (rememberMe) {
          localStorage.setItem("rememberMe", JSON.stringify({ username }));
        } else {
          localStorage.removeItem("rememberMe");
        }

        // Giriş başarılıysa bilgileri onLogin ile ilet
        const userData = {
          mail: data.user.mail,
          role: data.user.role,
          ad: data.user.ad,
          soyad: data.user.soyad,
          ogrno: data.user.ogrno,
          username: `${data.user.ad} ${data.user.soyad}`,
        };

        onLogin(userData);
      } else {
        setError(data.error || "Giriş başarısız");
      }
    } catch (err) {
      console.error("[ERROR] Login:", err);
      setError("Bağlantı hatası: " + err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <>
      {error && (
        <div className="message is-danger">
          <div className="message-body">
            <button className="delete" onClick={() => setError("")}></button>
            {error}
          </div>
        </div>
      )}

      <p className="subtitle has-text-centered is-6 mb-4">
        Hoşgeldiniz, yoklama sistemine giriş yapınız.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <div className="control">
            <input
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Kurumsal e-postanızı girin"
              required
            />
          </div>
        </div>

        <div className="field">
          <div className="control has-icons-right">
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              required
            />
            <span
              className="icon is-small is-right"
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: "pointer" }}
            >
              <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
            </span>
          </div>
        </div>

        <div className="field">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />{" "}
            Beni Hatırla
          </label>
        </div>

        <div className="field">
          <button type="submit" className="button is-primary is-fullwidth">
            Giriş Yap
          </button>
        </div>
      </form>
    </>
  );
};

export default Login;
