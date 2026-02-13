import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { createTaskMessage, getTask, getTaskMessages, getStatuses, updateTask } from "../services/tasks";
import { getUsers } from "../services/users";
import UserMenu from "../components/UserMenu";

function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}

export default function TaskDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const taskId = useMemo(() => Number(id), [id]);

  const { logout, user } = useAuth();

  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    short_description: "",
    description: "",
    status_id: "",
    assignee_id: "",
  });
  const [statuses, setStatuses] = useState([]);
  const [users, setUsers] = useState([]);
  const canEdit = ["admin", "ceo", "manager"].includes(user?.role);

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const [t, m] = await Promise.all([
        getTask(taskId),
        getTaskMessages(taskId),
      ]);
      setTask(t);
      setMessages(m);
      setEditData({
        title: t.title,
        short_description: t.short_description,
        description: t.description || "",
        status_id: statuses.length ? findStatusIdByName(t.status) : "",
        assignee_id: t.assignee_id ? String(t.assignee_id) : "",
      });
    } catch (e) {
      setError("Не удалось загрузить задачу. Проверьте, что бэкенд запущен и токен валиден.");
    } finally {
      setLoading(false);
    }
  };

  const loadRefs = async () => {
    try {
      const [s, u] = await Promise.all([getStatuses(), getUsers()]);
      setStatuses(s);
      setUsers(u);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadRefs();
  }, []);

  useEffect(() => {
    if (!Number.isFinite(taskId) || taskId <= 0) {
      setError("Некорректный id задачи");
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  // Пуллинг сообщений для обновления у всех пользователей без перезагрузки
  useEffect(() => {
    if (!Number.isFinite(taskId) || taskId <= 0) return undefined;
    const interval = setInterval(async () => {
      try {
        const m = await getTaskMessages(taskId);
        setMessages(m);
      } catch {
        /* игнорируем временные ошибки сети */
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [taskId]);

  const findStatusIdByName = (name) => {
    const st = statuses.find((s) => s.name === name);
    return st ? String(st.id) : "";
  };

  const handleEditChange = (field) => (e) => {
    setEditData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const saveTask = async (e) => {
    e.preventDefault();
    setError("");
    const payload = {
      title: editData.title.trim(),
      short_description: editData.short_description.trim(),
      description: editData.description.trim(),
      status_id: editData.status_id ? Number(editData.status_id) : undefined,
      assignee_id: editData.assignee_id ? Number(editData.assignee_id) : null,
    };
    try {
      await updateTask(taskId, payload);
      await load();
      setEditing(false);
    } catch (e2) {
      const detail = e2?.response?.data?.detail;
      setError(detail || "Не удалось сохранить задачу");
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    setError("");

    const text = messageText.trim();
    if (!text) return;

    setSending(true);
    try {
      await createTaskMessage(taskId, text);
      setMessageText("");
      const m = await getTaskMessages(taskId);
      setMessages(m);
    } catch (e2) {
      setError("Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <div className="brand__title">Task Manager</div>
            <div className="brand__hint">детали задачи</div>
          </div>
          <div className="topbar__actions">
            <button className="btn btn--ghost" type="button" onClick={() => navigate("/")}>
              Назад
            </button>
            <UserMenu
              user={user}
              onRefresh={() => load()}
              onLogout={() => {
                logout();
                navigate("/login");
              }}
            />
          </div>
        </div>
      </div>

      <div className="details">
        <div className="container">
          {loading ? (
            <div className="panel">Загрузка…</div>
          ) : error ? (
            <div className="panel">
              <div className="panel__title">Ошибка</div>
              <div className="auth-error">{error}</div>
              <div className="divider" />
              <button className="btn btn--primary" type="button" onClick={load}>
                Повторить
              </button>
            </div>
          ) : (
            <div className="details__grid details__grid--stack">
              <div className="panel">
                <div className="panel__title row-between">
                  <span>{task?.title}</span>
                  {canEdit && (
                    <button className="btn btn--ghost" type="button" onClick={() => setEditing((v) => !v)}>
                      {editing ? "Отмена" : "Редактировать"}
                    </button>
                  )}
                </div>
                <div className="kv">
                  <div className="kv-row">
                    <div className="kv-key">Статус</div>
                    <div className="kv-val">{task?.status}</div>
                  </div>
                  <div className="kv-row">
                    <div className="kv-key">Исполнитель</div>
                    <div className="kv-val">{task?.assignee || "не назначен"}</div>
                  </div>
                  <div className="kv-row">
                    <div className="kv-key">Постановщик</div>
                    <div className="kv-val">{task?.created_by || "—"}</div>
                  </div>
                  <div className="kv-row">
                    <div className="kv-key">Кратко</div>
                    <div className="kv-val">{task?.short_description}</div>
                  </div>
                  <div className="kv-row">
                    <div className="kv-key">Создана</div>
                    <div className="kv-val">{formatTime(task?.created_at)}</div>
                  </div>
                </div>

                <div className="divider" />

                <div className="panel__title">Описание</div>
                <div className="msg__body">{task?.description || "Нет описания"}</div>

                {canEdit && editing && (
                  <>
                    <div className="divider" />
                    <form className="create__form" onSubmit={saveTask}>
                      <div className="create__grid">
                        <div className="field">
                          <div className="label">Заголовок</div>
                          <input
                            className="input"
                            value={editData.title}
                            onChange={handleEditChange("title")}
                          />
                        </div>
                        <div className="field">
                          <div className="label">Кратко</div>
                          <input
                            className="input"
                            value={editData.short_description}
                            onChange={handleEditChange("short_description")}
                          />
                        </div>
                        <div className="field">
                          <div className="label">Статус</div>
                          <select
                            className="input"
                            value={editData.status_id}
                            onChange={handleEditChange("status_id")}
                          >
                            <option value="">Выберите</option>
                            {statuses.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="field">
                          <div className="label">Исполнитель</div>
                          <select
                            className="input"
                            value={editData.assignee_id}
                            onChange={handleEditChange("assignee_id")}
                          >
                            <option value="">Не назначать</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.username} ({u.role})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="field">
                        <div className="label">Описание</div>
                        <textarea
                          className="textarea"
                          value={editData.description}
                          onChange={handleEditChange("description")}
                          rows={4}
                        />
                      </div>
                      <div className="auth-actions">
                        <button className="btn btn--primary" type="submit">
                          Сохранить
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>

              <div className="panel">
                <div className="panel__title">Обсуждение</div>
                <form onSubmit={sendMessage}>
                  <div className="field">
                    <div className="label">Сообщение</div>
                    <textarea
                      className="textarea"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Напишите сообщение по задаче…"
                    />
                  </div>
                  <div className="auth-actions">
                    <button className="btn btn--primary" type="submit" disabled={sending}>
                      {sending ? "Отправка…" : "Отправить"}
                    </button>
                  </div>
                </form>

                {error && <div className="auth-error">{error}</div>}

                <div className="messages">
                  {messages.length === 0 ? (
                    <div className="msg">
                      <div className="msg__body">Пока сообщений нет.</div>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div className="msg" key={m.id}>
                        <div className="msg__head">
                          <div className="msg__user">{m.user}</div>
                          <div className="msg__time">{formatTime(m.created_at)}</div>
                        </div>
                        <div className="msg__body">{m.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

