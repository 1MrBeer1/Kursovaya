import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useNavigate } from "react-router-dom";

import Column from "../components/Column";
import { getTasks, updateTaskStatus } from "../services/tasks";
import { useAuth } from "../auth/useAuth";

const STATUSES = [
  "сделать",
  "в работе",
  "на проверке",
  "готово",
];

export default function Board() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tasks, setTasks] = useState([]);

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const onDragEnd = async (event) => {
    const { active, over } = event;

    // 🔒 если не получилось определить drop-зону
    if (!over || !over.id) return;

    const taskId = Number(active.id);
    const overId = String(over.id);

    // `over.id` может быть либо id колонки, либо id карточки.
    // Если попали на карточку, берём статус этой карточки.
    let newStatus = null;
    if (STATUSES.includes(overId)) {
      newStatus = overId;
    } else {
      const overTaskId = Number(overId);
      const overTask = tasks.find((t) => t.id === overTaskId);
      newStatus = overTask ? overTask.status : null;
    }

    if (!newStatus) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 🔴 САМОЕ ВАЖНОЕ
    if (task.status === newStatus) {
      // задача остаётся в той же колонке → НЕ отправляем PATCH
      return;
    }

    // 🔹 только если статус реально изменился
    await updateTaskStatus(taskId, newStatus);
    loadTasks();
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
            <button className="btn btn--ghost" type="button" onClick={loadTasks}>
              Обновить
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

      <div className="board">
        <div className="container">
          <div className="board__head">
            <div>
              <h1 className="board__title">Доска задач</h1>
              <div className="board__meta">
                Всего: {tasks.length}
              </div>
            </div>
          </div>

          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <div className="columns">
              {STATUSES.map((status) => {
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
