/**
 * PrivacyCamera Component - Hidden camera for face detection
 * Only activates when protection is enabled and camera detection is on
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { detectFacesAsync, FaceDetectorMode, FaceDetectorLandmarks, FaceDetectorClassifications, FaceFeature } from 'expo-face-detector';
import { usePrivacy } from '../context/PrivacyContext';
import { FaceDetectionResult } from '../types';
import faceEnrollmentService from '../services/FaceEnrollmentService';

interface PrivacyCameraProps {
  children?: React.ReactNode;
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
  
  const shouldEnable = settings.enabled && settings.enableCameraDetection;
  const cameraRef = useRef<CameraView>(null);
  const lastProcessTimeRef = useRef<number>(0);
  const hasPermissionRef = useRef(false);

  const processFace = useCallback(async (face: FaceFeature) => {
    const multipleFaces = false;
    const avgEyeOpen = ((face.leftEyeOpenProbability || 0) + (face.rightEyeOpenProbability || 0)) / 2;
    const eyesClosed = avgEyeOpen < settings.eyeOpenThreshold;
    
    let similarity = 1;
    let isUserFace = true;
    
    if (settings.userFaceEnrolled) {
      const result = await faceEnrollmentService.compareFace(face);
      similarity = result.similarity;
      isUserFace = result.isSamePerson;
      
      updateFaceDetection(true, multipleFaces, eyesClosed, similarity, isUserFace);
    } else {
      updateFaceDetection(true, multipleFaces, eyesClosed, 1, true);
    }
  }, [settings.eyeOpenThreshold, settings.userFaceEnrolled, updateFaceDetection]);

  const detectFaces = useCallback(async () => {
    if (!cameraRef.current || !hasPermissionRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        skipProcessing: true,
        base64: false,
      });
      
      if (photo?.uri) {
        const result = await detectFacesAsync(photo.uri, faceDetectorOptions);
        const now = Date.now();
        if (now - lastProcessTimeRef.current < 300) {
          return;
        }
        lastProcessTimeRef.current = now;
        
        if (result.faces.length === 0) {
          updateFaceDetection(false, false, false, 0, false);
        } else if (result.faces.length > 1) {
          updateFaceDetection(true, true, false, 0, false);
        } else {
          await processFace(result.faces[0]);
        }
      }
    } catch (error) {
      console.log('Face detection error:', error);
    }
  }, [processFace, updateFaceDetection]);

  useEffect(() => {
    faceEnrollmentService.loadTemplate().then(template => {
      if (template) {
        console.log('[PrivacyCamera] User face template loaded');
      }
    });
  }, []);

  useEffect(() => {
    if (shouldEnable) {
      setCameraActive(true);
      
      const interval = setInterval(() => {
        detectFaces();
      }, 500);
      
      return () => clearInterval(interval);
    } else {
      setCameraActive(false);
      updateFaceDetection(false, false, false, 0, true);
    }
  }, [shouldEnable, detectFaces, setCameraActive, updateFaceDetection]);

  const handleCameraReady = useCallback(() => {
    hasPermissionRef.current = true;
    if (shouldEnable) {
      detectFaces();
    }
  }, [shouldEnable, detectFaces]);

  if (!shouldEnable) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        onCameraReady={handleCameraReady}
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
