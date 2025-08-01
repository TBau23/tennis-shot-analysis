import React, { useState } from 'react';
import VideoUpload from './VideoUpload.jsx';
import VideoPlayer from './VideoPlayer.jsx';
import './VideoAnalysis.css';

function VideoAnalysis() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const handleVideoSelect = (file, url) => {
    setVideoFile(file);
    setVideoUrl(url);
    setIsAnalyzing(false);
    setAnalysisProgress(0);
  };

  const handleVideoTimeUpdate = (currentTime) => {
    // This will be used for real-time pose detection in Phase 3
    console.log('Video time:', currentTime);
  };

  const handleVideoEnd = () => {
    console.log('Video ended');
  };

  const handleRemoveVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoFile(null);
    setVideoUrl(null);
    setIsAnalyzing(false);
    setAnalysisProgress(0);
  };

  return (
    <div className="video-analysis-container">
      <div className="analysis-header">
        <h2>🎾 Tennis Video Analysis</h2>
        <p>Upload your tennis video to get started with pose detection and shot classification</p>
      </div>

      {!videoUrl ? (
        <div className="upload-section">
          <VideoUpload onVideoSelect={handleVideoSelect} />
        </div>
      ) : (
        <div className="player-section">
          <div className="video-info">
            <div className="file-info">
              <h3>📹 {videoFile?.name}</h3>
              <p>Size: {(videoFile?.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <button 
              className="remove-button"
              onClick={handleRemoveVideo}
            >
              ✕ Remove Video
            </button>
          </div>

          <div className="video-player-wrapper">
            <VideoPlayer 
              videoUrl={videoUrl}
              onTimeUpdate={handleVideoTimeUpdate}
              onVideoEnd={handleVideoEnd}
            />
          </div>

          <div className="analysis-controls">
            <div className="analysis-status">
              <h3>Analysis Status</h3>
              <p>Ready to analyze video frames for pose detection</p>
            </div>
            
            <div className="analysis-actions">
              <button 
                className="analyze-button"
                onClick={() => setIsAnalyzing(true)}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? '⏳ Analyzing...' : '🎯 Start Analysis'}
              </button>
              
              {isAnalyzing && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                  <span className="progress-text">{analysisProgress}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="analysis-info">
        <h3>How it works:</h3>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon">📤</div>
            <h4>Upload Video</h4>
            <p>Upload your tennis video (MP4, WebM, OGG, MOV up to 100MB)</p>
          </div>
          <div className="info-item">
            <div className="info-icon">🎯</div>
            <h4>Pose Detection</h4>
            <p>MoveNet analyzes each frame to detect body keypoints</p>
          </div>
          <div className="info-item">
            <div className="info-icon">🏆</div>
            <h4>Shot Classification</h4>
            <p>AI classifies your shots as forehand, backhand, or serve</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoAnalysis; 