import React from 'react';
import './App.css';
import Header from './components/Header.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import { useTensorFlow } from './hooks/useTensorFlow.js';

function App() {
  const { isInitialized, isLoading, error } = useTensorFlow();

  if (isLoading) {
    return (
      <div className="app">
        <Header />
        <main className="main-content">
          <LoadingSpinner 
            message="Initializing TensorFlow and MoveNet..." 
            size="large" 
          />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <Header />
        <main className="main-content">
          <div className="error-container">
            <h2>❌ Initialization Error</h2>
            <p>{error}</p>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        {isInitialized ? (
          <div className="app-ready">
            <div className="status-section">
              <h2>✅ TensorFlow Ready!</h2>
              <p>MoveNet model loaded successfully. Ready to analyze tennis shots!</p>
            </div>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🎬</div>
                <h3>Video Upload</h3>
                <p>Upload your tennis videos for analysis</p>
                <span className="phase-badge">Phase 2</span>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h3>Pose Detection</h3>
                <p>Real-time joint tracking overlay</p>
                <span className="phase-badge">Phase 4</span>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🏆</div>
                <h3>Shot Classification</h3>
                <p>Identify forehand, backhand, and serve</p>
                <span className="phase-badge">Phase 5</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="initialization-error">
            <h2>⚠️ Initialization Failed</h2>
            <p>TensorFlow failed to initialize. Please check your browser compatibility.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
