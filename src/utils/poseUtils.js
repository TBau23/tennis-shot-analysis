import { POSE_KEYPOINTS, POSE_COLORS, POSE_CONFIDENCE_THRESHOLD } from '../constants/poseConstants.js';

// Skeleton connections for MoveNet
export const SKELETON_CONNECTIONS = [
  [POSE_KEYPOINTS.LEFT_SHOULDER, POSE_KEYPOINTS.RIGHT_SHOULDER],
  [POSE_KEYPOINTS.LEFT_SHOULDER, POSE_KEYPOINTS.LEFT_ELBOW],
  [POSE_KEYPOINTS.LEFT_ELBOW, POSE_KEYPOINTS.LEFT_WRIST],
  [POSE_KEYPOINTS.RIGHT_SHOULDER, POSE_KEYPOINTS.RIGHT_ELBOW],
  [POSE_KEYPOINTS.RIGHT_ELBOW, POSE_KEYPOINTS.RIGHT_WRIST],
  [POSE_KEYPOINTS.LEFT_SHOULDER, POSE_KEYPOINTS.LEFT_HIP],
  [POSE_KEYPOINTS.RIGHT_SHOULDER, POSE_KEYPOINTS.RIGHT_HIP],
  [POSE_KEYPOINTS.LEFT_HIP, POSE_KEYPOINTS.RIGHT_HIP],
  [POSE_KEYPOINTS.LEFT_HIP, POSE_KEYPOINTS.LEFT_KNEE],
  [POSE_KEYPOINTS.LEFT_KNEE, POSE_KEYPOINTS.LEFT_ANKLE],
  [POSE_KEYPOINTS.RIGHT_HIP, POSE_KEYPOINTS.RIGHT_KNEE],
  [POSE_KEYPOINTS.RIGHT_KNEE, POSE_KEYPOINTS.RIGHT_ANKLE],
];

// Draw pose keypoints on canvas
export function drawKeypoints(ctx, pose, videoWidth, videoHeight) {
  if (!pose || !pose.keypoints) return;

  pose.keypoints.forEach((keypoint) => {
    if (keypoint.score > POSE_CONFIDENCE_THRESHOLD) {
      const { x, y } = keypoint;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = POSE_COLORS.keypoints;
      ctx.fill();
    }
  });
}

// Draw skeleton connections on canvas
export function drawSkeleton(ctx, pose, videoWidth, videoHeight) {
  if (!pose || !pose.keypoints) return;

  SKELETON_CONNECTIONS.forEach(([startIndex, endIndex]) => {
    const startKeypoint = pose.keypoints[startIndex];
    const endKeypoint = pose.keypoints[endIndex];

    if (
      startKeypoint.score > POSE_CONFIDENCE_THRESHOLD &&
      endKeypoint.score > POSE_CONFIDENCE_THRESHOLD
    ) {
      ctx.beginPath();
      ctx.moveTo(startKeypoint.x, startKeypoint.y);
      ctx.lineTo(endKeypoint.x, endKeypoint.y);
      ctx.strokeStyle = POSE_COLORS.skeleton;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

// Get confidence color based on score
export function getConfidenceColor(score) {
  if (score > 0.7) return POSE_COLORS.confidence.high;
  if (score > 0.4) return POSE_COLORS.confidence.medium;
  return POSE_COLORS.confidence.low;
}

// Calculate distance between two keypoints
export function calculateDistance(keypoint1, keypoint2) {
  if (!keypoint1 || !keypoint2) return 0;
  
  const dx = keypoint1.x - keypoint2.x;
  const dy = keypoint1.y - keypoint2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Get wrist positions for shot analysis
export function getWristPositions(pose) {
  if (!pose || !pose.keypoints) return null;

  const leftWrist = pose.keypoints[POSE_KEYPOINTS.LEFT_WRIST];
  const rightWrist = pose.keypoints[POSE_KEYPOINTS.RIGHT_WRIST];

  return {
    leftWrist: leftWrist.score > POSE_CONFIDENCE_THRESHOLD ? leftWrist : null,
    rightWrist: rightWrist.score > POSE_CONFIDENCE_THRESHOLD ? rightWrist : null,
  };
} 