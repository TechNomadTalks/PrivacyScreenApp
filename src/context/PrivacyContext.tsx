/**
 * Privacy Context - Global state management for privacy screen
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useMemo } from "react";
import { AppState, AppStateStatus } from "react-native";
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
import { SensorServiceClass, createSensorService } from "../services/SensorService";
import SettingsStorage from "../services/SettingsStorage";

interface PrivacyContextType {
  state: PrivacyState;
  settings: PrivacySettings;
  thresholds: PrivacyThresholds;
  updateOrientation: (orientation: DeviceOrientation) => void;
  updateFaceDetection: (result: FaceDetectionResult) => void;
  updateSettings: (settings: Partial<PrivacySettings> | ((prev: PrivacySettings) => Partial<PrivacySettings>)) => void;
  togglePrivacy: () => void;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = React.useState(true);
  
  // Use constants instead of state for thresholds (they never change)
  const thresholds: PrivacyThresholds = useMemo(() => DEFAULT_ORIENTATION_THRESHOLDS, []);
  
  const isProtectedRef = useRef(false);
  const lastPrivacyEnableTime = useRef<number>(0);
  const lastPrivacyDisableTime = useRef<number>(0);
  
  // Create our own sensor service instance
  const sensorService = useMemo(() => createSensorService(), []);
  
  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await SettingsStorage.loadSettings();
        setSettings(savedSettings);
      } catch (error) {
        console.error('[PrivacyContext] Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Persist settings when they change (if enabled)
  useEffect(() => {
    if (!isLoading && settings.persistSettings) {
      SettingsStorage.saveSettings(settings).catch(error => {
        console.error('[PrivacyContext] Failed to save settings:', error);
      });
    }
  }, [settings, isLoading]);

  // Handle app state changes - reset sensor service when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[PrivacyContext] App came to foreground, resetting sensor service');
        sensorService.reset();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      sensorService.stopListening();
    };
  }, [sensorService]);

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
    const hysteresisEnableDelay = settings.hysteresisDelay;
    const hysteresisDisableDelay = settings.hysteresisDisableDelay;

    if (shouldBeProtected && !isProtectedRef.current) {
      if (now - lastPrivacyDisableTime.current > hysteresisEnableDelay) {
        lastPrivacyEnableTime.current = now;
        isProtectedRef.current = true;
        dispatch({ type: "SET_PROTECTED", payload: true });
        handlePrivacyChange(true);
      }
    } else if (!shouldBeProtected && isProtectedRef.current) {
      if (now - lastPrivacyEnableTime.current > hysteresisDisableDelay) {
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

  const updateSettings = useCallback((newSettings: Partial<PrivacySettings> | ((prev: PrivacySettings) => Partial<PrivacySettings>)) => {
    setSettings(prev => {
      const updates = typeof newSettings === 'function' ? newSettings(prev) : newSettings;
      return { ...prev, ...updates };
    });
  }, []);

  const togglePrivacy = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

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
    isLoading,
  }), [state, settings, thresholds, updateOrientation, updateFaceDetection, updateSettings, togglePrivacy, isLoading]);

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
