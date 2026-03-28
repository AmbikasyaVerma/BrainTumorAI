import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Results = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);

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

  useEffect(() => {
    const data = localStorage.getItem("analysisResult");
    const image = localStorage.getItem("analysisImage");

    console.log("Stored Result:", data);

    if (data) {
      setResult(JSON.parse(data));
    }
    if (image) {
      setImagePreview(image);
    }
  }, []);

  if (!result || !result.prediction) {
    return (
      <div className="results-page">
        <div className="results-card">
          <h2>No analysis found</h2>
          <p className="results-subtitle">Run a scan first to see prediction details.</p>
          <button onClick={() => navigate("/analyze")} className="results-btn">
            Go To Analyze
          </button>
        </div>
      </div>
    );
  }

  const prediction = normalizePrediction(result.prediction);
  const confidence = Number(result.confidence || 0);
  const confidenceValue = Math.max(0, Math.min(100, confidence));
  const riskLabel =
    prediction === "No Tumor" && confidenceValue >= 70
      ? "Low Risk"
      : confidenceValue >= 80
        ? "High Confidence"
        : "Needs Review";

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!rating) return;

    const previous = JSON.parse(localStorage.getItem("feedback")) || [];
    const entry = {
      rating,
      comment: comment.trim(),
      prediction,
      confidence: confidenceValue,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("feedback", JSON.stringify([entry, ...previous]));
    setFeedbackSaved(true);
    setComment("");
  };

  return (
    <div className="results-page">
      <div className="results-card">
        <p className="analyze-eyebrow">AI Report</p>
        <h2>Analysis Result</h2>

        <div className="result-pill-row">
          <span className="result-pill">{prediction}</span>
          <span className="result-pill muted">{riskLabel}</span>
        </div>

        {imagePreview && (
          <div className="result-image-wrap">
            <img src={imagePreview} alt="Analyzed MRI" className="result-image" />
          </div>
        )}

        <div className="confidence-wrap">
          <div className="confidence-head">
            <span>Confidence</span>
            <strong>{confidenceValue.toFixed(2)}%</strong>
          </div>
          <div className="confidence-track">
            <div className="confidence-fill" style={{ width: `${confidenceValue}%` }} />
          </div>
        </div>

        <button onClick={() => navigate("/analyze")} className="results-btn">
          Analyze Another MRI
        </button>
        <button onClick={() => navigate("/dashboard")} className="results-btn secondary">
          Open Dashboard
        </button>

        <div className="feedback-card">
          <h3>Share Feedback</h3>
          <p className="results-subtitle">Rate this analysis experience to help improve the app.</p>

          {feedbackSaved ? (
            <p className="feedback-success">Thanks, your feedback has been saved.</p>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="feedback-form">
              <div className="rating-row">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={`rating-chip ${rating === value ? "active" : ""}`}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comment..."
                className="feedback-input"
                rows={3}
              />

              <button type="submit" className="results-btn" disabled={!rating}>
                Submit Feedback
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;
