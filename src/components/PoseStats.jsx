import React from 'react';
import './PoseStats.css';

function PoseStats({ detectionStats, isDetecting }) {
  const formatTime = (date) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.7) return '#28a745';
    if (confidence > 0.4) return '#ffc107';
    return '#dc3545';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence > 0.7) return 'High';
    if (confidence > 0.4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="pose-stats">
      <h3>🎯 Pose Detection Stats</h3>
      
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Status</div>
          <div className={`stat-value ${isDetecting ? 'active' : 'inactive'}`}>
            {isDetecting ? '🟢 Active' : '🔴 Inactive'}
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Frames Processed</div>
          <div className="stat-value">
            {detectionStats.processedFrames.toLocaleString()}
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Total Frames</div>
          <div className="stat-value">
            {detectionStats.totalFrames.toLocaleString()}
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Success Rate</div>
          <div className="stat-value">
            {detectionStats.totalFrames > 0 
              ? `${((detectionStats.processedFrames / detectionStats.totalFrames) * 100).toFixed(1)}%`
              : '0%'
            }
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Avg Confidence</div>
          <div 
            className="stat-value confidence"
            style={{ color: getConfidenceColor(detectionStats.averageConfidence) }}
          >
            {detectionStats.averageConfidence.toFixed(3)}
            <span className="confidence-label">
              ({getConfidenceLabel(detectionStats.averageConfidence)})
            </span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Last Detection</div>
          <div className="stat-value">
            {formatTime(detectionStats.lastDetectionTime)}
          </div>
        </div>
      </div>

      {isDetecting && (
        <div className="performance-tips">
          <h4>💡 Performance Tips</h4>
          <ul>
            <li>Ensure good lighting for better pose detection</li>
            <li>Keep your full body visible in the frame</li>
            <li>Minimize background movement</li>
            <li>Use a stable camera position</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default PoseStats; 