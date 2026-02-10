import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../auth/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", {
        username,
        password,
      });

      login(res.data.access_token);
      navigate("/"); // ⬅️ переходим на доску
    } catch (err) {
      setError("Неверный логин или пароль");
    }
  };

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="auth-title">Вход</h1>
        <p className="auth-subtitle">
          Введите логин и пароль, чтобы открыть доску задач.
        </p>

        <div className="field">
          <div className="label">Логин</div>
          <input
            className="input"
            placeholder="например: ivan"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="field">
          <div className="label">Пароль</div>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-actions">
          <button className="btn btn--primary" type="submit">
            Войти
          </button>
        </div>
      </form>
    </div>
  );
}
