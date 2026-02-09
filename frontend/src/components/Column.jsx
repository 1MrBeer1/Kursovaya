import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

export default function Column({ status, tasks }) {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: 260,
        minHeight: 300,
        border: "2px solid #ccc",
        padding: 10,
        background: "#f9f9f9",
      }}
    >
      <h3>{status}</h3>

      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
