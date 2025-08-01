import React, { useState } from 'react';
import VideoUpload from './VideoUpload.jsx';
import VideoPlayer from './VideoPlayer.jsx';
import AnalyzedVideoPlayer from './AnalyzedVideoPlayer.jsx';
import PoseStats from './PoseStats.jsx';
import { useVideoAnalysis } from '../hooks/useVideoAnalysis.js';
import './VideoAnalysis.css';

function VideoAnalysis() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const {
    analyzeVideo,
    analysisState,
    analysisProgress,
    poseData,
    shotData,
    analysisStats,
    hasAnalysisData,
    resetAnalysis
  } = useVideoAnalysis();

  const handleVideoSelect = (file, url) => {
    setVideoFile(file);
    setVideoUrl(url);
    setShowAnalysis(false);
    resetAnalysis();
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
    setShowAnalysis(false);
    resetAnalysis();
  };

  const handleStartAnalysis = async () => {
    if (!videoUrl) return;
    
    // Create a temporary video element for analysis
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.crossOrigin = 'anonymous';
    
    // Wait for video to load
    await new Promise((resolve) => {
      videoElement.addEventListener('loadedmetadata', resolve);
      videoElement.load();
    });
    
    // Start analysis
    const success = await analyzeVideo(videoElement);
    if (success) {
      setShowAnalysis(true);
    }
  };

  // Calculate shot statistics
  const getShotStats = () => {
    if (!shotData || shotData.length === 0) return null;

    const stats = {
      total: shotData.length,
      forehand: shotData.filter(shot => shot.type === 'forehand').length,
      backhand: shotData.filter(shot => shot.type === 'backhand').length,
      serve: shotData.filter(shot => shot.type === 'serve').length,
      averageConfidence: shotData.reduce((sum, shot) => sum + shot.confidence, 0) / shotData.length
    };

    return stats;
  };

  const shotStats = getShotStats();

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
            {hasAnalysisData ? (
              <AnalyzedVideoPlayer 
                videoUrl={videoUrl}
                poseData={poseData}
                shotData={shotData}
                onTimeUpdate={handleVideoTimeUpdate}
                onVideoEnd={handleVideoEnd}
              />
            ) : (
              <VideoPlayer 
                videoUrl={videoUrl}
                onTimeUpdate={handleVideoTimeUpdate}
                onVideoEnd={handleVideoEnd}
              />
            )}
          </div>

          {analysisState === 'analyzing' && (
            <div className="analysis-progress">
              <h3>🎯 Analyzing Video...</h3>
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
                <span className="progress-text">{analysisProgress.toFixed(1)}%</span>
              </div>
              <p>Processing video frames for pose detection and shot classification...</p>
            </div>
          )}

          {hasAnalysisData && (
            <div className="analysis-results">
              <PoseStats 
                detectionStats={analysisStats}
                isDetecting={false}
              />
              
              {shotStats && (
                <div className="shot-stats">
                  <h3>🎾 Shot Analysis Results</h3>
                  <div className="shot-stats-grid">
                    <div className="stat-item">
                      <div className="stat-number">{shotStats.total}</div>
                      <div className="stat-label">Total Shots</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">{shotStats.forehand}</div>
                      <div className="stat-label">Forehands</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">{shotStats.backhand}</div>
                      <div className="stat-label">Backhands</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">{shotStats.serve}</div>
                      <div className="stat-label">Serves</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-number">{(shotStats.averageConfidence * 100).toFixed(0)}%</div>
                      <div className="stat-label">Avg Confidence</div>
                    </div>
                  </div>
                  
                  {shotData.length > 0 && (
                    <div className="shot-timeline">
                      <h4>Shot Timeline:</h4>
                      <div className="timeline-container">
                        {shotData.map((shot, index) => (
                          <div key={index} className="timeline-shot">
                            <span className="shot-type">{shot.type.toUpperCase()}</span>
                            <span className="shot-time">
                              {Math.floor(shot.startTime)}s - {Math.floor(shot.endTime)}s
                            </span>
                            <span className="shot-confidence">
                              {(shot.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="analysis-controls">
            <div className="analysis-status">
              <h3>Analysis Status</h3>
              <p>
                {analysisState === 'idle' && 'Ready to analyze video frames for pose detection and shot classification.'}
                {analysisState === 'analyzing' && 'Currently analyzing video frames...'}
                {analysisState === 'complete' && '✅ Analysis complete! Pose data and shot classification ready for playback.'}
                {analysisState === 'error' && '❌ Analysis failed. Please try again.'}
              </p>
            </div>
            
            <div className="analysis-actions">
              {!hasAnalysisData && analysisState === 'idle' && (
                <button 
                  className="analyze-button"
                  onClick={handleStartAnalysis}
                  disabled={analysisState === 'analyzing'}
                >
                  🎯 Start Video Analysis
                </button>
              )}
              
              {hasAnalysisData && (
                <button 
                  className="analyze-button"
                  onClick={() => setShowAnalysis(!showAnalysis)}
                >
                  {showAnalysis ? '📹 Hide Analysis' : '🎯 Show Analysis'}
                </button>
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
            <h4>AI Analysis</h4>
            <p>AI analyzes the entire video for poses and shot classification</p>
          </div>
          <div className="info-item">
            <div className="info-icon">🏆</div>
            <h4>Smart Playback</h4>
            <p>Watch with skeleton overlay and real-time shot indicators</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoAnalysis; 