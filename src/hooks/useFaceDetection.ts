/**
 * useFaceDetection Hook - Camera-based face detection for privacy screen
 * Uses expo-camera with expo-face-detector for real-time face detection
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { detectFacesAsync, FaceDetectorMode, FaceDetectorLandmarks, FaceDetectorClassifications, FaceFeature } from 'expo-face-detector';
import { FaceDetectionResult } from '../types';

interface UseFaceDetectionOptions {
  enabled?: boolean;
  onFaceDetected?: (result: FaceDetectionResult) => void;
}

const faceDetectorOptions = {
  mode: FaceDetectorMode.fast,
  detectLandmarks: FaceDetectorLandmarks.all,
  runClassifications: FaceDetectorClassifications.all,
  minDetectionInterval: 100,
  tracking: true,
};

export function useFaceDetection({ enabled = true, onFaceDetected }: UseFaceDetectionOptions = {}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const lastProcessTimeRef = useRef<number>(0);
  const hasPermission = permission?.granted ?? false;

  const processFaces = useCallback((faces: FaceFeature[]): FaceDetectionResult => {
    const faceCount = faces.length;
    
    if (faceCount === 0) {
      return {
        isDetected: false,
        faceCount: 0,
        yaw: 0,
        pitch: 0,
        leftEyeOpen: 1,
        rightEyeOpen: 1,
        bounds: { x: 0, y: 0, width: 0, height: 0 },
      };
    }

    if (faceCount > 1) {
      return {
        isDetected: true,
        faceCount,
        yaw: 0,
        pitch: 0,
        leftEyeOpen: 0,
        rightEyeOpen: 0,
        bounds: { x: 0, y: 0, width: 0, height: 0 },
      };
    }

    const face = faces[0];
    const yaw = face.yawAngle || 0;
    const pitch = face.rollAngle || 0;
    const leftEyeOpen = face.leftEyeOpenProbability || 0;
    const rightEyeOpen = face.rightEyeOpenProbability || 0;
    const bounds = {
      x: face.bounds.origin.x,
      y: face.bounds.origin.y,
      width: face.bounds.size.width,
      height: face.bounds.size.height,
    };

    return {
      isDetected: true,
      faceCount: 1,
      yaw,
      pitch,
      leftEyeOpen,
      rightEyeOpen,
      bounds,
    };
  }, []);

  const detectFaces = useCallback(async () => {
    if (!cameraRef.current || !hasPermission) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        skipProcessing: true,
        base64: false,
      });
      
      if (photo?.uri) {
        const result = await detectFacesAsync(photo.uri, faceDetectorOptions);
        const now = Date.now();
        if (now - lastProcessTimeRef.current < 200) {
          return;
        }
        lastProcessTimeRef.current = now;
        
        onFaceDetected?.(processFaces(result.faces));
      }
    } catch (error) {
      console.log('Face detection error:', error);
    }
  }, [hasPermission, onFaceDetected, processFaces]);

  useEffect(() => {
    if (enabled && hasPermission) {
      setIsReady(true);
      
      const interval = setInterval(() => {
        detectFaces();
      }, 200);
      
      return () => clearInterval(interval);
    } else {
      setIsReady(false);
    }
  }, [enabled, hasPermission, detectFaces]);

  useEffect(() => {
    if (enabled && hasPermission && cameraRef.current) {
      detectFaces();
    }
  }, [enabled, hasPermission, detectFaces]);

  return {
    cameraRef,
    hasPermission,
    isReady,
    requestPermission,
    faceDetectorOptions,
    cameraType: 'front' as const,
  };
}

export default useFaceDetection;
