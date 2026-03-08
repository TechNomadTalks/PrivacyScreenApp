/**
 * Privacy Screen Application - Type Definitions
 */

export interface DeviceOrientation {
  pitch: number;
  roll: number;
  yaw?: number;
}

export interface FaceDetectionResult {
  isDetected: boolean;
  faceCount: number;
  yaw: number;
  pitch: number;
  leftEyeOpen: number;
  rightEyeOpen: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PrivacyThresholds {
  yawThreshold: number;
  pitchThresholdMin: number;
  pitchThresholdMax: number;
  rollThreshold: number;
  pitchThresholdViewingMin: number;
  pitchThresholdViewingMax: number;
  eyeOpenThreshold: number;
}

export interface CalibrationProfile {
  id: string;
  name: string;
  pitchMin: number;
  pitchMax: number;
  rollMin: number;
  rollMax: number;
  pitchCenter: number;
  rollCenter: number;
}

export interface CalibrationData {
  profiles: CalibrationProfile[];
  isCalibrated: boolean;
  activeProfileId: string | null;
}

export interface PrivacySettings {
  enabled: boolean;
  filterIntensity: number;
  enablePattern: boolean;
  hysteresisDelay: number;
  hysteresisDisableDelay: number;
  yawThreshold: number;
  pitchThresholdMin: number;
  pitchThresholdMax: number;
  rollThreshold: number;
  pitchThresholdViewingMin: number;
  pitchThresholdViewingMax: number;
  eyeOpenThreshold: number;
  persistSettings: boolean;
  calibration: CalibrationData;
}

export interface PrivacyState {
  isProtected: boolean;
  isUserLooking: boolean;
  isViewingOrientation: boolean;
  faceDetected: boolean;
  multipleFacesDetected: boolean;
  orientation: DeviceOrientation;
  cameraActive: boolean;
  protectionLevel: number; // 0 = fully visible, 1 = fully protected
}

export type PrivacyAction =
  | { type: 'SET_LOOKING'; payload: boolean }
  | { type: 'SET_ORIENTATION'; payload: DeviceOrientation }
  | { type: 'SET_VIEWING_ORIENTATION'; payload: boolean }
  | { type: 'SET_FACE_DETECTED'; payload: boolean }
  | { type: 'SET_MULTIPLE_FACES'; payload: boolean }
  | { type: 'SET_PROTECTED'; payload: boolean }
  | { type: 'SET_CAMERA_ACTIVE'; payload: boolean }
  | { type: 'SET_PROTECTION_LEVEL'; payload: number }
  | { type: 'UPDATE_STATE'; payload: Partial<PrivacyState> };

export const DEFAULT_CALIBRATION: CalibrationData = {
  profiles: [],
  isCalibrated: false,
  activeProfileId: null,
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  enabled: true,
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
  calibration: DEFAULT_CALIBRATION,
};
