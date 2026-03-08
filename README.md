# Privacy Screen

A React Native (Expo) application that automatically protects your screen content from prying eyes using device orientation sensors. When you tilt your phone away from your viewing position, the screen dims with a privacy overlay.

## Features

- **Automatic Detection**: Uses device gyroscope and accelerometer to detect when the phone is tilted away from your viewing position
- **Privacy Overlay**: Dims the screen with a configurable dark overlay and optional diagonal pattern
- **Orientation-Only Mode**: Works entirely offline using motion sensors (no camera required)
- **Hysteresis Control**: Configurable delays to prevent flickering between protected/unprotected states
- **Customizable Settings**:
  - Filter intensity (opacity level)
  - Pattern overlay toggle
  - Response delay (hysteresis)
  - Orientation thresholds
  - Persistent settings between sessions

## Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Usage

1. Launch the app
2. Enable Privacy in the settings
3. Hold your phone in your normal viewing position to "teach" the app your orientation
4. Tilt the phone away (sideways, forward, or backward) to see the privacy overlay activate
5. Adjust settings as needed:
   - **Filter Intensity**: Controls overlay opacity (50-100%)
   - **Response Delay**: Time before filter activates (100-2000ms)
   - **Pattern Overlay**: Adds diagonal lines for extra privacy

## Technical Architecture

### Core Components

| Component | Purpose |
|-----------|---------|
| `App.tsx` | Main application entry, ErrorBoundary wrapper |
| `PrivacyContext` | Global state management for privacy settings |
| `PrivacyOverlay` | Full-screen overlay component |
| `SensorService` | Handles device orientation sensors |
| `SettingsStorage` | Persists settings to AsyncStorage |

### Detection Logic

The app uses device orientation sensors (gyroscope/accelerometer) to determine if the phone is in a "viewing orientation":

- **Pitch** (forward/back tilt): Must be within configurable threshold (default: -30° to +30°)
- **Roll** (side tilt): Must be within configurable threshold (default: ±15°)
- **Yaw** (rotation): Not used in orientation-only mode

When the device leaves the viewing orientation for longer than the hysteresis delay, the privacy overlay activates.

### State Flow

```
Device Orientation → SensorService → PrivacyContext → PrivacyOverlay
                                        ↓
                                   Settings
```

## Permissions Required

### iOS
- `NSMotionUsageDescription`: Motion sensor access for orientation detection

### Android
- `HIGH_SAMPLING_RATE_SENSORS`: For accurate sensor readings

## Security Notes

- **No Camera Required**: This app operates in orientation-only mode, requiring no camera permissions
- **Offline Operation**: All detection happens locally on-device using sensors
- **No Data Transmission**: Settings are stored locally only; no network requests are made
- **Minimal Permissions**: Only requests motion sensor access, nothing else

## Supported Platforms

- iOS 13.0+
- Android API 24+ (Android 7.0+)

## License

Private - All rights reserved
