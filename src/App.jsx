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
            <h2>✅ TensorFlow Ready!</h2>
            <p>MoveNet model loaded successfully. Ready to analyze tennis shots!</p>
            {/* Video upload and analysis components will go here in Phase 2 */}
            <div className="placeholder-content">
              <p>🎬 Video upload component coming in Phase 2</p>
              <p>🎯 Pose detection overlay coming in Phase 4</p>
              <p>🏆 Shot classification coming in Phase 5</p>
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
