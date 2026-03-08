/**
 * Privacy Screen Application - Type Definitions
 */

export interface DeviceOrientation {
  pitch: number; // Rotation around X-axis (tilt forward/back) in degrees
  roll: number;  // Rotation around Z-axis (tilt sideways) in degrees
  yaw?: number;   // Rotation around Y-axis (rotation left/right) in degrees
}

export interface FaceDetectionResult {
  isDetected: boolean;
  faceCount: number;
  yaw: number;      // Head yaw angle in degrees
  pitch: number;   // Head pitch angle in degrees
  leftEyeOpen: number; // Probability 0-1
  rightEyeOpen: number; // Probability 0-1
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PrivacyThresholds {
  yawThreshold: number;      // Max yaw angle to be considered "looking" (default: 15°)
  pitchThresholdMin: number; // Min pitch angle (default: -20°)
  pitchThresholdMax: number; // Max pitch angle (default: 20°)
  rollThreshold: number;     // Max roll angle for viewing orientation (default: 15°)
  pitchThresholdViewingMin: number; // Min pitch for viewing orientation (default: -30°)
  pitchThresholdViewingMax: number; // Max pitch for viewing orientation (default: 30°)
  eyeOpenThreshold: number;  // Min eye openness probability (default: 0.5)
}

export interface PrivacySettings {
  enabled: boolean;
  useCamera: boolean;        // Use camera + orientation (true) or orientation only (false)
  filterIntensity: number;   // 0-1, overlay opacity
  enablePattern: boolean;    // Show diagonal pattern overlay
  hysteresisDelay: number;   // Delay before enabling filter (ms) - for enable
  hysteresisDisableDelay: number; // Delay before disabling filter (ms) - for disable
  yawThreshold: number;
  pitchThresholdMin: number;
  pitchThresholdMax: number;
  rollThreshold: number;
  pitchThresholdViewingMin: number;
  pitchThresholdViewingMax: number;
  eyeOpenThreshold: number;
  persistSettings: boolean;  // Whether to persist settings to storage
}

export interface PrivacyState {
  isProtected: boolean;       // Current privacy state
  isUserLooking: boolean;     // Based on gaze detection
  isViewingOrientation: boolean; // Based on device orientation
  faceDetected: boolean;
  multipleFacesDetected: boolean;
  orientation: DeviceOrientation;
  cameraActive: boolean;
}

export type PrivacyAction =
  | { type: 'SET_LOOKING'; payload: boolean }
  | { type: 'SET_ORIENTATION'; payload: DeviceOrientation }
  | { type: 'SET_VIEWING_ORIENTATION'; payload: boolean }
  | { type: 'SET_FACE_DETECTED'; payload: boolean }
  | { type: 'SET_MULTIPLE_FACES'; payload: boolean }
  | { type: 'SET_PROTECTED'; payload: boolean }
  | { type: 'SET_CAMERA_ACTIVE'; payload: boolean }
  | { type: 'UPDATE_STATE'; payload: Partial<PrivacyState> };

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  enabled: true,
  useCamera: true,
  filterIntensity: 0.85,
  enablePattern: true,
  hysteresisDelay: 500,
  hysteresisDisableDelay: 150,
  yawThreshold: 15,
  pitchThresholdMin: -20,
  pitchThresholdMax: 20,
  rollThreshold: 15,
  pitchThresholdViewingMin: -30,
  pitchThresholdViewingMax: 30,
  eyeOpenThreshold: 0.5,
  persistSettings: false,
};

export const DEFAULT_ORIENTATION_THRESHOLDS: PrivacyThresholds = {
  yawThreshold: 15,
  pitchThresholdMin: -20,
  pitchThresholdMax: 20,
  rollThreshold: 15,
  pitchThresholdViewingMin: -30,
  pitchThresholdViewingMax: 30,
  eyeOpenThreshold: 0.5,
};
