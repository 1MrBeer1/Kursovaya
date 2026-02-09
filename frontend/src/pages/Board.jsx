import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import Column from "../components/Column";
import { getTasks, updateTaskStatus } from "../services/tasks";

const STATUSES = [
  "сделать",
  "в работе",
  "на проверке",
  "готово",
];

export default function Board() {
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
    const newStatus = String(over.id);

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 🔴 САМОЕ ВАЖНОЕ
    if (task.status === newStatus) {
      // задача остаётся в той же колонке → НЕ отправляем PATCH
      console.log(`Task ${taskId} уже в статусе ${newStatus}, запрос не отправлен`);
      return;
    }

    // 🔹 только если статус реально изменился
    await updateTaskStatus(taskId, newStatus);
    loadTasks();
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div style={{ display: "flex", gap: 20 }}>
        {STATUSES.map(status => {
          const columnTasks = tasks.filter(
            t => t.status === status
          );

          return (
            <SortableContext
              key={status}
              items={columnTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <Column
                status={status}
                tasks={columnTasks}
              />
            </SortableContext>
          );
        })}
      </div>
    </DndContext>
  );
}
