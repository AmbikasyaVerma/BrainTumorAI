import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

const API = axios.create({
  baseURL: API_BASE_URL,
});

/* Get all history */
export const fetchHistory = () => {
  return API.get("/history");
};

/* Delete history by ID */
export const deleteHistory = (id) => {
  return API.delete(`/history/${id}`);
};
