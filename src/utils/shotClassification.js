import { POSE_KEYPOINTS } from '../constants/poseConstants.js';

// Tennis-relevant keypoint indices
const TENNIS_KEYPOINTS = {
  // Arms (most important for tennis)
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  
  // Body positioning
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  
  // Head for serve detection
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2
};

// Shot types
export const SHOT_TYPES = {
  FOREHAND: 'forehand',
  BACKHAND: 'backhand',
  SERVE: 'serve',
  UNKNOWN: 'unknown'
};

// Shot detection parameters (normalized)
const SHOT_DETECTION_CONFIG = {
  // Minimum shot duration (seconds)
  MIN_SHOT_DURATION: 0.8,
  // Maximum shot duration (seconds)
  MAX_SHOT_DURATION: 3.0,
  // Minimum time between shots (seconds)
  MIN_TIME_BETWEEN_SHOTS: 1.0,
  // Velocity threshold (normalized units per second)
  VELOCITY_THRESHOLD_HIGH: 1.0,  // Start shot detection (lowered from 2.0)
  VELOCITY_THRESHOLD_LOW: 0.3,   // End shot detection (lowered from 0.8)
  // Minimum confidence for shot classification
  MIN_CONFIDENCE: 0.25,          // Lowered from 0.4 to allow more shots
  // Minimum keypoint confidence
  MIN_KEYPOINT_CONFIDENCE: 0.2   // Lowered from 0.3
};

/**
 * Normalize coordinates relative to body scale
 */
function normalizeCoordinates(features) {
  if (!features.leftHip || !features.rightHip || !features.leftShoulder || !features.rightShoulder) {
    return null;
  }

  // Calculate body center and scale
  const midHip = {
    x: (features.leftHip.x + features.rightHip.x) / 2,
    y: (features.leftHip.y + features.rightHip.y) / 2
  };
  
  const midShoulder = {
    x: (features.leftShoulder.x + features.rightShoulder.x) / 2,
    y: (features.leftShoulder.y + features.rightShoulder.y) / 2
  };
  
  // Use torso length as scale
  const torsoLength = Math.sqrt(
    Math.pow(midShoulder.x - midHip.x, 2) + 
    Math.pow(midShoulder.y - midHip.y, 2)
  );
  
  if (torsoLength < 10) return null; // Too small, likely bad detection
  
  // Normalize all points relative to body center and scale
  const normalizePoint = (point) => ({
    x: (point.x - midHip.x) / torsoLength,
    y: (point.y - midHip.y) / torsoLength
  });
  
  return {
    ...features,
    leftWrist: normalizePoint(features.leftWrist),
    rightWrist: normalizePoint(features.rightWrist),
    leftElbow: normalizePoint(features.leftElbow),
    rightElbow: normalizePoint(features.rightElbow),
    leftShoulder: normalizePoint(features.leftShoulder),
    rightShoulder: normalizePoint(features.rightShoulder),
    leftHip: normalizePoint(features.leftHip),
    rightHip: normalizePoint(features.rightHip),
    nose: normalizePoint(features.nose),
    midHip,
    midShoulder,
    torsoLength,
    confidence: features.confidence,
    time: features.time
  };
}

/**
 * Detect handedness based on wrist movement patterns
 */
function detectHandedness(poseData) {
  console.log('Analyzing handedness...');

  console.log('poseData!!!!!!', poseData);

  if (poseData.length < 3) return { racketHand: 'right', confidence: 0.5 };
  
  let rightHandScore = 0;
  let leftHandScore = 0;
  let totalFrames = 0;
  
  console.log('Analyzing handedness...');
  
  for (let i = 1; i < poseData.length; i++) {
    const currentFeatures = extractTennisFeatures(poseData[i]);
    const previousFeatures = extractTennisFeatures(poseData[i - 1]);
    
    if (!currentFeatures || !previousFeatures) continue;
    
    const normalizedCurrent = normalizeCoordinates(currentFeatures);
    const normalizedPrevious = normalizeCoordinates(previousFeatures);
    
    if (!normalizedCurrent || !normalizedPrevious) continue;
    
    // Calculate wrist velocities
    const dt = Math.max(1e-3, currentFeatures.time - previousFeatures.time);
    
    const rightWristVelocity = Math.sqrt(
      Math.pow(normalizedCurrent.rightWrist.x - normalizedPrevious.rightWrist.x, 2) +
      Math.pow(normalizedCurrent.rightWrist.y - normalizedPrevious.rightWrist.y, 2)
    ) / dt;
    
    const leftWristVelocity = Math.sqrt(
      Math.pow(normalizedCurrent.leftWrist.x - normalizedPrevious.leftWrist.x, 2) +
      Math.pow(normalizedCurrent.leftWrist.y - normalizedPrevious.leftWrist.y, 2)
    ) / dt;
    
    // Score based on velocity and distance from torso center
    const rightDistanceFromCenter = Math.abs(normalizedCurrent.rightWrist.x);
    const leftDistanceFromCenter = Math.abs(normalizedCurrent.leftWrist.x);
    
    rightHandScore += rightWristVelocity * rightDistanceFromCenter;
    leftHandScore += leftWristVelocity * leftDistanceFromCenter;
    totalFrames++;
  }
  
  if (totalFrames === 0) return { racketHand: 'right', confidence: 0.5 };
  
  const rightScore = rightHandScore / totalFrames;
  const leftScore = leftHandScore / totalFrames;
  
  console.log(`Handedness analysis: rightScore=${rightScore.toFixed(3)}, leftScore=${leftScore.toFixed(3)}`);
  
  if (rightScore > leftScore * 1.2) {
    return { racketHand: 'right', confidence: Math.min(rightScore / (rightScore + leftScore), 0.95) };
  } else if (leftScore > rightScore * 1.2) {
    return { racketHand: 'left', confidence: Math.min(leftScore / (rightScore + leftScore), 0.95) };
  } else {
    return { racketHand: 'right', confidence: 0.5 }; // Default to right-handed
  }
}

/**
 * Extract tennis-relevant features from pose data
 */
export function extractTennisFeatures(poseData) {
  if (!poseData || !poseData.pose || !poseData.pose.keypoints) {
    return null;
  }

  const keypoints = poseData.pose.keypoints;
  
  // Extract key tennis positions
  const features = {
    // Arm positions
    leftWrist: keypoints[TENNIS_KEYPOINTS.LEFT_WRIST],
    rightWrist: keypoints[TENNIS_KEYPOINTS.RIGHT_WRIST],
    leftElbow: keypoints[TENNIS_KEYPOINTS.LEFT_ELBOW],
    rightElbow: keypoints[TENNIS_KEYPOINTS.RIGHT_ELBOW],
    leftShoulder: keypoints[TENNIS_KEYPOINTS.LEFT_SHOULDER],
    rightShoulder: keypoints[TENNIS_KEYPOINTS.RIGHT_SHOULDER],
    
    // Body positioning
    leftHip: keypoints[TENNIS_KEYPOINTS.LEFT_HIP],
    rightHip: keypoints[TENNIS_KEYPOINTS.RIGHT_HIP],
    
    // Head for serve detection
    nose: keypoints[TENNIS_KEYPOINTS.NOSE],
    
    // Overall confidence
    confidence: poseData.confidence,
    time: poseData.time
  };

  return features;
}

/**
 * Calculate movement patterns with proper dt and normalization
 */
export function analyzeTennisMovement(currentFeatures, previousFeatures, handedness) {
  if (!currentFeatures || !previousFeatures) {
    return null;
  }

  // Normalize coordinates
  const normalizedCurrent = normalizeCoordinates(currentFeatures);
  const normalizedPrevious = normalizeCoordinates(previousFeatures);
  
  if (!normalizedCurrent || !normalizedPrevious) {
    return null;
  }

  // Calculate proper dt
  const dt = Math.max(1e-3, currentFeatures.time - previousFeatures.time);
  
  // Determine racket hand based on handedness
  const racketWrist = handedness.racketHand === 'left' ? normalizedCurrent.leftWrist : normalizedCurrent.rightWrist;
  const racketElbow = handedness.racketHand === 'left' ? normalizedCurrent.leftElbow : normalizedCurrent.rightElbow;
  const offWrist = handedness.racketHand === 'left' ? normalizedCurrent.rightWrist : normalizedCurrent.leftWrist;
  const offElbow = handedness.racketHand === 'left' ? normalizedCurrent.rightElbow : normalizedCurrent.leftElbow;
  
  const prevRacketWrist = handedness.racketHand === 'left' ? normalizedPrevious.leftWrist : normalizedPrevious.rightWrist;
  const prevRacketElbow = handedness.racketHand === 'left' ? normalizedPrevious.leftElbow : normalizedPrevious.leftElbow;
  const prevOffWrist = handedness.racketHand === 'left' ? normalizedPrevious.rightWrist : normalizedPrevious.leftWrist;
  const prevOffElbow = handedness.racketHand === 'left' ? normalizedPrevious.rightElbow : normalizedPrevious.leftElbow;

  // Calculate racket hand movement
  const racketWristDeltaX = racketWrist.x - prevRacketWrist.x;
  const racketWristDeltaY = racketWrist.y - prevRacketWrist.y;
  const racketWristDistance = Math.sqrt(racketWristDeltaX * racketWristDeltaX + racketWristDeltaY * racketWristDeltaY);
  const racketWristVelocity = racketWristDistance / dt;
  
  // Calculate off hand movement
  const offWristDeltaX = offWrist.x - prevOffWrist.x;
  const offWristDeltaY = offWrist.y - prevOffWrist.y;
  const offWristDistance = Math.sqrt(offWristDeltaX * offWristDeltaX + offWristDeltaY * offWristDeltaY);
  const offWristVelocity = offWristDistance / dt;
  
  // Calculate shoulder rotation
  const prevShoulderAngle = Math.atan2(
    normalizedPrevious.rightShoulder.y - normalizedPrevious.leftShoulder.y,
    normalizedPrevious.rightShoulder.x - normalizedPrevious.leftShoulder.x
  );
  
  const currShoulderAngle = Math.atan2(
    normalizedCurrent.rightShoulder.y - normalizedCurrent.leftShoulder.y,
    normalizedCurrent.rightShoulder.x - normalizedCurrent.leftShoulder.x
  );
  
  const shoulderRotation = (currShoulderAngle - prevShoulderAngle) / dt;
  
  // Calculate hands together (for two-handed backhand)
  const handsDistance = Math.sqrt(
    Math.pow(racketWrist.x - offWrist.x, 2) + 
    Math.pow(racketWrist.y - offWrist.y, 2)
  );
  
  // Calculate wrist height relative to shoulders
  const shoulderHeight = (normalizedCurrent.leftShoulder.y + normalizedCurrent.rightShoulder.y) / 2;
  const racketWristHeight = racketWrist.y - shoulderHeight;
  const offWristHeight = offWrist.y - shoulderHeight;
  
  // Determine side (dominant vs off side)
  const midShoulderX = (normalizedCurrent.leftShoulder.x + normalizedCurrent.rightShoulder.x) / 2;
  const sideSign = Math.sign(racketWrist.x - midShoulderX);

  // Debug logging for first few frames
  if (currentFeatures.time < 2.0) {
    console.log(`Time ${currentFeatures.time.toFixed(1)}s: racketVelocity=${racketWristVelocity.toFixed(3)}, offVelocity=${offWristVelocity.toFixed(3)}, confidence=${currentFeatures.confidence.toFixed(2)}`);
  }

  return {
    // Racket hand movement
    racketWristVelocity,
    racketWristDistance,
    racketWristDeltaX,
    racketWristDeltaY,
    
    // Off hand movement
    offWristVelocity,
    offWristDistance,
    
    // Body movement
    shoulderRotation,
    shoulderRotationMagnitude: Math.abs(shoulderRotation),
    
    // Shot classification features
    racketWristHeight,
    offWristHeight,
    handsDistance,
    sideSign,
    
    // Movement characteristics
    isHorizontal: Math.abs(racketWristDeltaX) > Math.abs(racketWristDeltaY),
    isVertical: Math.abs(racketWristDeltaY) > Math.abs(racketWristDeltaX),
    isUpward: racketWristDeltaY < 0,
    
    // Overall movement intensity (normalized)
    movementIntensity: (racketWristVelocity + offWristVelocity) / 2,
    
    // Keypoint confidence
    keypointConfidence: Math.min(
      currentFeatures.leftWrist?.score || 0,
      currentFeatures.rightWrist?.score || 0,
      currentFeatures.leftShoulder?.score || 0,
      currentFeatures.rightShoulder?.score || 0
    )
  };
}

/**
 * Detect shot sequences with improved algorithm
 */
export function detectShotSequences(poseData) {
  if (!poseData || poseData.length < 3) {
    return [];
  }

  // Detect handedness first
  const handedness = detectHandedness(poseData);
  console.log('Detected handedness:', handedness);

  const shotSequences = [];
  let currentSequence = null;
  let sequenceStartTime = null;
  let highVelocityFrames = 0;
  let totalVelocity = 0;
  let velocityHistory = [];
  let totalFramesAnalyzed = 0;
  let framesWithHighVelocity = 0;

  // Analyze movement patterns to detect shot sequences
  for (let i = 1; i < poseData.length; i++) {
    const currentPose = poseData[i];
    const previousPose = poseData[i - 1];
    
    // Extract features
    const currentFeatures = extractTennisFeatures(currentPose);
    const previousFeatures = extractTennisFeatures(previousPose);
    
    if (!currentFeatures || !previousFeatures) continue;
    
    // Analyze movement
    const movement = analyzeTennisMovement(currentFeatures, previousFeatures, handedness);
    if (!movement) continue;
    
    totalFramesAnalyzed++;
    
    // Skip low-confidence frames
    if (movement.keypointConfidence < SHOT_DETECTION_CONFIG.MIN_KEYPOINT_CONFIDENCE) {
      continue;
    }
    
    const racketVelocity = movement.racketWristVelocity;
    velocityHistory.push(racketVelocity);
    
    // Keep only recent history for threshold calculation
    if (velocityHistory.length > 10) {
      velocityHistory.shift();
    }
    
    // Calculate adaptive threshold (but with minimum values)
    const meanVelocity = velocityHistory.reduce((sum, v) => sum + v, 0) / velocityHistory.length;
    const velocityStd = Math.sqrt(
      velocityHistory.reduce((sum, v) => sum + Math.pow(v - meanVelocity, 2), 0) / velocityHistory.length
    );
    
    // Use adaptive threshold but with minimum fallback
    const highThreshold = Math.max(meanVelocity + 1.5 * velocityStd, SHOT_DETECTION_CONFIG.VELOCITY_THRESHOLD_HIGH);
    const lowThreshold = Math.max(meanVelocity + 0.3 * velocityStd, SHOT_DETECTION_CONFIG.VELOCITY_THRESHOLD_LOW);
    
    // Debug logging
    if (totalFramesAnalyzed % 20 === 0) {
      console.log(`Frame ${totalFramesAnalyzed}: velocity=${racketVelocity.toFixed(2)}, highThreshold=${highThreshold.toFixed(2)}, lowThreshold=${lowThreshold.toFixed(2)}`);
    }
    
    // Detect high velocity periods (potential shots)
    if (racketVelocity > highThreshold) {
      framesWithHighVelocity++;
      highVelocityFrames++;
      
      if (!currentSequence) {
        // Start of potential shot sequence
        currentSequence = {
          startTime: currentPose.time,
          frames: [],
          maxVelocity: racketVelocity,
          totalVelocity: racketVelocity,
          peakVelocity: racketVelocity,
          peakTime: currentPose.time
        };
        sequenceStartTime = currentPose.time;
        
        // Add first frame to sequence
        currentSequence.frames.push({
          time: currentPose.time,
          movement,
          features: currentFeatures
        });
        
        console.log(`Started shot sequence at ${currentPose.time.toFixed(1)}s with velocity ${racketVelocity.toFixed(2)}`);
      } else {
        // Continue current sequence
        currentSequence.frames.push({
          time: currentPose.time,
          movement,
          features: currentFeatures
        });
        currentSequence.maxVelocity = Math.max(currentSequence.maxVelocity, racketVelocity);
        currentSequence.totalVelocity += racketVelocity;
        
        // Track peak velocity
        if (racketVelocity > currentSequence.peakVelocity) {
          currentSequence.peakVelocity = racketVelocity;
          currentSequence.peakTime = currentPose.time;
        }
      }
    } else if (currentSequence && racketVelocity < lowThreshold) {
      // Low velocity - check if we should end the sequence
      const sequenceDuration = currentPose.time - sequenceStartTime;
      
      if (sequenceDuration > SHOT_DETECTION_CONFIG.MIN_SHOT_DURATION && 
          highVelocityFrames >= 2) { // Lowered from 3 to 2
        
        // End current sequence and classify it
        currentSequence.endTime = currentPose.time;
        currentSequence.duration = sequenceDuration;
        currentSequence.averageVelocity = currentSequence.totalVelocity / currentSequence.frames.length;
        
        console.log(`Ended shot sequence at ${currentPose.time.toFixed(1)}s, duration=${sequenceDuration.toFixed(1)}s, frames=${currentSequence.frames.length}`);
        
        // Classify the shot sequence
        const classification = classifyShotSequence(currentSequence, handedness);
        
        if (classification.confidence >= SHOT_DETECTION_CONFIG.MIN_CONFIDENCE) {
          shotSequences.push({
            ...classification,
            startTime: currentSequence.startTime,
            endTime: currentSequence.endTime,
            duration: currentSequence.duration,
            maxVelocity: currentSequence.maxVelocity,
            peakVelocity: currentSequence.peakVelocity,
            peakTime: currentSequence.peakTime,
            averageVelocity: currentSequence.averageVelocity
          });
          
          console.log(`Detected ${classification.type} shot with confidence ${(classification.confidence * 100).toFixed(0)}%`);
        } else {
          console.log(`Shot sequence rejected: confidence ${(classification.confidence * 100).toFixed(0)}% < ${(SHOT_DETECTION_CONFIG.MIN_CONFIDENCE * 100).toFixed(0)}%`);
        }
        
        // Reset for next sequence
        currentSequence = null;
        sequenceStartTime = null;
        highVelocityFrames = 0;
      }
    }
    
    // Force end sequence if too long
    if (currentSequence && (currentPose.time - sequenceStartTime) > SHOT_DETECTION_CONFIG.MAX_SHOT_DURATION) {
      currentSequence.endTime = currentPose.time;
      currentSequence.duration = currentPose.time - sequenceStartTime;
      currentSequence.averageVelocity = currentSequence.totalVelocity / currentSequence.frames.length;
      
      console.log(`Forced end shot sequence at ${currentPose.time.toFixed(1)}s (max duration)`);
      
      const classification = classifyShotSequence(currentSequence, handedness);
      
      if (classification.confidence >= SHOT_DETECTION_CONFIG.MIN_CONFIDENCE) {
        shotSequences.push({
          ...classification,
          startTime: currentSequence.startTime,
          endTime: currentSequence.endTime,
          duration: currentSequence.duration,
          maxVelocity: currentSequence.maxVelocity,
          peakVelocity: currentSequence.peakVelocity,
          peakTime: currentSequence.peakTime,
          averageVelocity: currentSequence.averageVelocity
        });
        
        console.log(`Detected ${classification.type} shot with confidence ${(classification.confidence * 100).toFixed(0)}%`);
      }
      
      currentSequence = null;
      sequenceStartTime = null;
      highVelocityFrames = 0;
    }
  }

  // Handle final sequence if still active
  if (currentSequence && highVelocityFrames >= 2) { // Lowered from 3 to 2
    const sequenceDuration = poseData[poseData.length - 1].time - sequenceStartTime;
    
    if (sequenceDuration > SHOT_DETECTION_CONFIG.MIN_SHOT_DURATION) {
      currentSequence.endTime = poseData[poseData.length - 1].time;
      currentSequence.duration = sequenceDuration;
      currentSequence.averageVelocity = currentSequence.totalVelocity / currentSequence.frames.length;
      
      console.log(`Final shot sequence: duration=${sequenceDuration.toFixed(1)}s, frames=${currentSequence.frames.length}`);
      
      const classification = classifyShotSequence(currentSequence, handedness);
      
      if (classification.confidence >= SHOT_DETECTION_CONFIG.MIN_CONFIDENCE) {
        shotSequences.push({
          ...classification,
          startTime: currentSequence.startTime,
          endTime: currentSequence.endTime,
          duration: currentSequence.duration,
          maxVelocity: currentSequence.maxVelocity,
          peakVelocity: currentSequence.peakVelocity,
          peakTime: currentSequence.peakTime,
          averageVelocity: currentSequence.averageVelocity
        });
        
        console.log(`Detected ${classification.type} shot with confidence ${(classification.confidence * 100).toFixed(0)}%`);
      }
    }
  }

  console.log(`Analysis complete: ${totalFramesAnalyzed} frames analyzed, ${framesWithHighVelocity} high-velocity frames, ${shotSequences.length} shots detected`);

  // Filter out overlapping shots and ensure minimum time between shots
  return filterShotSequences(shotSequences);
}

/**
 * Classify a shot sequence based on movement patterns
 */
function classifyShotSequence(sequence, handedness) {
  if (!sequence.frames || sequence.frames.length === 0) {
    return { type: SHOT_TYPES.UNKNOWN, confidence: 0 };
  }

  let forehandScore = 0;
  let backhandScore = 0;
  let serveScore = 0;
  let totalFrames = sequence.frames.length;
  let highConfidenceFrames = 0;
  let totalConfidence = 0;

  console.log(`Classifying sequence with ${totalFrames} frames, peak velocity: ${sequence.peakVelocity.toFixed(2)}`);

  // Analyze each frame in the sequence
  sequence.frames.forEach((frame, index) => {
    const movement = frame.movement;
    const features = frame.features;
    
    // Weight by keypoint confidence
    const confidenceWeight = movement.keypointConfidence;
    totalConfidence += confidenceWeight;
    highConfidenceFrames += confidenceWeight > 0.5 ? 1 : 0;
    
    console.log(`Frame ${index}: velocity=${movement.racketWristVelocity.toFixed(2)}, confidence=${confidenceWeight.toFixed(2)}, sideSign=${movement.sideSign}, isHorizontal=${movement.isHorizontal}, isUpward=${movement.isUpward}`);
    
    // Check for serve (upward motion, high position)
    if (movement.isUpward && movement.racketWristHeight < -0.1) { // Relaxed from -0.2
      serveScore += 2 * confidenceWeight;
      console.log(`  -> Serve indicator: upward motion, height=${movement.racketWristHeight.toFixed(2)}`);
    }

    // Check for forehand (dominant side, horizontal motion)
    if (movement.isHorizontal && movement.sideSign > 0) {
      forehandScore += 1.5 * confidenceWeight;
      console.log(`  -> Forehand indicator: dominant side, horizontal`);
    }

    // Check for backhand (off side, horizontal motion)
    if (movement.isHorizontal && movement.sideSign < 0) {
      backhandScore += 1.5 * confidenceWeight;
      console.log(`  -> Backhand indicator: off side, horizontal`);
      
      // Bonus for two-handed backhand
      if (movement.handsDistance < 0.5) { // Relaxed from 0.3
        backhandScore += 0.5 * confidenceWeight;
        console.log(`  -> Two-handed backhand bonus: hands distance=${movement.handsDistance.toFixed(2)}`);
      }
    }
  });

  // Calculate final scores
  const maxScore = Math.max(forehandScore, backhandScore, serveScore);
  let shotType = SHOT_TYPES.UNKNOWN;
  let confidence = 0;

  console.log(`Final scores: forehand=${forehandScore.toFixed(2)}, backhand=${backhandScore.toFixed(2)}, serve=${serveScore.toFixed(2)}`);

  if (maxScore > 0) {
    const confidenceCoverage = highConfidenceFrames / totalFrames;
    const averageConfidence = totalConfidence / totalFrames;
    const peakVelocityFactor = Math.min(sequence.peakVelocity / 3.0, 1.0); // Relaxed from 5.0
    
    console.log(`Factors: coverage=${confidenceCoverage.toFixed(2)}, avgConfidence=${averageConfidence.toFixed(2)}, peakFactor=${peakVelocityFactor.toFixed(2)}`);
    
    if (serveScore === maxScore) {
      shotType = SHOT_TYPES.SERVE;
      confidence = Math.min(serveScore / (totalFrames * 1.5), 0.95) * confidenceCoverage * peakVelocityFactor; // Relaxed from 2.0
    } else if (forehandScore === maxScore) {
      shotType = SHOT_TYPES.FOREHAND;
      confidence = Math.min(forehandScore / (totalFrames * 1.2), 0.95) * confidenceCoverage * peakVelocityFactor; // Relaxed from 1.5
    } else if (backhandScore === maxScore) {
      shotType = SHOT_TYPES.BACKHAND;
      confidence = Math.min(backhandScore / (totalFrames * 1.2), 0.95) * confidenceCoverage * peakVelocityFactor; // Relaxed from 1.5
    }
    
    // Boost confidence for high peak velocity
    if (sequence.peakVelocity > 5.0) {
      confidence = Math.min(confidence * 1.5, 0.95);
    }
    
    // Boost confidence for longer sequences
    if (sequence.duration > 1.5) {
      confidence = Math.min(confidence * 1.2, 0.95);
    }
  }

  console.log(`Classification result: ${shotType}, confidence=${(confidence * 100).toFixed(0)}%`);

  return {
    type: shotType,
    confidence: Math.max(confidence, 0.1),
    reasoning: generateShotReasoning(shotType, sequence, handedness)
  };
}

/**
 * Generate reasoning for shot classification
 */
function generateShotReasoning(shotType, sequence, handedness) {
  const reasoning = [];
  
  reasoning.push(`Racket hand: ${handedness.racketHand}-handed`);
  reasoning.push(`Peak velocity: ${sequence.peakVelocity.toFixed(2)}`);
  reasoning.push(`Duration: ${sequence.duration.toFixed(1)}s`);
  
  if (shotType === SHOT_TYPES.SERVE) {
    reasoning.push('Upward motion detected');
    reasoning.push('Wrist above shoulder level');
  } else if (shotType === SHOT_TYPES.FOREHAND) {
    reasoning.push('Dominant side swing');
    reasoning.push('Horizontal motion pattern');
  } else if (shotType === SHOT_TYPES.BACKHAND) {
    reasoning.push('Off-side swing');
    reasoning.push('Horizontal motion pattern');
  } else {
    reasoning.push('Insufficient movement patterns');
    reasoning.push('Low confidence classification');
  }
  
  return reasoning;
}

/**
 * Filter shot sequences to remove overlaps and ensure minimum spacing
 */
function filterShotSequences(shotSequences) {
  if (shotSequences.length === 0) return [];

  // Sort by start time
  const sortedShots = shotSequences.sort((a, b) => a.startTime - b.startTime);
  const filteredShots = [];
  
  for (let i = 0; i < sortedShots.length; i++) {
    const currentShot = sortedShots[i];
    
    // Check if this shot overlaps with the previous one
    const previousShot = filteredShots[filteredShots.length - 1];
    
    if (!previousShot || 
        (currentShot.startTime - previousShot.endTime) >= SHOT_DETECTION_CONFIG.MIN_TIME_BETWEEN_SHOTS) {
      filteredShots.push(currentShot);
    } else {
      // If overlap, keep the one with higher confidence
      if (currentShot.confidence > previousShot.confidence) {
        filteredShots[filteredShots.length - 1] = currentShot;
      }
    }
  }

  return filteredShots;
}

/**
 * Analyze a sequence of poses to detect shots (legacy function for compatibility)
 */
export function analyzeShotSequence(poseData) {
  return detectShotSequences(poseData);
} 