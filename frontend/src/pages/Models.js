import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const modelSpecs = [
  { label: "Architecture", value: "CNN + LSTM" },
  { label: "Input Size", value: "128 x 128 RGB" },
  { label: "Classes", value: "Glioma, Meningioma, No Tumor, Pituitary" },
  { label: "Framework", value: "TensorFlow / Keras" },
  { label: "Deployment", value: "FastAPI + React" },
  { label: "Status", value: "Active" },
];

const Models = () => {
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadEvaluation = async () => {
      try {
        const res = await api.get("/model/evaluation");
        if (active) {
          setEvaluation(res.data);
          setError("");
        }
      } catch (err) {
        if (active) {
          const message =
            err?.response?.data?.detail || "Evaluation data not available. Run training and testing first.";
          setError(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadEvaluation();
    return () => {
      active = false;
    };
  }, []);

  const summaryRows = useMemo(() => {
    const metrics = evaluation?.metrics;
    if (!metrics) return [];
    return [
      { metric: "Accuracy", value: Number(metrics.accuracy || 0).toFixed(4) },
      { metric: "Precision", value: Number(metrics.precision || metrics.precision_weighted || 0).toFixed(4) },
      { metric: "Recall", value: Number(metrics.recall || metrics.recall_weighted || 0).toFixed(4) },
      { metric: "F1 Score", value: Number(metrics.f1_score || metrics.f1_weighted || 0).toFixed(4) },
    ];
  }, [evaluation]);

  const perClassRows = useMemo(() => {
    const metrics = evaluation?.metrics;
    const classes = metrics?.classes || [];
    if (!classes.length) return [];

    return classes.map((name, index) => ({
      name,
      precision: Number(metrics.precision_per_class?.[index] || 0).toFixed(4),
      recall: Number(metrics.recall_per_class?.[index] || 0).toFixed(4),
      f1: Number(metrics.f1_per_class?.[index] || 0).toFixed(4),
      support: metrics.support_per_class?.[index] ?? 0,
    }));
  }, [evaluation]);

  const confusionMatrix = evaluation?.confusion_matrix;
  const matrixClasses = confusionMatrix?.classes || [];
  const matrixRows = confusionMatrix?.matrix || [];

  return (
    <div className="models-page">
      <div className="models-card">
        <p className="analyze-eyebrow">Model Hub</p>
        <h2>Brain Tumor Classifier</h2>
        <p className="results-subtitle">
          Production model used for MRI analysis with real-time inference and confidence scoring.
        </p>

        <div className="spec-grid">
          {modelSpecs.map((spec) => (
            <div key={spec.label} className="spec-item">
              <span>{spec.label}</span>
              <strong>{spec.value}</strong>
            </div>
          ))}
        </div>

        <div className="evaluation-section">
          <p className="analyze-eyebrow">Evaluation</p>
          <h3>Model Performance Table</h3>
          {loading ? (
            <p className="results-subtitle">Loading evaluation data...</p>
          ) : error ? (
            <p className="analyze-error">{error}</p>
          ) : (
            <>
              <div className="table-scroll">
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row) => (
                      <tr key={row.metric}>
                        <td>{row.metric}</td>
                        <td>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="per-class-wrap">
                <h4>Per-Class Metrics Table</h4>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Precision</th>
                        <th>Recall</th>
                        <th>F1 Score</th>
                        <th>Support</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perClassRows.map((row) => (
                        <tr key={row.name}>
                          <td>{row.name}</td>
                          <td>{row.precision}</td>
                          <td>{row.recall}</td>
                          <td>{row.f1}</td>
                          <td>{row.support}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="matrix-wrap">
                <h4>Confusion Matrix Table</h4>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Actual \ Predicted</th>
                        {matrixClasses.map((name) => (
                          <th key={name}>{name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixRows.map((row, index) => (
                        <tr key={matrixClasses[index] || index}>
                          <td>{matrixClasses[index] || `Class ${index + 1}`}</td>
                          {row.map((value, cellIndex) => (
                            <td key={`${index}-${cellIndex}`}>{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Models;
