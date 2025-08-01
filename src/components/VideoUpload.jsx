import React, { useState, useRef, useCallback } from 'react';
import './VideoUpload.css';

function VideoUpload({ onVideoSelect }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const maxSize = 100 * 1024 * 1024; // 100MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Please select a valid video file (MP4, WebM, OGG, or MOV)');
    }

    if (file.size > maxSize) {
      throw new Error('File size must be less than 100MB');
    }

    return true;
  };

  const handleFileSelect = useCallback((file) => {
    try {
      setError(null);
      setIsUploading(true);
      
      validateFile(file);
      
      // Create video URL for preview
      const videoUrl = URL.createObjectURL(file);
      
      // Call parent callback with file and URL
      onVideoSelect(file, videoUrl);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }, [onVideoSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="video-upload-container">
      <div
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        <div className="upload-content">
          <div className="upload-icon">
            {isUploading ? '⏳' : '🎬'}
          </div>
          
          <h3 className="upload-title">
            {isUploading ? 'Processing Video...' : 'Upload Tennis Video'}
          </h3>
          
          <p className="upload-description">
            {isUploading 
              ? 'Please wait while we prepare your video for analysis'
              : 'Drag and drop your video here, or click to browse'
            }
          </p>
          
          {!isUploading && (
            <div className="upload-requirements">
              <p>Supported formats: MP4, WebM, OGG, MOV</p>
              <p>Maximum size: 100MB</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="upload-error">
          <span className="error-icon">❌</span>
          <span className="error-message">{error}</span>
        </div>
      )}
    </div>
  );
}

export default VideoUpload; 