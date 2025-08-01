import React, { useRef, useEffect } from 'react';
import './PoseOverlay.css';

function PoseOverlay({ videoElement, isActive, onCanvasReady }) {
  const canvasRef = useRef(null);
  const lastDimensionsRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (!videoElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoElement;

    const resizeCanvas = () => {
      if (video.videoWidth && video.videoHeight) {
        const newDimensions = { width: video.videoWidth, height: video.videoHeight };
        const lastDimensions = lastDimensionsRef.current;
        
        // Only resize if dimensions actually changed AND pose detection is not active
        if ((newDimensions.width !== lastDimensions.width || newDimensions.height !== lastDimensions.height) && !isActive) {
          console.log('Resizing canvas to:', video.videoWidth, 'x', video.videoHeight);
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          lastDimensionsRef.current = newDimensions;
          
          // Test drawing to verify canvas is working
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          console.log('Test drawing applied to canvas');
          
          // Notify parent that canvas is ready
          onCanvasReady?.(canvas);
        }
      }
    };

    // Initial resize
    resizeCanvas();

    // Handle video metadata load
    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded');
      resizeCanvas();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoElement, onCanvasReady, isActive]);

  useEffect(() => {
    console.log('Pose overlay active:', isActive);
    
    // Test drawing when active
    if (isActive && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      console.log('Active test drawing applied');
    }
  }, [isActive]);

  return (
    <div className={`pose-overlay ${isActive ? 'active' : ''}`}>
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
      
      {isActive && (
        <div className="pose-indicator">
          <div className="indicator-dot"></div>
          <span className="indicator-text">Pose Detection Active</span>
        </div>
      )}
    </div>
  );
}

export default PoseOverlay; 