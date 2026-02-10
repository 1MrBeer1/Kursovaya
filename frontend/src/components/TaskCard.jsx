import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";

export default function TaskCard({ task }) {
  const navigate = useNavigate();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="task"
      data-dragging={isDragging ? "true" : "false"}
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      <button
        ref={setActivatorNodeRef}
        className="task__handle"
        type="button"
        aria-label="Перетащить задачу"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <span aria-hidden="true">⋮⋮</span>
      </button>

      <div>
        <div className="task__title">{task.title}</div>
        <div className="task__desc">{task.short_description}</div>
        <div className="task__status">{task.status}</div>
      </div>
    </div>

  );
}
