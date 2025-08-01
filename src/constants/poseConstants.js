// MoveNet keypoint indices
export const POSE_KEYPOINTS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
};

// Keypoint names for easier reference
export const KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
];

// Shot types
export const SHOT_TYPES = {
  FOREHAND: 'forehand',
  BACKHAND: 'backhand',
  SERVE: 'serve',
  UNKNOWN: 'unknown'
};

// Shot type display names
export const SHOT_TYPE_LABELS = {
  [SHOT_TYPES.FOREHAND]: 'Forehand',
  [SHOT_TYPES.BACKHAND]: 'Backhand',
  [SHOT_TYPES.SERVE]: 'Serve',
  [SHOT_TYPES.UNKNOWN]: 'Unknown'
};

// Pose confidence threshold
export const POSE_CONFIDENCE_THRESHOLD = 0.3;

// Colors for visualization
export const POSE_COLORS = {
  keypoints: '#00ff00',
  skeleton: '#ff0000',
  confidence: {
    high: '#00ff00',
    medium: '#ffff00',
    low: '#ff0000'
  }
}; 