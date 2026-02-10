import { useEffect, useMemo, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useNavigate } from "react-router-dom";

import Column from "../components/Column";
import { createTask, getStatuses, getTasks, updateTaskStatus } from "../services/tasks";
import { getUsers } from "../services/users";
import { useAuth } from "../auth/useAuth";
import UserMenu from "../components/UserMenu";

const FALLBACK_STATUSES = ["сделать", "в работе", "на проверке", "готово"];
const CREATOR_ROLES = ["admin", "ceo", "manager"];

export default function Board() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const canCreate = CREATOR_ROLES.includes(user?.role);

  const [tasks, setTasks] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [statusNames, setStatusNames] = useState([]);
  const [users, setUsers] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    short_description: "",
    description: "",
    status_id: "",
    assignee_id: "",
  });
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const statusColumns = useMemo(() => {
    if (statusNames && statusNames.length) return statusNames;
    const fromTasks = Array.from(new Set(tasks.map((t) => t.status))).filter(Boolean);
    if (fromTasks.length) return fromTasks;
    return FALLBACK_STATUSES;
  }, [statusNames, tasks]);

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  const loadStatuses = async () => {
    try {
      const data = await getStatuses();
      setStatusOptions(data);
      if (data.length) {
        setStatusNames(data.map((s) => s.name));
        setForm((prev) => ({
          ...prev,
          status_id: prev.status_id || data[0].id,
        }));
      }
    } catch (e) {
      // keep fallback statuses
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      setUsers([]);
    }
  };

  useEffect(() => {
    loadTasks();
    loadStatuses();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || !over.id) return;

    const taskId = Number(active.id);
    const overId = String(over.id);

    let newStatus = null;
    if (statusColumns.includes(overId)) {
      newStatus = overId;
    } else {
      const overTaskId = Number(overId);
      const overTask = tasks.find((t) => t.id === overTaskId);
      newStatus = overTask ? overTask.status : null;
    }

    if (!newStatus) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status === newStatus) {
      return;
    }

    await updateTaskStatus(taskId, newStatus);
    loadTasks();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!canCreate) return;

    setCreateError("");

    const title = form.title.trim();
    const short_description = form.short_description.trim();
    const description = form.description.trim();
    const status_id = form.status_id;
    const assignee_id = form.assignee_id;

    if (!title || !short_description || !status_id) {
      setCreateError("Заполните обязательные поля: заголовок, краткое описание и статус.");
      return;
    }

    setCreating(true);
    try {
      await createTask({
        title,
        short_description,
        description,
        status_id: Number(status_id),
        assignee_id: assignee_id ? Number(assignee_id) : null,
      });
      setForm((prev) => ({
        ...prev,
        title: "",
        short_description: "",
        description: "",
        assignee_id: "",
        status_id: statusOptions[0]?.id || status_id,
      }));
      await loadTasks();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setCreateError(detail || "Не удалось создать задачу");
    } finally {
      setCreating(false);
    }
  };

  const handleFieldChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="brand">
            <div className="brand__title">Task Manager</div>
            <div className="brand__hint">kanban + drag and drop</div>
          </div>
          <div className="topbar__actions">
            <button className="btn btn--ghost" type="button" onClick={() => navigate("/users")}>
              Пользователи
            </button>
            <UserMenu
              user={user}
              onRefresh={loadTasks}
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
              <h1 className="board__title">Доска задач</h1>
              <div className="board__meta">Всего: {tasks.length}</div>
            </div>
            {canCreate && (
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => setCreateOpen((v) => !v)}
              >
                {createOpen ? "Скрыть форму" : "Новая задача"}
              </button>
            )}
          </div>

          {canCreate && createOpen && (
            <div className="panel create">
              <div className="panel__title">Создать задачу</div>
              <form className="create__form" onSubmit={handleCreate}>
                <div className="create__grid">
                  <div className="field">
                    <div className="label">Заголовок</div>
                    <input
                      className="input"
                      placeholder="Например: Добавить авторизацию"
                      value={form.title}
                      onChange={handleFieldChange("title")}
                    />
                  </div>
                  <div className="field">
                    <div className="label">Краткое описание</div>
                    <input
                      className="input"
                      placeholder="1-2 предложения"
                      value={form.short_description}
                      onChange={handleFieldChange("short_description")}
                    />
                  </div>
                  <div className="field">
                    <div className="label">Статус</div>
                    <select
                      className="input"
                      value={form.status_id}
                      onChange={handleFieldChange("status_id")}
                    >
                      {statusOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                      {statusOptions.length === 0 && (
                        <option value="">Статусы недоступны</option>
                      )}
                    </select>
                  </div>
                  <div className="field">
                    <div className="label">Исполнитель</div>
                    <select
                      className="input"
                      value={form.assignee_id}
                      onChange={handleFieldChange("assignee_id")}
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
                    placeholder="Подробности задачи, критерии готовности, ссылки..."
                    value={form.description}
                    onChange={handleFieldChange("description")}
                  />
                </div>
                {createError && <div className="auth-error">{createError}</div>}
                <div className="auth-actions">
                  <button
                    className="btn btn--primary"
                    type="submit"
                    disabled={creating || statusOptions.length === 0}
                  >
                    {creating ? "Создание…" : "Создать задачу"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <div className="columns">
              {statusColumns.map((status) => {
    const columnTasks = tasks.filter((t) => t.status === status);

                return (
                  <SortableContext
                    key={status}
                    items={columnTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Column status={status} tasks={columnTasks} />
                  </SortableContext>
                );
              })}
            </div>
          </DndContext>
        </div>
      </div>
    </>
  );
}
