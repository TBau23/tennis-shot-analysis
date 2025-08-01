import React from 'react';
import './App.css';
import Header from './components/Header.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import VideoAnalysis from './components/VideoAnalysis.jsx';
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
          <VideoAnalysis />
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
