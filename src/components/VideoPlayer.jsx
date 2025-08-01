import React, { useState, useRef, useEffect } from 'react';
import PoseOverlay from './PoseOverlay.jsx';
import { usePoseDetection } from '../hooks/usePoseDetection.js';
import './VideoPlayer.css';

function VideoPlayer({ videoUrl, onTimeUpdate, onVideoEnd }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [poseDetectionEnabled, setPoseDetectionEnabled] = useState(false);
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const canvasRef = useRef(null);

  const {
    startPoseDetection,
    stopPoseDetection,
    isDetecting,
    detectionStats,
    hasPoseData
  } = usePoseDetection();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onVideoEnd?.();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onVideoEnd]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  const togglePoseDetection = async () => {
    console.log('Toggle pose detection clicked');
    console.log('Current state:', { poseDetectionEnabled, isDetecting });
    
    if (!poseDetectionEnabled) {
      console.log('Starting pose detection...');
      // Start pose detection
      const success = await startPoseDetection(videoRef.current, canvasRef.current);
      console.log('Pose detection start result:', success);
      if (success) {
        setPoseDetectionEnabled(true);
      }
    } else {
      console.log('Stopping pose detection...');
      // Stop pose detection
      stopPoseDetection();
      setPoseDetectionEnabled(false);
    }
  };

  const handleCanvasReady = (canvas) => {
    console.log('Canvas ready:', canvas);
    canvasRef.current = canvas;
  };

  useEffect(() => {
    console.log('Pose detection state changed:', { poseDetectionEnabled, isDetecting });
  }, [poseDetectionEnabled, isDetecting]);

  return (
    <div 
      className="video-player-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="video-wrapper">
        <video
          ref={videoRef}
          src={videoUrl}
          className="video-element"
          onClick={togglePlay}
        />
        
        <PoseOverlay 
          videoElement={videoRef.current}
          isActive={poseDetectionEnabled && isDetecting}
          onCanvasReady={handleCanvasReady}
        />
      </div>
      
      <div className={`video-controls ${showControls ? 'visible' : ''}`}>
        <div className="controls-top">
          <div className="progress-bar" onClick={handleSeek}>
            <div 
              className="progress-fill"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="controls-bottom">
          <div className="controls-left">
            <button 
              className="control-button play-button"
              onClick={togglePlay}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          <div className="controls-right">
            <button
              className={`control-button pose-button ${poseDetectionEnabled ? 'active' : ''}`}
              onClick={togglePoseDetection}
              title="Toggle Pose Detection"
            >
              🎯
            </button>
            
            <div className="volume-control">
              <span className="volume-icon">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
