/**
 * Privacy Context - Global state management for privacy screen
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useMemo } from "react";
import { 
  PrivacyState, 
  PrivacyAction, 
  PrivacySettings, 
  DeviceOrientation,
  FaceDetectionResult,
  DEFAULT_PRIVACY_SETTINGS,
  PrivacyThresholds,
  DEFAULT_ORIENTATION_THRESHOLDS
} from "../types";
import { SensorServiceClass } from "../services/SensorService";

interface PrivacyContextType {
  state: PrivacyState;
  settings: PrivacySettings;
  thresholds: PrivacyThresholds;
  updateOrientation: (orientation: DeviceOrientation) => void;
  updateFaceDetection: (result: FaceDetectionResult) => void;
  updateSettings: (settings: Partial<PrivacySettings>) => void;
  togglePrivacy: () => void;
}

const initialState: PrivacyState = {
  isProtected: false,
  isUserLooking: false,
  isViewingOrientation: true,
  faceDetected: false,
  multipleFacesDetected: false,
  orientation: { pitch: 0, roll: 0, yaw: 0 },
  cameraActive: false,
};

function privacyReducer(state: PrivacyState, action: PrivacyAction): PrivacyState {
  switch (action.type) {
    case "SET_LOOKING":
      return { ...state, isUserLooking: action.payload };
    case "SET_ORIENTATION":
      return { ...state, orientation: action.payload };
    case "SET_VIEWING_ORIENTATION":
      return { ...state, isViewingOrientation: action.payload };
    case "SET_FACE_DETECTED":
      return { ...state, faceDetected: action.payload };
    case "SET_MULTIPLE_FACES":
      return { ...state, multipleFacesDetected: action.payload };
    case "SET_PROTECTED":
      return { ...state, isProtected: action.payload };
    case "SET_CAMERA_ACTIVE":
      return { ...state, cameraActive: action.payload };
    case "UPDATE_STATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

interface PrivacyProviderProps {
  children: React.ReactNode;
  onPrivacyChange?: (isProtected: boolean) => void;
}

export function PrivacyProvider({ children, onPrivacyChange }: PrivacyProviderProps) {
  const [state, dispatch] = useReducer(privacyReducer, initialState);
  const [settings, setSettings] = React.useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  
  // Use constants instead of state for thresholds (they never change)
  const thresholds: PrivacyThresholds = useMemo(() => DEFAULT_ORIENTATION_THRESHOLDS, []);
  
  const isProtectedRef = useRef(false);
  const lastPrivacyEnableTime = useRef<number>(0);
  const lastPrivacyDisableTime = useRef<number>(0);
  
  // Memoize the callback to prevent unnecessary re-renders
  const handlePrivacyChange = useCallback((isProtected: boolean) => {
    onPrivacyChange?.(isProtected);
  }, [onPrivacyChange]);

  const processPrivacyDecision = useCallback(() => {
    if (!settings.enabled) {
      if (isProtectedRef.current) {
        dispatch({ type: "SET_PROTECTED", payload: false });
        isProtectedRef.current = false;
        handlePrivacyChange(false);
      }
      return;
    }

    let shouldBeProtected = false;

    const viewingOrientation = SensorServiceClass.isViewingOrientation(state.orientation, thresholds);

    if (!viewingOrientation) {
      shouldBeProtected = true;
    } else {
      shouldBeProtected = false;
    }

    const now = Date.now();
    const hysteresisDelay = settings.hysteresisDelay;

    if (shouldBeProtected && !isProtectedRef.current) {
      if (now - lastPrivacyDisableTime.current > hysteresisDelay) {
        lastPrivacyEnableTime.current = now;
        isProtectedRef.current = true;
        dispatch({ type: "SET_PROTECTED", payload: true });
        handlePrivacyChange(true);
      }
    } else if (!shouldBeProtected && isProtectedRef.current) {
      if (now - lastPrivacyEnableTime.current > 150) {
        lastPrivacyDisableTime.current = now;
        isProtectedRef.current = false;
        dispatch({ type: "SET_PROTECTED", payload: false });
        handlePrivacyChange(false);
      }
    }
  }, [settings, state.orientation, thresholds, handlePrivacyChange]);

  const updateOrientation = useCallback((orientation: DeviceOrientation) => {
    dispatch({ type: "SET_ORIENTATION", payload: orientation });
    dispatch({ 
      type: "SET_VIEWING_ORIENTATION", 
      payload: SensorServiceClass.isViewingOrientation(orientation, thresholds) 
    });
  }, [thresholds]);

  const updateFaceDetection = useCallback((result: FaceDetectionResult) => {
    dispatch({ type: "SET_FACE_DETECTED", payload: result.isDetected });
    dispatch({ type: "SET_MULTIPLE_FACES", payload: result.faceCount > 1 });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<PrivacySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const togglePrivacy = useCallback(() => {
    updateSettings({ enabled: !settings.enabled });
  }, [settings.enabled, updateSettings]);

  useEffect(() => {
    processPrivacyDecision();
  }, [processPrivacyDecision]);

  const value = useMemo<PrivacyContextType>(() => ({
    state,
    settings,
    thresholds,
    updateOrientation,
    updateFaceDetection,
    updateSettings,
    togglePrivacy,
  }), [state, settings, thresholds, updateOrientation, updateFaceDetection, updateSettings, togglePrivacy]);

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy(): PrivacyContextType {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error("usePrivacy must be used within a PrivacyProvider");
  }
  return context;
}

export default PrivacyContext;
