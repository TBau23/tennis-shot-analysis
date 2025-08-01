import React from 'react';
import './ShotIndicator.css';

function ShotIndicator({ currentShot, isVisible }) {
  if (!currentShot || !isVisible) {
    return null;
  }

  const getShotIcon = (shotType) => {
    switch (shotType) {
      case 'forehand':
        return '🎾';
      case 'backhand':
        return '🎾';
      case 'serve':
        return '🎾';
      default:
        return '❓';
    }
  };

  const getShotColor = (shotType) => {
    switch (shotType) {
      case 'forehand':
        return '#00ff88';
      case 'backhand':
        return '#ff8800';
      case 'serve':
        return '#0088ff';
      default:
        return '#888888';
    }
  };

  const getShotLabel = (shotType) => {
    switch (shotType) {
      case 'forehand':
        return 'FOREHAND';
      case 'backhand':
        return 'BACKHAND';
      case 'serve':
        return 'SERVE';
      default:
        return 'UNKNOWN';
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="shot-indicator"
      style={{
        '--shot-color': getShotColor(currentShot.type)
      }}
    >
      <div className="shot-icon">
        {getShotIcon(currentShot.type)}
      </div>
      <div className="shot-info">
        <div className="shot-type">{getShotLabel(currentShot.type)}</div>
        <div className="shot-confidence">
          Confidence: {(currentShot.confidence * 100).toFixed(0)}%
        </div>
        <div className="shot-timing">
          {formatTime(currentShot.startTime)} - {formatTime(currentShot.endTime)}
        </div>
      </div>
      {currentShot.reasoning && currentShot.reasoning.length > 0 && (
        <div className="shot-reasoning">
          <div className="reasoning-title">Detection Logic:</div>
          <ul className="reasoning-list">
            {currentShot.reasoning.map((reason, index) => (
              <li key={index} className="reasoning-item">{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ShotIndicator; 