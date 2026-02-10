import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { getUsers, registerUser } from "../services/users";
import UserMenu from "../components/UserMenu";

function formatTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}

export default function Users() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createOk, setCreateOk] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "employee",
  });

  const canCreate = useMemo(
    () => ["admin", "ceo"].includes(user?.role),
    [user]
  );

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await getUsers();
      setItems(data);
    } catch (e) {
      setError("Не удалось загрузить список пользователей. Проверьте токен и работу backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!canCreate) return;

    const username = form.username.trim();
    const password = form.password.trim();
    const role = form.role;

    if (!username || !password) {
      setCreateError("Укажите логин и пароль.");
      setCreateOk("");
      return;
    }

    setCreating(true);
    setCreateError("");
    setCreateOk("");
    try {
      await registerUser({ username, password, role });
      setCreateOk(`Пользователь ${username} создан.`);
      setForm({ username: "", password: "", role: "employee" });
      await load();
    } catch (e2) {
      const detail = e2?.response?.data?.detail;
      setCreateError(detail || "Не удалось создать пользователя");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="brand">
            <div className="brand__title">Task Manager</div>
            <div className="brand__hint">пользователи и роли</div>
          </div>
          <div className="topbar__actions">
            <button className="btn btn--ghost" type="button" onClick={() => navigate("/")}>
              Доска
            </button>
            <UserMenu
              user={user}
              onRefresh={load}
              onLogout={() => {
                logout();
                navigate("/login");
              }}
            />
          </div>
        </div>
      </div>

      <div className="board">
        <div className="container">
          <div className="board__head">
            <div>
              <h1 className="board__title">Пользователи</h1>
              <div className="board__meta">
                Всего: {items.length}
              </div>
            </div>
            {canCreate && (
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => setCreateOpen((v) => !v)}
              >
                {createOpen ? "Скрыть форму" : "Новый пользователь"}
              </button>
            )}
          </div>

          {canCreate && createOpen && (
            <div className="panel create">
              <div className="panel__title">Создать пользователя</div>
              <form className="create__form" onSubmit={handleCreate}>
                <div className="create__grid">
                  <div className="field">
                    <div className="label">Логин</div>
                    <input
                      className="input"
                      value={form.username}
                      onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                      placeholder="new_user"
                    />
                  </div>
                  <div className="field">
                    <div className="label">Пароль</div>
                    <input
                      className="input"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="••••••"
                    />
                  </div>
                  <div className="field">
                    <div className="label">Роль</div>
                    <select
                      className="input"
                      value={form.role}
                      onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                    >
                      <option value="employee">employee</option>
                      <option value="manager">manager</option>
                      <option value="ceo">ceo</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                </div>
                {createError && <div className="auth-error">{createError}</div>}
                {createOk && <div className="auth-ok">{createOk}</div>}
                <div className="auth-actions">
                  <button className="btn btn--primary" type="submit" disabled={creating}>
                    {creating ? "Создание…" : "Создать"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="panel">
            {loading ? (
              <div>Загрузка…</div>
            ) : error ? (
              <div className="auth-error">{error}</div>
            ) : items.length === 0 ? (
              <div>Пользователи не найдены.</div>
            ) : (
              <div className="table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Пользователь</th>
                      <th>Роль</th>
                      {canCreate && <th>Пароль (hash)</th>}
                      <th>Создан</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.username}</td>
                        <td>{u.role}</td>
                        {canCreate && <td className="mono">{u.password_hash}</td>}
                        <td>{formatTime(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
