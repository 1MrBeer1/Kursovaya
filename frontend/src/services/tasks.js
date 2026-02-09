import api from "./api";

export const getTasks = async () => {
  const res = await api.get("/tasks/");
  return res.data;
};

export const updateTaskStatus = async (taskId, status) => {
  return api.patch(`/tasks/${taskId}/status`, {
    status: status
  });
};

