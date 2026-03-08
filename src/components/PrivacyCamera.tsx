/**
 * PrivacyCamera Component - Hidden camera for face detection
 * Uses expo-camera with expo-face-detector for face analysis
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { detectFacesAsync, FaceDetectorMode, FaceDetectorLandmarks, FaceDetectorClassifications } from 'expo-face-detector';
import { usePrivacy } from '../context/PrivacyContext';
import faceEnrollmentService from '../services/FaceEnrollmentService';

interface PrivacyCameraProps {
  children?: React.ReactNode;
}

interface FaceData {
  bounds: {
    size: { width: number; height: number };
    origin: { x: number; y: number };
  };
  yawAngle?: number;
  rollAngle?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  leftEyePosition?: { x: number; y: number };
  rightEyePosition?: { x: number; y: number };
  noseBasePosition?: { x: number; y: number };
  mouthPosition?: { x: number; y: number };
  leftEarPosition?: { x: number; y: number };
  rightEarPosition?: { x: number; y: number };
  leftCheekPosition?: { x: number; y: number };
  rightCheekPosition?: { x: number; y: number };
  bottomMouthPosition?: { x: number; y: number };
}

const faceDetectorOptions = {
  mode: FaceDetectorMode.fast,
  detectLandmarks: FaceDetectorLandmarks.all,
  runClassifications: FaceDetectorClassifications.all,
  minDetectionInterval: 100,
  tracking: true,
};

export function PrivacyCamera({ children }: PrivacyCameraProps) {
  const { settings, updateFaceDetection, setCameraActive } = usePrivacy();
  const [permission] = useCameraPermissions();
  
  const shouldEnable = settings.enabled && settings.enableCameraDetection;
  const hasPermission = permission?.granted ?? false;
  const cameraRef = useRef<CameraView>(null);
  const lastProcessTimeRef = useRef<number>(0);

  const detectAndProcessFaces = useCallback(async () => {
    if (!cameraRef.current || !hasPermission) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        skipProcessing: true,
        base64: false,
      });
      
      if (photo?.uri) {
        const result = await detectFacesAsync(photo.uri, faceDetectorOptions);
        const now = Date.now();
        if (now - lastProcessTimeRef.current < 500) {
          return;
        }
        lastProcessTimeRef.current = now;
        
        const faces = result.faces as FaceData[];
        
        if (faces.length === 0) {
          updateFaceDetection(false, false, false, 0, false);
          return;
        }

        if (faces.length > 1) {
          updateFaceDetection(true, true, false, 0, false);
          return;
        }

        const face = faces[0];
        const avgEyeOpen = ((face.leftEyeOpenProbability || 0) + (face.rightEyeOpenProbability || 0)) / 2;
        const eyesClosed = avgEyeOpen < settings.eyeOpenThreshold;
        
        let similarity = 1;
        let isUserFace = true;
        
        if (settings.userFaceEnrolled) {
          const compareResult = await faceEnrollmentService.compareFace(face as any);
          similarity = compareResult.similarity;
          isUserFace = compareResult.isSamePerson;
        }
        
        updateFaceDetection(true, false, eyesClosed, similarity, isUserFace);
      }
    } catch (error) {
      console.log('Face detection error:', error);
    }
  }, [hasPermission, settings.eyeOpenThreshold, settings.userFaceEnrolled, updateFaceDetection]);

  useEffect(() => {
    faceEnrollmentService.loadTemplate().then(template => {
      if (template) {
        console.log('[PrivacyCamera] User face template loaded');
      }
    });
  }, []);

  useEffect(() => {
    if (shouldEnable && hasPermission) {
      setCameraActive(true);
      
      const interval = setInterval(() => {
        detectAndProcessFaces();
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setCameraActive(false);
      updateFaceDetection(false, false, false, 0, true);
    }
  }, [shouldEnable, hasPermission, detectAndProcessFaces, setCameraActive, updateFaceDetection]);

  if (!shouldEnable || !hasPermission) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      >
        {children}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  camera: {
    flex: 1,
    opacity: 0,
  },
});

export default PrivacyCamera;
