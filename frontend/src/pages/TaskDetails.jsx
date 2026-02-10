import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { createTaskMessage, getTask, getTaskMessages } from "../services/tasks";

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

  const { logout } = useAuth();

  const [task, setTask] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

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
    } catch (e) {
      setError("Не удалось загрузить задачу. Проверьте, что бэкенд запущен и токен валиден.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(taskId) || taskId <= 0) {
      setError("Некорректный id задачи");
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

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
            <button
              className="btn btn--danger"
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Выйти
            </button>
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
            <div className="details__grid">
              <div className="panel">
                <div className="panel__title">{task?.title}</div>
                <div className="kv">
                  <div className="kv-row">
                    <div className="kv-key">Статус</div>
                    <div className="kv-val">{task?.status}</div>
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

