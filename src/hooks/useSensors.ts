/**
 * useSensors Hook - Manages accelerometer sensor
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { Platform } from "react-native";
import sensorService from "../services/SensorService";
import { DeviceOrientation } from "../types";

interface UseSensorsOptions {
  enabled?: boolean;
  onOrientationChange?: (orientation: DeviceOrientation) => void;
}

export function useSensors({ enabled = true, onOrientationChange }: UseSensorsOptions = {}) {
  const isRunningRef = useRef(false);
  const onOrientationChangeRef = useRef(onOrientationChange);
  const [isRunning, setIsRunning] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    onOrientationChangeRef.current = onOrientationChange;
  }, [onOrientationChange]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsAvailable(false);
      return;
    }
    setIsAvailable(true);
  }, []);

  const startSensors = useCallback(() => {
    if (isRunningRef.current || !isAvailable) return;
    
    const success = sensorService.startListening((orientation) => {
      onOrientationChangeRef.current?.(orientation);
    });
    
    if (success) {
      isRunningRef.current = true;
      setIsRunning(true);
    }
  }, [isAvailable]);

  const stopSensors = useCallback(() => {
    if (!isRunningRef.current) return;
    
    sensorService.stopListening();
    isRunningRef.current = false;
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (enabled && isAvailable) {
      startSensors();
    } else {
      stopSensors();
    }

    return () => {
      stopSensors();
    };
  }, [enabled, isAvailable, startSensors, stopSensors]);

  return {
    startSensors,
    stopSensors,
    isRunning: isRunning,
    isAvailable,
  };
}

export default useSensors;
