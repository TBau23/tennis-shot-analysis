import React, { useState, useRef, useEffect, useCallback } from 'react';
import ShotIndicator from './ShotIndicator.jsx';
import './AnalyzedVideoPlayer.css';

function AnalyzedVideoPlayer({ videoUrl, poseData, shotData, onTimeUpdate, onVideoEnd }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [currentShot, setCurrentShot] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
      
      // Draw pose overlay for current time
      drawPoseOverlay(video.currentTime);
      
      // Update current shot
      updateCurrentShot(video.currentTime);
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

  const updateCurrentShot = useCallback((time) => {
    if (!shotData || shotData.length === 0) {
      setCurrentShot(null);
      return;
    }

    // Find shot that contains the current time
    const shot = shotData.find(shot => 
      time >= shot.startTime && time <= shot.endTime
    );

    setCurrentShot(shot || null);
  }, [shotData]);

  const getInterpolatedPose = useCallback((time) => {
    if (!poseData.length) return null;
    
    // Find the two poses that bracket the current time
    let beforePose = null;
    let afterPose = null;
    
    for (let i = 0; i < poseData.length; i++) {
      if (poseData[i].time <= time) {
        beforePose = poseData[i];
      } else {
        afterPose = poseData[i];
        break;
      }
    }
    
    // If we have both poses, interpolate between them
    if (beforePose && afterPose) {
      const timeDiff = afterPose.time - beforePose.time;
      const rawInterpolationFactor = (time - beforePose.time) / timeDiff;
      
      // Apply easing function for smoother interpolation
      const interpolationFactor = easeInOutQuart(rawInterpolationFactor);
      
      // Interpolate keypoints with velocity-based smoothing
      const interpolatedKeypoints = beforePose.pose.keypoints.map((beforeKp, index) => {
        const afterKp = afterPose.pose.keypoints[index];
        if (!afterKp) return beforeKp;
        
        // Calculate velocity for this keypoint
        const velocityX = (afterKp.x - beforeKp.x) / timeDiff;
        const velocityY = (afterKp.y - beforeKp.y) / timeDiff;
        
        // Apply velocity-based prediction for smoother movement
        const predictedX = beforeKp.x + velocityX * (time - beforePose.time);
        const predictedY = beforeKp.y + velocityY * (time - beforePose.time);
        
        // Blend between linear interpolation and velocity prediction
        const blendFactor = 0.7; // 70% velocity prediction, 30% linear interpolation
        const linearX = beforeKp.x + (afterKp.x - beforeKp.x) * interpolationFactor;
        const linearY = beforeKp.y + (afterKp.y - beforeKp.y) * interpolationFactor;
        
        return {
          x: predictedX * blendFactor + linearX * (1 - blendFactor),
          y: predictedY * blendFactor + linearY * (1 - blendFactor),
          score: beforeKp.score + (afterKp.score - beforeKp.score) * interpolationFactor,
          name: beforeKp.name
        };
      });
      
      return {
        time,
        pose: { keypoints: interpolatedKeypoints },
        confidence: beforePose.confidence + (afterPose.confidence - beforePose.confidence) * interpolationFactor
      };
    }
    
    // If we only have one pose, return it
    return beforePose || afterPose;
  }, [poseData]);

  // Easing function for smoother interpolation
  const easeInOutQuart = (t) => {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  };

  const drawPoseOverlay = useCallback((time) => {
    if (!canvasRef.current || !poseData.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get interpolated pose for current time
    const currentPose = getInterpolatedPose(time);

    if (!currentPose || !currentPose.pose.keypoints) return;

    // Enable anti-aliasing for smoother lines
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw skeleton connections first (behind keypoints)
    const connections = [
      [5, 6],   // shoulders
      [5, 7],   // left shoulder to left elbow
      [7, 9],   // left elbow to left wrist
      [6, 8],   // right shoulder to right elbow
      [8, 10],  // right elbow to right wrist
      [5, 11],  // left shoulder to left hip
      [6, 12],  // right shoulder to right hip
      [11, 12], // hips
      [11, 13], // left hip to left knee
      [13, 15], // left knee to left ankle
      [12, 14], // right hip to right knee
      [14, 16]  // right knee to right ankle
    ];

    // Draw connections with enhanced gradient and glow effect
    connections.forEach(([start, end]) => {
      const startPoint = currentPose.pose.keypoints[start];
      const endPoint = currentPose.pose.keypoints[end];
      
      if (startPoint?.score > 0.3 && endPoint?.score > 0.3) {
        // Create gradient for smoother lines
        const gradient = ctx.createLinearGradient(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
        gradient.addColorStop(0, 'rgba(0, 255, 136, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 136, 1)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0.8)');
        
        // Draw outer glow effect
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw main line with gradient
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    });

    // Draw keypoints with enhanced styling
    currentPose.pose.keypoints.forEach((keypoint, index) => {
      if (keypoint.score > 0.3) {
        // Create radial gradient for keypoints
        const gradient = ctx.createRadialGradient(keypoint.x, keypoint.y, 0, keypoint.x, keypoint.y, 8);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(0, 255, 136, 1)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0.3)');
        
        // Draw outer glow
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        
        // Draw main keypoint with gradient
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw inner highlight
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    });
  }, [poseData, getInterpolatedPose]);

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

  // Set up canvas when component mounts
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const resizeCanvas = () => {
      if (video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log('Canvas resized to:', canvas.width, 'x', canvas.height);
      }
    };

    const handleLoadedMetadata = () => {
      resizeCanvas();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    resizeCanvas();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  return (
    <div 
      className="analyzed-video-player-container"
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
        
        <canvas
          ref={canvasRef}
          className="pose-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10
          }}
        />
        
        {poseData.length > 0 && (
          <div className="pose-indicator">
            <div className="indicator-dot"></div>
            <span className="indicator-text">Pose Overlay Active</span>
          </div>
        )}
        
        {/* Shot Indicator */}
        <ShotIndicator 
          currentShot={currentShot}
          isVisible={currentShot !== null}
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

export default AnalyzedVideoPlayer; 