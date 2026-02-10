import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

export default function Column({ status, tasks }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className="column"
      data-over={isOver ? "true" : "false"}
    >
      <div className="column__header">
        <h3 className="column__title">{status}</h3>
        <div className="pill">{tasks.length}</div>
      </div>

      <div className="tasklist">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
