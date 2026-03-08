/**
 * useFaceDetection Hook - Placeholder for future camera-based face detection
 * Currently not used - orientation-only mode is active
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import faceDetectionService from '../services/FaceDetectionService';
import { FaceDetectionResult } from '../types';

interface UseFaceDetectionOptions {
  enabled?: boolean;
  onFaceDetected?: (result: FaceDetectionResult) => void;
}

interface FaceFeature {
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  yawAngle?: number;
  rollAngle?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
}

export function useFaceDetection({ enabled = true, onFaceDetected }: UseFaceDetectionOptions = {}) {
  const cameraRef = useRef<Record<string, unknown> | null>(null);
  const [hasPermission] = useState<boolean>(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (cameraRef.current && enabled && hasPermission) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [enabled, hasPermission]);

  const faceDetectorOptions = {
    mode: 1, // Fast mode
    detectLandmarks: 2, // All landmarks
    runClassifications: 2, // All classifications
    minDetectionInterval: 100,
    tracking: true,
  };

  return {
    cameraRef,
    hasPermission,
    isReady,
    setCamera: (camera: Record<string, unknown> | null) => { cameraRef.current = camera; },
    faceDetectorOptions,
    handleFacesDetected: (faces: FaceFeature[]) => {
      const result = faceDetectionService.processFaces(faces);
      onFaceDetected?.(result);
    },
    cameraType: 'front' as const,
  };
}

export default useFaceDetection;
