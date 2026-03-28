import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Analyze = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const backendBase = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

  const normalizePrediction = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "notumor" || raw === "no_tumor" || raw === "no-tumor" || raw === "no tumor") {
      return "No Tumor";
    }
    if (raw === "glioma" || raw === "glioma tumor") return "Glioma Tumor";
    if (raw === "meningioma" || raw === "meningioma tumor") return "Meningioma Tumor";
    if (raw === "pituitary" || raw === "pituitary tumor") return "Pituitary Tumor";
    return value || "Unknown";
  };

  const handleSelectedFile = (selected) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setError("");
    setFile(selected);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(selected);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    handleSelectedFile(selected);
  };

  // Submit for analysis
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/analyze", formData);
      const normalizedPrediction = normalizePrediction(res.data?.prediction);
      const normalizedResult = {
        ...res.data,
        prediction: normalizedPrediction,
        confidence: Number(res.data?.confidence || 0),
      };

      console.log("API RESPONSE:", res.data);

      // Save result (IMPORTANT)
      localStorage.setItem(
        "analysisResult",
        JSON.stringify(normalizedResult)
      );
      if (preview) {
        localStorage.setItem("analysisImage", preview);
      }

      const prevHistory = JSON.parse(localStorage.getItem("history")) || [];
      const newEntry = {
        prediction: normalizedPrediction,
        confidence: Number(res.data?.confidence || 0),
        image: preview || null,
        filename: file?.name || "scan-image",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("history", JSON.stringify([newEntry, ...prevHistory]));

      // Go to results
      navigate("/results");

    } catch (error) {
      console.error("Analyze Error:", error);

      const message = error?.response?.data?.detail || error?.response?.data?.prediction
        || (error?.message === "Network Error"
          ? `Cannot connect to backend (${backendBase}). Start backend using: cd BrainTumorAI\\backend && .\\venv\\Scripts\\python.exe app.py`
          : error?.message)
        || "Error analyzing image";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setFile(null);
    setPreview(null);
    setError("");
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    handleSelectedFile(dropped);
  };

  return (
    <div className="analyze-page">
      <div className="analyze-card">
        <p className="analyze-eyebrow">MRI Classification</p>
        <h2>Analyze Brain Scan</h2>
        <p className="analyze-subtitle">
          Upload an MRI image to detect glioma, meningioma, pituitary tumor, or no tumor.
        </p>

        <form onSubmit={handleSubmit} className="analyze-form">
          <label
            className={`upload-zone ${dragActive ? "upload-zone-active" : ""}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="upload-input"
            />
            <span className="upload-title">Drag and drop image here</span>
            <span className="upload-meta">or click to browse JPG/PNG files</span>
          </label>

          {file && (
            <div className="file-chip">
              <span>{file.name}</span>
              <button type="button" onClick={resetSelection}>Remove</button>
            </div>
          )}

          {preview && (
            <div className="preview-wrap">
              <img src={preview} alt="Selected MRI" className="preview-image" />
            </div>
          )}

          {error && <div className="analyze-error">{error}</div>}

          <button type="submit" disabled={loading} className="analyze-btn">
            {loading ? "Analyzing MRI..." : "Run Analysis"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Analyze;
