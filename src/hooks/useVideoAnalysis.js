import { useState, useCallback } from 'react';
import { useTensorFlow } from './useTensorFlow.js';
import { analyzeShotSequence } from '../utils/shotClassification.js';

export function useVideoAnalysis() {
  const { detectPose, isInitialized } = useTensorFlow();
  const [analysisState, setAnalysisState] = useState('idle'); // idle, analyzing, complete, error
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [poseData, setPoseData] = useState([]);
  const [shotData, setShotData] = useState([]);
  const [analysisStats, setAnalysisStats] = useState({
    totalFrames: 0,
    processedFrames: 0,
    averageConfidence: 0,
    detectedShots: []
  });

  const analyzeVideo = useCallback(async (videoElement) => {
    if (!isInitialized || !videoElement) {
      console.error('TensorFlow not initialized or video not provided');
      return false;
    }

    console.log('Starting video analysis...');
    setAnalysisState('analyzing');
    setAnalysisProgress(0);
    setPoseData([]);
    setShotData([]);
    setAnalysisStats({
      totalFrames: 0,
      processedFrames: 0,
      averageConfidence: 0,
      detectedShots: []
    });

    try {
      const duration = videoElement.duration;
      const sampleInterval = 0.1; // Sample every 0.1 seconds for ultra-smooth tracking
      const totalSamples = Math.floor(duration / sampleInterval);
      
      console.log(`Analyzing video: ${duration}s, ${totalSamples} samples at ${sampleInterval}s intervals`);

      const poses = [];
      let processedFrames = 0;
      let totalConfidence = 0;

      // Analyze video at regular intervals
      for (let sampleIndex = 0; sampleIndex < totalSamples; sampleIndex++) {
        const time = sampleIndex * sampleInterval;
        
        // Seek to specific time
        videoElement.currentTime = time;
        
        // Wait for seek to complete
        await new Promise((resolve) => {
          const handleSeeked = () => {
            videoElement.removeEventListener('seeked', handleSeeked);
            resolve();
          };
          videoElement.addEventListener('seeked', handleSeeked);
        });

        // Detect poses in current frame
        try {
          const framePoses = await detectPose(videoElement);
          
          if (framePoses && framePoses.length > 0) {
            const pose = framePoses[0];
            const confidence = pose.keypoints?.reduce((sum, kp) => sum + kp.score, 0) / pose.keypoints?.length || 0;
            
            poses.push({
              time,
              pose,
              confidence
            });
            
            totalConfidence += confidence;
          }
        } catch (error) {
          console.warn(`Error detecting pose at time ${time}:`, error);
        }

        processedFrames++;
        
        // Update progress
        const progress = (sampleIndex / totalSamples) * 100;
        setAnalysisProgress(progress);
        
        // Update stats every 20 samples (less frequent updates for better performance)
        if (sampleIndex % 20 === 0) {
          setAnalysisStats({
            totalFrames: totalSamples,
            processedFrames,
            averageConfidence: totalConfidence / processedFrames,
            detectedShots: [] // Will be populated after pose analysis
          });
        }
      }

      console.log(`Analysis complete: ${poses.length} poses detected`);
      
      // Analyze shots from pose data
      console.log('Analyzing tennis shots...');
      const shots = analyzeShotSequence(poses);
      console.log(`Shot analysis complete: ${shots.length} shots detected`);
      
      setPoseData(poses);
      setShotData(shots);
      setAnalysisState('complete');
      setAnalysisProgress(100);
      
      setAnalysisStats({
        totalFrames: totalSamples,
        processedFrames,
        averageConfidence: totalConfidence / processedFrames,
        detectedShots: shots
      });

      return true;

    } catch (error) {
      console.error('Video analysis error:', error);
      setAnalysisState('error');
      return false;
    }
  }, [isInitialized, detectPose]);

  const getPoseAtTime = useCallback((time) => {
    if (!poseData.length) return null;
    
    // Find the closest pose data to the given time
    const closest = poseData.reduce((prev, curr) => {
      return Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev;
    });
    
    return closest;
  }, [poseData]);

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
    
    // If we have both poses, interpolate between them with advanced smoothing
    if (beforePose && afterPose) {
      const timeDiff = afterPose.time - beforePose.time;
      const rawInterpolationFactor = (time - beforePose.time) / timeDiff;
      
      // Apply advanced easing function for ultra-smooth interpolation
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

  // Advanced easing function for ultra-smooth interpolation
  const easeInOutQuart = (t) => {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  };

  // Original easing function (keeping for reference)
  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const getShotAtTime = useCallback((time) => {
    if (!shotData.length) return null;
    
    // Find shot that contains the current time
    return shotData.find(shot => 
      time >= shot.startTime && time <= shot.endTime
    );
  }, [shotData]);

  const resetAnalysis = useCallback(() => {
    setAnalysisState('idle');
    setAnalysisProgress(0);
    setPoseData([]);
    setShotData([]);
    setAnalysisStats({
      totalFrames: 0,
      processedFrames: 0,
      averageConfidence: 0,
      detectedShots: []
    });
  }, []);

  return {
    analyzeVideo,
    getPoseAtTime,
    getInterpolatedPose,
    getShotAtTime,
    resetAnalysis,
    analysisState,
    analysisProgress,
    poseData,
    shotData,
    analysisStats,
    hasAnalysisData: poseData.length > 0
  };
} 