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

// Shot detection parameters
const SHOT_DETECTION_CONFIG = {
  // Minimum shot duration (seconds)
  MIN_SHOT_DURATION: 0.5,
  // Maximum shot duration (seconds)
  MAX_SHOT_DURATION: 1.5,
  // Minimum time between shots (seconds)
  MIN_TIME_BETWEEN_SHOTS: 0.8,
  // Minimum movement intensity for shot detection
  MIN_MOVEMENT_INTENSITY: 80,
  // Minimum confidence for shot classification
  MIN_CONFIDENCE: 0.6,
  // Shot detection window (seconds)
  DETECTION_WINDOW: 1.5
};

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
 * Calculate basic movement patterns for tennis shots
 */
export function analyzeTennisMovement(currentFeatures, previousFeatures) {
  if (!currentFeatures || !previousFeatures) {
    return null;
  }

  const movement = {
    // Arm movement analysis
    leftArmMovement: calculateArmMovement(
      previousFeatures.leftWrist, 
      currentFeatures.leftWrist,
      previousFeatures.leftElbow,
      currentFeatures.leftElbow
    ),
    
    rightArmMovement: calculateArmMovement(
      previousFeatures.rightWrist,
      currentFeatures.rightWrist,
      previousFeatures.rightElbow,
      currentFeatures.rightElbow
    ),
    
    // Body rotation
    shoulderRotation: calculateShoulderRotation(
      previousFeatures.leftShoulder,
      currentFeatures.leftShoulder,
      previousFeatures.rightShoulder,
      currentFeatures.rightShoulder
    ),
    
    // Vertical movement (for serve detection)
    verticalMovement: calculateVerticalMovement(
      previousFeatures.rightWrist,
      currentFeatures.rightWrist
    ),
    
    // Overall movement intensity
    movementIntensity: calculateMovementIntensity(currentFeatures, previousFeatures)
  };

  return movement;
}

/**
 * Calculate arm movement characteristics
 */
function calculateArmMovement(prevWrist, currWrist, prevElbow, currElbow) {
  if (!prevWrist || !currWrist || !prevElbow || !currElbow) {
    return null;
  }

  // Calculate wrist movement
  const wristDeltaX = currWrist.x - prevWrist.x;
  const wristDeltaY = currWrist.y - prevWrist.y;
  const wristDistance = Math.sqrt(wristDeltaX * wristDeltaX + wristDeltaY * wristDeltaY);
  
  // Calculate elbow movement
  const elbowDeltaX = currElbow.x - prevElbow.x;
  const elbowDeltaY = currElbow.y - prevElbow.y;
  const elbowDistance = Math.sqrt(elbowDeltaX * elbowDeltaX + elbowDeltaY * elbowDeltaY);

  return {
    // Movement direction
    direction: {
      x: wristDeltaX > 0 ? 'right' : 'left',
      y: wristDeltaY > 0 ? 'down' : 'up'
    },
    
    // Movement magnitude
    wristDistance,
    elbowDistance,
    
    // Movement speed (assuming 0.1s intervals)
    wristSpeed: wristDistance / 0.1,
    elbowSpeed: elbowDistance / 0.1,
    
    // Horizontal vs vertical movement
    isHorizontal: Math.abs(wristDeltaX) > Math.abs(wristDeltaY),
    isVertical: Math.abs(wristDeltaY) > Math.abs(wristDeltaX)
  };
}

/**
 * Calculate shoulder rotation for shot detection
 */
function calculateShoulderRotation(prevLeftShoulder, currLeftShoulder, prevRightShoulder, currRightShoulder) {
  if (!prevLeftShoulder || !currLeftShoulder || !prevRightShoulder || !currRightShoulder) {
    return null;
  }

  // Calculate shoulder line rotation
  const prevShoulderAngle = Math.atan2(
    prevRightShoulder.y - prevLeftShoulder.y,
    prevRightShoulder.x - prevLeftShoulder.x
  );
  
  const currShoulderAngle = Math.atan2(
    currRightShoulder.y - currLeftShoulder.y,
    currRightShoulder.x - currLeftShoulder.x
  );
  
  const rotationDelta = currShoulderAngle - prevShoulderAngle;
  
  return {
    rotationAngle: rotationDelta,
    rotationDirection: rotationDelta > 0 ? 'clockwise' : 'counterclockwise',
    rotationMagnitude: Math.abs(rotationDelta)
  };
}

/**
 * Calculate vertical movement for serve detection
 */
function calculateVerticalMovement(prevWrist, currWrist) {
  if (!prevWrist || !currWrist) {
    return null;
  }

  const deltaY = currWrist.y - prevWrist.y;
  
  return {
    direction: deltaY > 0 ? 'down' : 'up',
    magnitude: Math.abs(deltaY),
    isUpward: deltaY < 0
  };
}

/**
 * Calculate overall movement intensity
 */
function calculateMovementIntensity(currentFeatures, previousFeatures) {
  if (!currentFeatures || !previousFeatures) {
    return 0;
  }

  let totalMovement = 0;
  let movementCount = 0;

  // Sum up all joint movements
  const joints = ['leftWrist', 'rightWrist', 'leftElbow', 'rightElbow', 'leftShoulder', 'rightShoulder'];
  
  joints.forEach(joint => {
    const prev = previousFeatures[joint];
    const curr = currentFeatures[joint];
    
    if (prev && curr) {
      const deltaX = curr.x - prev.x;
      const deltaY = curr.y - prev.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      totalMovement += distance;
      movementCount++;
    }
  });

  return movementCount > 0 ? totalMovement / movementCount : 0;
}

/**
 * Detect shot sequences in pose data
 */
export function detectShotSequences(poseData) {
  if (!poseData || poseData.length < 3) {
    return [];
  }

  const shotSequences = [];
  let currentSequence = null;
  let sequenceStartTime = null;
  let highMovementFrames = 0;
  let totalMovement = 0;

  // Analyze movement patterns to detect shot sequences
  for (let i = 1; i < poseData.length; i++) {
    const currentPose = poseData[i];
    const previousPose = poseData[i - 1];
    
    // Extract features
    const currentFeatures = extractTennisFeatures(currentPose);
    const previousFeatures = extractTennisFeatures(previousPose);
    
    if (!currentFeatures || !previousFeatures) continue;
    
    // Analyze movement
    const movement = analyzeTennisMovement(currentFeatures, previousFeatures);
    if (!movement) continue;
    
    const movementIntensity = movement.movementIntensity;
    totalMovement += movementIntensity;
    
    // Detect high movement periods (potential shots)
    if (movementIntensity > SHOT_DETECTION_CONFIG.MIN_MOVEMENT_INTENSITY) {
      highMovementFrames++;
      
      if (!currentSequence) {
        // Start of potential shot sequence
        currentSequence = {
          startTime: currentPose.time,
          frames: [],
          maxIntensity: movementIntensity,
          totalMovement: movementIntensity
        };
        sequenceStartTime = currentPose.time;
      } else {
        // Continue current sequence
        currentSequence.frames.push({
          time: currentPose.time,
          movement,
          features: currentFeatures
        });
        currentSequence.maxIntensity = Math.max(currentSequence.maxIntensity, movementIntensity);
        currentSequence.totalMovement += movementIntensity;
      }
    } else if (currentSequence) {
      // Low movement - check if we should end the sequence
      const sequenceDuration = currentPose.time - sequenceStartTime;
      
      if (sequenceDuration > SHOT_DETECTION_CONFIG.MIN_SHOT_DURATION && 
          highMovementFrames >= 3) { // At least 3 high-movement frames
        
        // End current sequence and classify it
        currentSequence.endTime = currentPose.time;
        currentSequence.duration = sequenceDuration;
        currentSequence.averageIntensity = currentSequence.totalMovement / currentSequence.frames.length;
        
        // Classify the shot sequence
        const classification = classifyShotSequence(currentSequence);
        
        if (classification.confidence >= SHOT_DETECTION_CONFIG.MIN_CONFIDENCE) {
          shotSequences.push({
            ...classification,
            startTime: currentSequence.startTime,
            endTime: currentSequence.endTime,
            duration: currentSequence.duration,
            maxIntensity: currentSequence.maxIntensity,
            averageIntensity: currentSequence.averageIntensity
          });
        }
        
        // Reset for next sequence
        currentSequence = null;
        sequenceStartTime = null;
        highMovementFrames = 0;
      }
    }
  }

  // Handle final sequence if still active
  if (currentSequence && highMovementFrames >= 3) {
    const sequenceDuration = poseData[poseData.length - 1].time - sequenceStartTime;
    
    if (sequenceDuration > SHOT_DETECTION_CONFIG.MIN_SHOT_DURATION) {
      currentSequence.endTime = poseData[poseData.length - 1].time;
      currentSequence.duration = sequenceDuration;
      currentSequence.averageIntensity = currentSequence.totalMovement / currentSequence.frames.length;
      
      const classification = classifyShotSequence(currentSequence);
      
      if (classification.confidence >= SHOT_DETECTION_CONFIG.MIN_CONFIDENCE) {
        shotSequences.push({
          ...classification,
          startTime: currentSequence.startTime,
          endTime: currentSequence.endTime,
          duration: currentSequence.duration,
          maxIntensity: currentSequence.maxIntensity,
          averageIntensity: currentSequence.averageIntensity
        });
      }
    }
  }

  // Filter out overlapping shots and ensure minimum time between shots
  return filterShotSequences(shotSequences);
}

/**
 * Classify a shot sequence based on movement patterns
 */
function classifyShotSequence(sequence) {
  if (!sequence.frames || sequence.frames.length === 0) {
    return { type: SHOT_TYPES.UNKNOWN, confidence: 0 };
  }

  let forehandScore = 0;
  let backhandScore = 0;
  let serveScore = 0;
  let totalFrames = sequence.frames.length;

  // Analyze each frame in the sequence
  sequence.frames.forEach(frame => {
    const movement = frame.movement;
    const features = frame.features;
    
    // Check for serve (upward motion, high position)
    if (movement.verticalMovement && movement.verticalMovement.isUpward) {
      const wristHeight = features.rightWrist.y;
      const shoulderHeight = features.rightShoulder.y;
      
      if (wristHeight < shoulderHeight && movement.verticalMovement.magnitude > 50) {
        serveScore += 2; // Strong serve indicator
      }
    }

    // Check for forehand (right arm dominant, horizontal motion)
    if (movement.rightArmMovement && movement.rightArmMovement.isHorizontal) {
      const rightArmSpeed = movement.rightArmMovement.wristSpeed;
      const leftArmSpeed = movement.leftArmMovement?.wristSpeed || 0;
      
      if (rightArmSpeed > leftArmSpeed * 1.5 && rightArmSpeed > 100) {
        forehandScore += 1.5; // Strong forehand indicator
      }
    }

    // Check for backhand (left arm dominant or two-handed)
    if (movement.leftArmMovement && movement.leftArmMovement.isHorizontal) {
      const leftArmSpeed = movement.leftArmMovement.wristSpeed;
      const rightArmSpeed = movement.rightArmMovement?.wristSpeed || 0;
      
      if (leftArmSpeed > rightArmSpeed * 1.2 && leftArmSpeed > 80) {
        backhandScore += 1.5; // Strong backhand indicator
      }
    }
  });

  // Calculate final scores
  const maxScore = Math.max(forehandScore, backhandScore, serveScore);
  let shotType = SHOT_TYPES.UNKNOWN;
  let confidence = 0;

  if (maxScore > 0) {
    if (serveScore === maxScore) {
      shotType = SHOT_TYPES.SERVE;
      confidence = Math.min(serveScore / (totalFrames * 2), 0.95);
    } else if (forehandScore === maxScore) {
      shotType = SHOT_TYPES.FOREHAND;
      confidence = Math.min(forehandScore / (totalFrames * 1.5), 0.95);
    } else if (backhandScore === maxScore) {
      shotType = SHOT_TYPES.BACKHAND;
      confidence = Math.min(backhandScore / (totalFrames * 1.5), 0.95);
    }
  }

  return {
    type: shotType,
    confidence: Math.max(confidence, 0.1),
    reasoning: generateShotReasoning(shotType, sequence)
  };
}

/**
 * Generate reasoning for shot classification
 */
function generateShotReasoning(shotType, sequence) {
  const reasoning = [];
  
  if (shotType === SHOT_TYPES.SERVE) {
    reasoning.push('Upward motion detected');
    reasoning.push('Wrist above shoulder level');
    reasoning.push(`High movement intensity: ${sequence.averageIntensity.toFixed(0)}`);
  } else if (shotType === SHOT_TYPES.FOREHAND) {
    reasoning.push('Right arm dominant movement');
    reasoning.push('Horizontal swing pattern');
    reasoning.push(`Movement intensity: ${sequence.averageIntensity.toFixed(0)}`);
  } else if (shotType === SHOT_TYPES.BACKHAND) {
    reasoning.push('Left arm dominant movement');
    reasoning.push('Horizontal swing pattern');
    reasoning.push(`Movement intensity: ${sequence.averageIntensity.toFixed(0)}`);
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