import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

class TensorFlowService {
  constructor() {
    this.detector = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Set backend to WebGL for better performance
      await tf.setBackend('webgl');
      
      // Initialize MoveNet model
      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      };
      
      this.detector = await poseDetection.createDetector(model, detectorConfig);
      this.isInitialized = true;
      
      console.log('TensorFlow and MoveNet initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize TensorFlow:', error);
      return false;
    }
  }

  async detectPose(videoElement) {
    if (!this.isInitialized || !this.detector) {
      throw new Error('TensorFlow not initialized');
    }

    try {
      const poses = await this.detector.estimatePoses(videoElement);
      return poses;
    } catch (error) {
      console.error('Pose detection failed:', error);
      return [];
    }
  }

  isReady() {
    return this.isInitialized && this.detector !== null;
  }
}

// Export singleton instance
export const tensorflowService = new TensorFlowService();
export default tensorflowService; 