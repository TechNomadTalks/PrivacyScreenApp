/**
 * useSensors Hook - Manages accelerometer and gyroscope sensors
 */

import { useEffect, useRef, useCallback, useState } from "react";
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

  // Keep the callback ref updated
  useEffect(() => {
    onOrientationChangeRef.current = onOrientationChange;
  }, [onOrientationChange]);

  const startSensors = useCallback(() => {
    if (isRunningRef.current) return;
    
    sensorService.startListening((orientation) => {
      onOrientationChangeRef.current?.(orientation);
    });
    
    isRunningRef.current = true;
    setIsRunning(true);
  }, []);

  const stopSensors = useCallback(() => {
    if (!isRunningRef.current) return;
    
    sensorService.stopListening();
    isRunningRef.current = false;
    setIsRunning(false);
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
    isRunning: isRunning,
  };
}

export default useSensors;
