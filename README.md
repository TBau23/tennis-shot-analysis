# Tennis Shot Classifier

A React app that allows users to upload videos of themselves playing tennis. The app uses TensorFlow MoveNet to overlay joint positioning and classify the movement as backhand, forehand, or serve.

## Features
- Video upload and playback
- MoveNet joint detection overlay
- Tennis shot classification (backhand, forehand, serve)
- Real-time pose tracking

## Tech Stack
- React 19
- TensorFlow.js
- MoveNet (pre-trained model)
- Vite (build tool)

## Task Breakdown

### Phase 1: Project Setup & Dependencies
git- [x] Install TensorFlow.js and MoveNet dependencies
- [x] Set up project structure and component organization
- [x] Configure build tools for TensorFlow.js integration
- [x] Create basic app layout and routing

### Phase 2: Video Upload & Playback
- [x] Create video upload component with drag-and-drop
- [x] Implement video player with controls (play, pause, seek)
- [x] Add video file validation (format, size limits)
- [x] Create video preview component
- [x] Handle video loading states and error handling

### Phase 3: MoveNet Integration
- [ ] Load and initialize MoveNet model
- [ ] Create pose detection service/utility
- [ ] Implement frame-by-frame pose detection
- [ ] Add pose data visualization helpers
- [ ] Optimize performance for real-time processing

### Phase 4: Joint Overlay Visualization
- [ ] Create canvas overlay component for pose drawing
- [ ] Implement joint point rendering (circles/dots)
- [ ] Add skeleton line connections between joints
- [ ] Create smooth pose tracking animation
- [ ] Add pose confidence indicators

### Phase 5: Shot Classification
- [ ] Design shot classification algorithm
- [ ] Create training data structure for shot types
- [ ] Implement shot detection logic (motion analysis)
- [ ] Add shot type indicators and labels
- [ ] Create shot classification confidence scoring

### Phase 6: UI/UX Enhancement
- [ ] Design modern, responsive UI
- [ ] Add loading states and progress indicators
- [ ] Implement error handling and user feedback
- [ ] Create settings panel for model parameters
- [ ] Add shot history and analysis features

### Phase 7: Performance & Polish
- [ ] Optimize video processing performance
- [ ] Add model caching and preloading
- [ ] Implement responsive design for mobile
- [ ] Add keyboard shortcuts and accessibility
- [ ] Create comprehensive error handling

### Phase 8: Testing & Deployment
- [ ] Write unit tests for core components
- [ ] Add integration tests for video processing
- [ ] Test with various video formats and qualities
- [ ] Deploy to production environment
- [ ] Create user documentation and tutorials

## Getting Started

```bash
npm install
npm run dev
```

## Development Notes
- MoveNet model will be loaded from TensorFlow.js model hub
- Video processing will be done client-side for privacy
- Shot classification will use pose data patterns and motion analysis