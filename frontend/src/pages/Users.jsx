import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { getUsers, registerUser, updateUser } from "../services/users";
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
  const [changeUserId, setChangeUserId] = useState("");
  const [changePassword, setChangePassword] = useState("");
  const [changeUsername, setChangeUsername] = useState("");
  const [changeRole, setChangeRole] = useState("employee");
  const [changeError, setChangeError] = useState("");
  const [changeOk, setChangeOk] = useState("");
  const [changing, setChanging] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);

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
      if (!changeUserId && data.length) {
        setChangeUserId(String(data[0].id));
      }
    } catch (e) {
      setError("Не удалось загрузить список пользователей. Проверьте токен и работу backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!canCreate) return;
    if (
      !changeUserId ||
      (!changePassword.trim() && !changeUsername.trim() && !changeRole)
    ) {
      setChangeError("Выберите пользователя и заполните хотя бы одно поле.");
      setChangeOk("");
      return;
    }
    setChanging(true);
    setChangeError("");
    setChangeOk("");
    try {
      const payload = {};
      if (changePassword.trim()) payload.password = changePassword.trim();
      if (changeUsername.trim()) payload.username = changeUsername.trim();
      if (changeRole) payload.role = changeRole;
      await updateUser(Number(changeUserId), payload);
      setChangeOk("Данные обновлены.");
      setChangePassword("");
      setChangeUsername("");
      setChangeRole("employee");
      await load();
    } catch (e2) {
      const detail = e2?.response?.data?.detail;
      setChangeError(detail || "Не удалось обновить пользователя");
    } finally {
      setChanging(false);
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

          {canCreate && (
            <div className="panel create">
              <div className="panel__title">Изменить пользователя</div>
              <div className="field">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setUpdateOpen((v) => !v)}
                >
                  {updateOpen ? "Скрыть форму" : "Открыть форму"}
                </button>
              </div>
              {updateOpen && (
              <form className="create__form" onSubmit={handleChangePassword}>
                <div className="create__grid">
                  <div className="field">
                    <div className="label">Пользователь</div>
                    <select
                      className="input"
                      value={changeUserId}
                      onChange={(e) => setChangeUserId(e.target.value)}
                    >
                      <option value="">Выберите</option>
                      {items.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <div className="label">Новый логин</div>
                    <input
                      className="input"
                      value={changeUsername}
                      onChange={(e) => setChangeUsername(e.target.value)}
                      placeholder="оставьте пустым чтобы не менять"
                    />
                  </div>
                  <div className="field">
                    <div className="label">Новая роль</div>
                    <select
                      className="input"
                      value={changeRole}
                      onChange={(e) => setChangeRole(e.target.value)}
                    >
                      <option value="employee">employee</option>
                      <option value="manager">manager</option>
                      <option value="ceo">ceo</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                  <div className="field">
                    <div className="label">Новый пароль</div>
                    <input
                      className="input"
                      type="password"
                      value={changePassword}
                      onChange={(e) => setChangePassword(e.target.value)}
                      placeholder="••••••"
                    />
                  </div>
                </div>
                {changeError && <div className="auth-error">{changeError}</div>}
                {changeOk && <div className="auth-ok">{changeOk}</div>}
                <div className="auth-actions">
                  <button className="btn btn--primary" type="submit" disabled={changing}>
                    {changing ? "Обновление…" : "Обновить пользователя"}
                  </button>
                </div>
              </form>
              )}
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
                      {canCreate && <th>Пароль</th>}
                      <th>Создан</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.username}</td>
                        <td>{u.role}</td>
                        {canCreate && <td className="mono">{u.password}</td>}
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
