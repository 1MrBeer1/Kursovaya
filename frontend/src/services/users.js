import api from "./api";

export const getUsers = async () => {
  const res = await api.get("/users/");
  return res.data;
};

export const getMe = async () => {
  const res = await api.get("/users/me");
  return res.data;
};

export const registerUser = async (payload) => {
  const res = await api.post("/auth/register", payload);
  return res.data;
};

export const updateUser = async (userId, payload) => {
  const res = await api.patch(`/users/${userId}`, payload);
  return res.data;
};
