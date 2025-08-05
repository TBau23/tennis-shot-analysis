# Tennis Shot Classifier

A React app that allows users to upload videos of themselves playing tennis. The app uses TensorFlow MoveNet to overlay joint positioning and classify the movement as backhand, forehand, or serve. More features in the works.

## Features
- Video upload and playback
- MoveNet joint detection overlay
- Tennis shot classification (backhand, forehand, serve)
- Real-time pose tracking
- Shot analysis and statistics
- Smooth skeleton visualization

## Tech Stack
- React 19
- TensorFlow.js
- MoveNet (pre-trained model)
- Vite (build tool)

## Task Breakdown

### Phase 1: Project Setup & Dependencies
- [x] Install TensorFlow.js and MoveNet dependencies
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
- [x] Load and initialize MoveNet model
- [x] Create pose detection service/utility
- [x] Implement frame-by-frame pose detection
- [x] Add pose data visualization helpers
- [x] Optimize performance for real-time processing

### Phase 4: Joint Overlay Visualization
- [x] Create canvas overlay component for pose drawing
- [x] Implement joint point rendering (circles/dots)
- [x] Add skeleton line connections between joints
- [x] Create smooth pose tracking animation
- [x] Add pose confidence indicators

### Phase 5: Shot Classification
- [x] Design shot classification algorithm
- [x] Create training data structure for shot types
- [x] Implement shot detection logic (motion analysis)
- [x] Add shot type indicators and labels
- [x] Create shot classification confidence scoring

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
- Shot classification uses pose data patterns and motion analysis
- Analysis samples every 0.1 seconds for smooth tracking
- Shot detection uses rule-based classification with confidence scoring