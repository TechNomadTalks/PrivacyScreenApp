/**
 * useSensors Hook - Manages accelerometer and gyroscope sensors
 */

import { useEffect, useRef, useCallback } from "react";
import sensorService from "../services/SensorService";
import { DeviceOrientation } from "../types";

interface UseSensorsOptions {
  enabled?: boolean;
  onOrientationChange?: (orientation: DeviceOrientation) => void;
}

export function useSensors({ enabled = true, onOrientationChange }: UseSensorsOptions = {}) {
  const isRunning = useRef(false);
  const onOrientationChangeRef = useRef(onOrientationChange);

  // Keep the callback ref updated
  useEffect(() => {
    onOrientationChangeRef.current = onOrientationChange;
  }, [onOrientationChange]);

  const startSensors = useCallback(() => {
    if (isRunning.current) return;
    
    sensorService.startListening((orientation) => {
      onOrientationChangeRef.current?.(orientation);
    });
    
    isRunning.current = true;
  }, []);

  const stopSensors = useCallback(() => {
    if (!isRunning.current) return;
    
    sensorService.stopListening();
    isRunning.current = false;
  }, []);

  useEffect(() => {
    if (enabled) {
      startSensors();
    } else {
      stopSensors();
    }

    return () => {
      stopSensors();
    };
  }, [enabled, startSensors, stopSensors]);

  return {
    startSensors,
    stopSensors,
    isRunning: isRunning.current,
  };
}

export default useSensors;
