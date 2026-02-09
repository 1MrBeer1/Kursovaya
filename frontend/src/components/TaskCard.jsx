import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";

export default function TaskCard({ task }) {
  const navigate = useNavigate();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="task-card"
      onClick={() => navigate(`/tasks/${task.id}`)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()} // чтобы клик по handle не переходил
      >
        ☰
      </div>

      {/* Content */}
      <div>
        <b>{task.title}</b>
        <div>{task.short_description}</div>
        <small>{task.status}</small>
      </div>
    </div>

  );
}
