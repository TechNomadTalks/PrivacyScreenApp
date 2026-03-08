# Privacy Screen

A React Native (Expo) application that automatically protects your screen content from prying eyes using device orientation sensors AND front camera face detection. When you tilt your phone away OR someone else looks at your screen, the screen dims with a privacy overlay.

## Features

### Core Detection
- **Orientation Detection**: Uses device gyroscope/accelerometer to detect viewing position
- **Face Detection**: Uses front camera to identify if the user is looking at the phone
- **Multi-Face Detection**: Detects if someone else is looking (multiple faces = privacy triggered)
- **User Identification**: Enroll your face to distinguish yourself from others

### Privacy Protection
- **Automatic Protection**: Screen dims when phone tilted away from viewing position
- **Stranger Detection**: Triggers protection when unrecognized face detected
- **Face Enrollment**: Optional enrollment of your face for personalized identification
- **Configurable Sensitivity**: Adjustable thresholds for orientation and face similarity

### Settings
- Filter intensity (opacity level)
- Pattern overlay toggle
- Response delay (hysteresis)
- Orientation thresholds
- Face detection toggle
- Face enrollment management
- Persistent settings between sessions

## Installation

```bash
# Install dependencies
npm install

# Generate native Android project
npx expo prebuild --platform android

# Build debug APK
cd android && ./gradlew assembleDebug
```

## Usage

### First Launch
1. Launch the app
2. Complete orientation calibration (hold phone in your viewing positions)
3. Optionally enroll your face for enhanced security

### Normal Usage
1. Enable Privacy in the settings
2. **Orientation mode**: Tilt phone away to activate privacy
3. **Face detection mode**: 
   - Enroll your face in Settings
   - App detects if YOU are looking or someone else
   - Triggers protection for strangers or multiple faces

### Face Enrollment
1. Go to Settings
2. Tap "Enroll My Face"
3. Position your face in the frame
4. Tap "Enroll My Face" button
5. Your face template is stored locally (not images!)

## Detection Logic

### Protection Triggers (ANY of these)
```
protection = orientation_tilted_away 
          OR multiple_faces_detected 
          OR (face_detection_enabled AND NOT_same_person)
```

### Orientation Detection
- **Pitch** (forward/back): Must be within threshold (default: ±30°)
- **Roll** (side tilt): Must be within threshold (default: ±15°)

### Face Detection
- Compares detected face against enrolled template
- Uses similarity threshold (default: 65%)
- Multiple faces always triggers protection

## Technical Architecture

### Core Components

| Component | Purpose |
|-----------|---------|
| `App.tsx` | Main application entry, ErrorBoundary wrapper |
| `PrivacyContext` | Global state management for privacy settings |
| `PrivacyOverlay` | Full-screen overlay component |
| `SensorService` | Handles device orientation sensors |
| `PrivacyCamera` | Hidden camera for face detection |
| `FaceEnrollmentService` | Face template storage & comparison |
| `FaceEnrollmentScreen` | UI for enrolling user face |
| `SettingsStorage` | Persists settings to AsyncStorage |

### Face Template System
- Extracts facial landmarks and ratios (NOT images)
- Stores numerical templates only
- Compares using: landmark positions, feature ratios, eye openness
- All processing on-device - NO network requests

## Permissions Required

### iOS
- `NSMotionUsageDescription`: Motion sensor access
- `NSCameraUsageDescription`: Front camera for face detection

### Android
- `HIGH_SAMPLING_RATE_SENSORS`: For accurate sensor readings
- `CAMERA`: Front camera for face detection

## Security & Privacy

### What We DON'T Do
- ❌ Upload face data to any server
- ❌ Store actual photos/images
- ❌ Require internet connection
- ❌ Track your usage

### What We DO
- ✅ All processing on-device
- ✅ Only face templates stored (numerical data)
- ✅ User can clear enrollment anytime
- ✅ Transparent about data storage
- ✅ Camera only activates when protection enabled

## Supported Platforms

- iOS 13.0+
- Android API 24+ (Android 7.0+)

## Build

```bash
# Android debug APK
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

## License

Private - All rights reserved
