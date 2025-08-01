import { useState, useRef, useCallback } from 'react';
import { useTensorFlow } from './useTensorFlow.js';

export function usePoseDetection() {
  const { detectPose, isInitialized } = useTensorFlow();
  const [poses, setPoses] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionStats, setDetectionStats] = useState({
    totalFrames: 0,
    processedFrames: 0,
    averageConfidence: 0,
    lastDetectionTime: null
  });
  
  const detectionIntervalRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startPoseDetection = useCallback(async (videoElement, canvasElement) => {
    console.log('Starting pose detection with:', { videoElement, canvasElement, isInitialized });
    
    if (!isInitialized || !videoElement || !canvasElement) {
      console.error('TensorFlow not initialized or video/canvas not provided');
      return false;
    }

    videoRef.current = videoElement;
    canvasRef.current = canvasElement;
    
    setIsDetecting(true);
    setPoses([]);
    setDetectionStats({
      totalFrames: 0,
      processedFrames: 0,
      averageConfidence: 0,
      lastDetectionTime: null
    });

    // Set up canvas for overlay
    const canvas = canvasElement;
    const ctx = canvas.getContext('2d');
    
    // Match canvas size to video
    const resizeCanvas = () => {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      console.log('Canvas resized to:', canvas.width, 'x', canvas.height);
    };

    // Initial resize
    resizeCanvas();

    // Handle video resize
    videoElement.addEventListener('loadedmetadata', resizeCanvas);

    const processFrame = async () => {
      if (!videoElement || videoElement.ended) {
        console.log('Video ended, stopping pose detection');
        return;
      }

      // Allow processing even when paused
      if (videoElement.paused) {
        console.log('Video paused, processing current frame');
      }

      try {
        console.log('Processing frame at time:', videoElement.currentTime);
        const startTime = performance.now();
        
        // Detect poses in current frame
        console.log('Calling detectPose...');
        const framePoses = await detectPose(videoElement);
        console.log('Pose detection result:', framePoses);
        
        if (framePoses && framePoses.length > 0) {
          console.log('Poses detected:', framePoses.length);
          setPoses(framePoses);
          
          // Update detection stats
          const confidence = framePoses[0]?.keypoints?.reduce((sum, kp) => sum + kp.score, 0) / framePoses[0]?.keypoints?.length || 0;
          
          setDetectionStats(prev => ({
            totalFrames: prev.totalFrames + 1,
            processedFrames: prev.processedFrames + 1,
            averageConfidence: (prev.averageConfidence * prev.processedFrames + confidence) / (prev.processedFrames + 1),
            lastDetectionTime: new Date()
          }));

          // Draw pose overlay
          console.log('Drawing pose overlay...');
          drawPoseOverlay(ctx, framePoses, canvas.width, canvas.height);

          const endTime = performance.now();
          const processingTime = endTime - startTime;
          
          // Log performance metrics
          if (detectionStats.processedFrames % 30 === 0) { // Log every 30 frames
            console.log(`Pose detection: ${processingTime.toFixed(2)}ms, Confidence: ${confidence.toFixed(3)}`);
          }
        } else {
          console.log('No poses detected in frame');
          // No poses detected, still count as processed frame
          setDetectionStats(prev => ({
            ...prev,
            totalFrames: prev.totalFrames + 1,
            processedFrames: prev.processedFrames + 1
          }));
        }

      } catch (error) {
        console.error('Pose detection error:', error);
        setDetectionStats(prev => ({
          ...prev,
          totalFrames: prev.totalFrames + 1
        }));
      }

      // Schedule next frame processing
      if (isDetecting) {
        detectionIntervalRef.current = requestAnimationFrame(processFrame);
      }
    };

    // Start processing frames
    console.log('Starting frame processing...');
    processFrame();

    return true;
  }, [isInitialized, detectPose, detectionStats.processedFrames]);

  const stopPoseDetection = useCallback(() => {
    console.log('Stopping pose detection');
    setIsDetecting(false);
    
    if (detectionIntervalRef.current) {
      cancelAnimationFrame(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setPoses([]);
  }, []);

  const drawPoseOverlay = useCallback((ctx, poses, width, height) => {
    console.log('Drawing pose overlay:', { poses: poses?.length, width, height });
    
    // Clear previous drawings
    ctx.clearRect(0, 0, width, height);
    
    if (!poses || poses.length === 0) {
      console.log('No poses to draw');
      return;
    }

    const pose = poses[0]; // Use first detected pose
    
    if (!pose.keypoints) {
      console.log('No keypoints in pose');
      return;
    }

    console.log('Drawing keypoints:', pose.keypoints.length);

    // Draw keypoints
    pose.keypoints.forEach((keypoint, index) => {
      if (keypoint.score > 0.3) { // Confidence threshold
        console.log(`Drawing keypoint ${index}:`, keypoint);
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#00ff00';
        ctx.fill();
      }
    });

    // Draw skeleton connections (basic connections for now)
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

    connections.forEach(([start, end]) => {
      const startPoint = pose.keypoints[start];
      const endPoint = pose.keypoints[end];
      
      if (startPoint?.score > 0.3 && endPoint?.score > 0.3) {
        console.log(`Drawing connection ${start}-${end}:`, startPoint, endPoint);
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, []);

  const getPoseData = useCallback(() => {
    return {
      poses,
      isDetecting,
      detectionStats,
      hasPoseData: poses.length > 0
    };
  }, [poses, isDetecting, detectionStats]);

  return {
    startPoseDetection,
    stopPoseDetection,
    getPoseData,
    isDetecting,
    detectionStats,
    hasPoseData: poses.length > 0
  };
} 