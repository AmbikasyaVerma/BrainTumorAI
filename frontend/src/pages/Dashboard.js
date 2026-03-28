import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("history")) || [];
    const savedFeedback = JSON.parse(localStorage.getItem("feedback")) || [];
    setHistory(saved);
    setFeedback(savedFeedback);
  }, []);

  const stats = useMemo(() => {
    const total = history.length;
    const tumorFound = history.filter((x) => {
      const raw = String(x.prediction || "").trim().toLowerCase();
      const noTumor = raw === "no tumor" || raw === "notumor" || raw === "no_tumor" || raw === "no-tumor";
      return raw && !noTumor;
    }).length;
    const normal = total - tumorFound;
    const avgConfidence =
      total > 0
        ? history.reduce((sum, x) => sum + Number(x.confidence || 0), 0) / total
        : 0;
    return { total, tumorFound, normal, avgConfidence };
  }, [history]);

  const exportRows = useMemo(
    () =>
      history.map((item) => ({
        prediction: item.prediction || "Unknown",
        confidence: Number(item.confidence || 0).toFixed(2),
        filename: item.filename || "scan-image",
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
      })),
    [history]
  );

  const feedbackStats = useMemo(() => {
    const total = feedback.length;
    const avgRating =
      total > 0 ? feedback.reduce((sum, x) => sum + Number(x.rating || 0), 0) / total : 0;
    return { total, avgRating };
  }, [feedback]);

  const handleClearHistory = () => {
    if (!history.length) return;
    const ok = window.confirm("Clear all scan history? This cannot be undone.");
    if (!ok) return;

    localStorage.removeItem("history");
    setHistory([]);
  };

  const handleExportCSV = () => {
    if (!exportRows.length) return;

    const headers = ["Prediction", "Confidence (%)", "File Name", "Date"];
    const lines = exportRows.map((row) =>
      [row.prediction, row.confidence, row.filename, row.createdAt]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `neuroai-scan-history-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    if (!exportRows.length) return;

    const rowsHtml = exportRows
      .map(
        (row) =>
          `<tr>
            <td>${row.prediction}</td>
            <td>${row.confidence}%</td>
            <td>${row.filename}</td>
            <td>${row.createdAt}</td>
          </tr>`
      )
      .join("");

    const popup = window.open("", "_blank", "width=1000,height=700");
    if (!popup) return;

    popup.document.write(`
      <html>
        <head>
          <title>NeuroAI Scan History</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
            h1 { margin: 0 0 4px; font-size: 22px; }
            p { margin: 0 0 16px; color: #555; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>NeuroAI Scan History</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Prediction</th>
                <th>Confidence</th>
                <th>File</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <div className="dashboard-head">
          <div>
            <p className="analyze-eyebrow">Overview</p>
            <h2>Clinical Dashboard</h2>
            <p className="dashboard-subtitle">Track model predictions and review latest MRI scans in one place.</p>
          </div>
          <div className="dashboard-actions">
            <button className="results-btn secondary" onClick={handleExportCSV} disabled={!history.length}>
              Export CSV
            </button>
            <button className="results-btn secondary" onClick={handleExportPDF} disabled={!history.length}>
              Export PDF
            </button>
            <button className="results-btn danger" onClick={handleClearHistory} disabled={!history.length}>
              Delete History
            </button>
            <button className="results-btn" onClick={() => navigate("/analyze")}>
              New Analysis
            </button>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <span>Total Scans</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="kpi-card">
            <span>Tumor Detected</span>
            <strong>{stats.tumorFound}</strong>
          </div>
          <div className="kpi-card">
            <span>No Tumor</span>
            <strong>{stats.normal}</strong>
          </div>
          <div className="kpi-card">
            <span>Avg Confidence</span>
            <strong>{stats.avgConfidence.toFixed(1)}%</strong>
          </div>
        </div>

        <div className="history-card">
          <h3>Recent Scans</h3>
          {history.length === 0 ? (
            <p className="results-subtitle">No scans yet. Upload your first MRI to start tracking.</p>
          ) : (
            <div className="history-list">
              {history.slice(0, 6).map((item, idx) => (
                <div key={`${item.createdAt}-${idx}`} className="history-item">
                  <div>
                    <p className="history-title">{item.prediction || "Unknown"}</p>
                    <p className="history-meta">
                      {item.filename || "scan-image"} | {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <strong>{Number(item.confidence || 0).toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="history-card">
          <div className="table-card-head">
            <div>
              <h3>Prediction History Table</h3>
              <p className="results-subtitle">Complete scan history with filename, prediction, confidence, and timestamp.</p>
            </div>
          </div>
          {history.length === 0 ? (
            <p className="results-subtitle">No prediction history available yet.</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>File Name</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, idx) => (
                    <tr key={`${item.createdAt || "history"}-${idx}`}>
                      <td>{idx + 1}</td>
                      <td>{item.filename || "scan-image"}</td>
                      <td>{item.prediction || "Unknown"}</td>
                      <td>{Number(item.confidence || 0).toFixed(2)}%</td>
                      <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="history-card">
          <h3>User Feedback</h3>
          {feedback.length === 0 ? (
            <p className="results-subtitle">No feedback submitted yet.</p>
          ) : (
            <>
              <p className="results-subtitle">
                Average rating: <strong>{feedbackStats.avgRating.toFixed(1)}/5</strong> from {feedbackStats.total} response(s)
              </p>
              <div className="history-list">
                {feedback.slice(0, 4).map((item, idx) => (
                  <div key={`${item.createdAt}-${idx}`} className="history-item">
                    <div>
                      <p className="history-title">
                        {item.rating}/5 | {item.prediction || "Unknown"}
                      </p>
                      <p className="history-meta">
                        {(item.comment || "No comment").slice(0, 120)} | {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
