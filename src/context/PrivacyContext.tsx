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
  DEFAULT_PRIVACY_SETTINGS,
  CalibrationProfile,
} from "../types";
import { SensorServiceClass, createSensorService } from "../services/SensorService";
import SettingsStorage from "../services/SettingsStorage";

interface PrivacyContextType {
  state: PrivacyState;
  settings: PrivacySettings;
  updateOrientation: (orientation: DeviceOrientation) => void;
  updateSettings: (settings: Partial<PrivacySettings> | ((prev: PrivacySettings) => Partial<PrivacySettings>)) => void;
  togglePrivacy: () => void;
  isLoading: boolean;
  isCalibrated: boolean;
}

const initialState: PrivacyState = {
  isProtected: false,
  isUserLooking: false,
  isViewingOrientation: false,
  faceDetected: false,
  multipleFacesDetected: false,
  orientation: { pitch: 0, roll: 0, yaw: 0 },
  cameraActive: false,
  protectionLevel: 0,
};

function privacyReducer(state: PrivacyState, action: PrivacyAction): PrivacyState {
  switch (action.type) {
    case "SET_ORIENTATION":
      return { ...state, orientation: action.payload };
    case "SET_VIEWING_ORIENTATION":
      return { ...state, isViewingOrientation: action.payload };
    case "SET_PROTECTED":
      return { ...state, isProtected: action.payload };
    case "SET_PROTECTION_LEVEL":
      return { ...state, protectionLevel: action.payload };
    default:
      return state;
  }
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

interface PrivacyProviderProps {
  children: React.ReactNode;
}

function calculateDistanceFromProfile(
  orientation: DeviceOrientation,
  profile: CalibrationProfile
): number {
  const { pitch, roll } = orientation;
  const pitchCenter = profile.pitchCenter;
  const rollCenter = profile.rollCenter;
  
  const pitchDistance = Math.abs(pitch - pitchCenter);
  const rollDistance = Math.abs(roll - rollCenter);
  
  const pitchRange = (profile.pitchMax - profile.pitchMin) / 2;
  const rollRange = (profile.rollMax - profile.rollMin) / 2;
  
  const normalizedPitch = pitchRange > 0 ? pitchDistance / pitchRange : 0;
  const normalizedRoll = rollRange > 0 ? rollDistance / rollRange : 0;
  
  return Math.max(0, Math.max(normalizedPitch, normalizedRoll) - 1);
}

export function PrivacyProvider({ children }: PrivacyProviderProps) {
  const [state, dispatch] = useReducer(privacyReducer, initialState);
  const [settings, setSettings] = React.useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const isProtectedRef = useRef(false);
  const lastPrivacyEnableTime = useRef<number>(0);
  const lastPrivacyDisableTime = useRef<number>(0);
  const orientationHistoryRef = useRef<DeviceOrientation[]>([]);
  const protectionLevelRef = useRef(0);
  
  const sensorService = useMemo(() => createSensorService(), []);
  
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

  useEffect(() => {
    if (!isLoading && settings.persistSettings) {
      SettingsStorage.saveSettings(settings).catch(() => {});
    }
  }, [settings, isLoading]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        sensorService.reset();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      sensorService.stopListening();
    };
  }, [sensorService]);

  const processPrivacyDecision = useCallback((orientation: DeviceOrientation) => {
    if (!settings.enabled) {
      if (isProtectedRef.current || protectionLevelRef.current > 0) {
        dispatch({ type: "SET_PROTECTED", payload: false });
        dispatch({ type: "SET_PROTECTION_LEVEL", payload: 0 });
        isProtectedRef.current = false;
        protectionLevelRef.current = 0;
      }
      return;
    }

    const profiles = settings.calibration.profiles;
    
    let minDistance = Infinity;
    for (const profile of profiles) {
      const distance = calculateDistanceFromProfile(orientation, profile);
      minDistance = Math.min(minDistance, distance);
    }

    const maxDistance = 2;
    let protectionLevel = 0;
    if (profiles.length > 0) {
      protectionLevel = Math.min(1, Math.max(0, minDistance / maxDistance));
    }

    protectionLevelRef.current = protectionLevel;
    dispatch({ type: "SET_PROTECTION_LEVEL", payload: protectionLevel });

    const shouldBeProtected = protectionLevel > 0.3;

    const now = Date.now();
    const hysteresisEnableDelay = settings.hysteresisDelay;
    const hysteresisDisableDelay = settings.hysteresisDisableDelay;

    if (shouldBeProtected && !isProtectedRef.current) {
      if (now - lastPrivacyDisableTime.current > hysteresisEnableDelay) {
        lastPrivacyEnableTime.current = now;
        isProtectedRef.current = true;
        dispatch({ type: "SET_PROTECTED", payload: true });
      }
    } else if (!shouldBeProtected && isProtectedRef.current) {
      if (now - lastPrivacyEnableTime.current > hysteresisDisableDelay) {
        lastPrivacyDisableTime.current = now;
        isProtectedRef.current = false;
        dispatch({ type: "SET_PROTECTED", payload: false });
      }
    }
  }, [settings]);

  const updateOrientation = useCallback((orientation: DeviceOrientation) => {
    if (!orientation || typeof orientation.pitch !== 'number' || typeof orientation.roll !== 'number') {
      return;
    }
    
    const validOrientation: DeviceOrientation = {
      pitch: isFinite(orientation.pitch) ? orientation.pitch : 0,
      roll: isFinite(orientation.roll) ? orientation.roll : 0,
      yaw: orientation.yaw !== undefined && isFinite(orientation.yaw) ? orientation.yaw : 0,
    };
    
    dispatch({ type: "SET_ORIENTATION", payload: validOrientation });
    
    processPrivacyDecision(validOrientation);
  }, [processPrivacyDecision]);

  const updateSettings = useCallback((newSettings: Partial<PrivacySettings> | ((prev: PrivacySettings) => Partial<PrivacySettings>)) => {
    setSettings(prev => {
      const updates = typeof newSettings === 'function' ? newSettings(prev) : newSettings;
      return { ...prev, ...updates };
    });
  }, []);

  const togglePrivacy = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const value = useMemo<PrivacyContextType>(() => ({
    state,
    settings,
    updateOrientation,
    updateSettings,
    togglePrivacy,
    isLoading,
    isCalibrated: settings.calibration.isCalibrated,
  }), [state, settings, updateOrientation, updateSettings, togglePrivacy, isLoading]);

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
