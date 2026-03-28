import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

export default axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});
