/**
 * useFaceDetection Hook - Manages camera and face detection
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { CameraView } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
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
  const cameraRef = useRef<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const granted = await faceDetectionService.requestPermissions();
      setHasPermission(granted);
    })();
  }, []);

  const handleFacesDetected = useCallback((faces: FaceFeature[]) => {
    const result = faceDetectionService.processFaces(faces);
    onFaceDetected?.(result);
  }, [onFaceDetected]);

  const setCamera = useCallback((camera: any) => {
    cameraRef.current = camera;
  }, []);

  useEffect(() => {
    if (cameraRef.current && enabled && hasPermission) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [enabled, hasPermission]);

  const faceDetectorOptions = {
    mode: FaceDetector.FaceDetectorMode.fast,
    detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
    runClassifications: FaceDetector.FaceDetectorClassifications.all,
    minDetectionInterval: 100,
    tracking: true,
  };

  return {
    cameraRef,
    hasPermission,
    isReady,
    setCamera,
    faceDetectorOptions,
    handleFacesDetected,
    cameraType: 'front' as const,
  };
}

export default useFaceDetection;
