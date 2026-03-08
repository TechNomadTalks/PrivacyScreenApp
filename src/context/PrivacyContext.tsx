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
};

function privacyReducer(state: PrivacyState, action: PrivacyAction): PrivacyState {
  switch (action.type) {
    case "SET_ORIENTATION":
      return { ...state, orientation: action.payload };
    case "SET_VIEWING_ORIENTATION":
      return { ...state, isViewingOrientation: action.payload };
    case "SET_PROTECTED":
      return { ...state, isProtected: action.payload };
    default:
      return state;
  }
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

interface PrivacyProviderProps {
  children: React.ReactNode;
}

function isOrientationInProfile(
  orientation: DeviceOrientation, 
  profile: { pitchMin: number; pitchMax: number; rollMin: number; rollMax: number }
): boolean {
  const { pitch, roll } = orientation;
  return (
    pitch >= profile.pitchMin &&
    pitch <= profile.pitchMax &&
    roll >= profile.rollMin &&
    roll <= profile.rollMax
  );
}

export function PrivacyProvider({ children }: PrivacyProviderProps) {
  const [state, dispatch] = useReducer(privacyReducer, initialState);
  const [settings, setSettings] = React.useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const isProtectedRef = useRef(false);
  const lastPrivacyEnableTime = useRef<number>(0);
  const lastPrivacyDisableTime = useRef<number>(0);
  const orientationHistoryRef = useRef<DeviceOrientation[]>([]);
  
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
      if (isProtectedRef.current) {
        dispatch({ type: "SET_PROTECTED", payload: false });
        isProtectedRef.current = false;
      }
      return;
    }

    orientationHistoryRef.current.push(orientation);
    if (orientationHistoryRef.current.length > 10) {
      orientationHistoryRef.current.shift();
    }

    const inAnyProfile = settings.calibration.profiles.some(profile => 
      isOrientationInProfile(orientation, profile)
    );

    const shouldBeProtected = !inAnyProfile;

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
    
    const isViewing = settings.calibration.profiles.some(profile => 
      isOrientationInProfile(validOrientation, profile)
    );
    dispatch({ type: "SET_VIEWING_ORIENTATION", payload: isViewing });
    
    processPrivacyDecision(validOrientation);
  }, [settings, processPrivacyDecision]);

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
