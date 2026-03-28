import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="home-page">
      <section className="home-shell">
        <div className="home-left">
          <p className="analyze-eyebrow">NeuroAI Platform</p>
          <h1>AI-Powered Brain Tumor Detection</h1>
          <p className="home-subtitle">
            NeuroAI helps detect brain tumors from MRI scans using deep learning models trained on
            glioma, meningioma, pituitary, and no-tumor classes.
          </p>

          <div className="home-points">
            <div className="home-point">
              <strong>Reliable Classification</strong>
              <span>Confidence-based prediction with clear result reporting.</span>
            </div>
            <div className="home-point">
              <strong>Clinical-Friendly Flow</strong>
              <span>Upload, analyze, review results, and track scans from dashboard.</span>
            </div>
            <div className="home-point">
              <strong>Fast Web Workflow</strong>
              <span>React frontend + FastAPI backend with local model inference.</span>
            </div>
          </div>
        </div>

        <div className="home-right">
          <div className="home-auth-card">
            <h2>Get Started</h2>
            <p>Login or create an account to access MRI analysis.</p>
            <div className="home-auth-actions">
              <Link to="/login" className="home-btn primary">Login</Link>
              <Link to="/signup" className="home-btn secondary">Sign Up</Link>
            </div>
            <small>Demo access: admin@gmail.com / 1234</small>
          </div>
        </div>
      </section>

      <div className="home-footer-stats">
        <span>4 Tumor Classes</span>
        <span>TensorFlow Inference</span>
        <span>Dashboard + Feedback + Reports</span>
      </div>
    </div>
  );
}
