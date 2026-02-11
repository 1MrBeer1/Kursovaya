import api from "./api";

export const getTasks = async () => {
  const res = await api.get("/tasks/");
  return res.data;
};

export const createTask = async (payload) => {
  const res = await api.post("/tasks/", payload);
  return res.data;
};

export const updateTaskStatus = async (taskId, status) => {
  return api.patch(`/tasks/${taskId}/status`, {
    status: status
  });
};

export const getTask = async (taskId) => {
  const res = await api.get(`/tasks/${taskId}`);
  return res.data;
};

export const getTaskMessages = async (taskId) => {
  const res = await api.get(`/tasks/${taskId}/messages/`);
  return res.data;
};

export const createTaskMessage = async (taskId, content) => {
  const res = await api.post(`/tasks/${taskId}/messages/`, { content });
  return res.data;
};

export const getStatuses = async () => {
  const res = await api.get("/statuses/");
  return res.data;
};

export const updateTask = async (taskId, payload) => {
  const res = await api.patch(`/tasks/${taskId}`, payload);
  return res.data;
};

