# Privacy Screen - Technical Specification

## 1. Project Overview

**Project Name:** PrivacyScreen

**Core Functionality:** An intelligent privacy screen application that uses the front-facing camera for gaze detection combined with motion sensor fusion (accelerometer/gyroscope) to determine when the intended user is looking at the screen. When the user is not looking or the device is in an atypical viewing orientation, a privacy filter is applied (dimming + overlay pattern) to make the screen unreadable from side angles.

---

## 2. Technology Stack & Choices

### Framework & Language
- **Framework:** React Native with Expo SDK 52
- **Language:** TypeScript
- **Minimum Android API:** 24 (Android 7.0)
- **Minimum iOS:** 13.0

### Key Libraries/Dependencies
- `expo-camera`: Front camera access for face/gaze detection
- `expo-sensors`: Accelerometer and gyroscope for orientation detection
- `expo-face-detector`: ML Kit-based face detection (via Expo)
- `expo-screen-orientation`: Screen orientation handling
- `expo-status-bar`: Status bar control for dimming
- `react-native-reanimated`: Smooth animations for overlay transitions

### State Management
- React Context API with useReducer for global privacy state
- Custom hooks for sensor and camera management

### Architecture Pattern
- **Clean Architecture** with separation of concerns:
  - **Presentation Layer:** React components, screens, hooks
  - **Domain Layer:** Business logic, privacy decision engine
  - **Data Layer:** Sensor managers, camera controllers

---

## 3. Feature List

### Core Features
1. **Front Camera Face Detection**
   - Real-time face detection using front camera
   - Head pose estimation (yaw, pitch)
   - Eye openness detection
   - Multiple face detection (triggers privacy if >1 face)

2. **Motion Sensor Fusion**
   - Accelerometer-based gravity vector detection
   - Gyroscope angular velocity tracking
   - Device orientation calculation (pitch, roll)
   - Viewport orientation threshold detection

3. **Privacy Filter System**
   - Dim overlay (semi-transparent black, alpha 0.85)
   - High-contrast pattern overlay (diagonal lines)
   - Smooth fade transitions (200ms)
   - Brightness reduction support

4. **Fused Decision Engine**
   - Combined gaze + orientation logic
   - Configurable thresholds (yaw < 15°, pitch ±20°, roll ±15°)
   - Hysteresis timing (500ms delay before filter activation)
   - Quick rotation detection via gyroscope

5. **Power Optimization**
   - Adaptive camera frame rate (10 fps normal, 2-5 fps low power)
   - Camera pause when orientation indicates no viewing
   - Background sensor processing

6. **Settings & Configuration**
   - Enable/disable privacy screen
   - Filter intensity adjustment
   - Orientation-only mode (camera disabled)
   - Sensitivity calibration

### Edge Case Handling
- Low light fallback to orientation-only mode
- Sunglasses/glasses compatibility mode
- Rapid rotation handling
- Phone flat on table detection
- Permission denied graceful handling

---

## 4. UI/UX Design Direction

### Overall Visual Style
- **Dark theme** with privacy-focused aesthetics
- Minimalist interface that doesn't distract from the main content
- System overlay approach for full-screen privacy protection

### Color Scheme
- Primary: Deep Blue (#1a237e)
- Secondary: Cyan Accent (#00bcd4)
- Overlay: Dark black with pattern (#000000, 85% opacity)
- Status indicators: Green (protected) / Amber (unprotected)

### Layout Approach
- **Settings Screen:** Single scrollable page with toggle switches and sliders
- **Privacy Overlay:** Full-screen system overlay (covers entire screen including status bar)
- **Status Indicator:** Subtle floating badge showing protection status

### Key UI Components
1. **Main Toggle:** Large ON/OFF switch for privacy protection
2. **Status Badge:** Floating pill showing "Protected" / "Unprotected"
3. **Sensitivity Sliders:** Adjustable thresholds for gaze and orientation
4. **Mode Selector:** Camera + Orientation / Orientation Only
5. **Debug View:** Optional overlay showing face detection visualization

---

## 5. Technical Implementation Details

### Gaze Detection Thresholds
- Head yaw: ±15° (left/right)
- Head pitch: ±20° (up/down)  
- Eye openness: > 0.5 probability
- Multiple faces: Immediate privacy trigger

### Orientation Thresholds
- Pitch: -30° to +30° (tilt forward/back)
- Roll: -15° to +15° (tilt sideways)
- Outside range: Privacy enabled regardless of gaze

### Filter Application Logic
```
if (orientation.isViewingOrientation) {
  if (face.isLooking && face.eyesOpen > 0.5 && !face.multipleFaces) {
    disablePrivacyFilter()
  } else {
    enablePrivacyFilter()
  }
} else {
  enablePrivacyFilter()
}
```

### Animation Specs
- Filter fade in: 200ms ease-out
- Filter fade out: 150ms ease-in
- Status badge update: 100ms

---

## 6. Permissions Required

- `CAMERA` - Front camera for face detection
- `SENSORS` - Accelerometer and gyroscope access
- `SYSTEM_ALERT_WINDOW` - For overlay on Android

