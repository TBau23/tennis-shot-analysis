import { useState, useEffect } from 'react';
import tensorflowService from '../services/tensorflowService.js';

export function useTensorFlow() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeTensorFlow();
  }, []);

  const initializeTensorFlow = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await tensorflowService.initialize();
      
      if (success) {
        setIsInitialized(true);
      } else {
        setError('Failed to initialize TensorFlow');
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize TensorFlow');
    } finally {
      setIsLoading(false);
    }
  };

  const detectPose = async (videoElement) => {
    if (!isInitialized) {
      throw new Error('TensorFlow not initialized');
    }
    
    return await tensorflowService.detectPose(videoElement);
  };

  return {
    isInitialized,
    isLoading,
    error,
    detectPose,
    reinitialize: initializeTensorFlow
  };
} 