import api from "./api";

export const getTasks = async () => {
  const res = await api.get("/tasks/");
  return res.data;
};
