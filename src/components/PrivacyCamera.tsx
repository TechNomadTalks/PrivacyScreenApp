/**
 * PrivacyCamera Component - Hidden camera for face detection
 * Uses react-native-vision-camera with face detection
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Camera as VisionCamera, useCameraDevice, useCameraPermission, CameraDevice, Frame } from 'react-native-vision-camera';
import { Camera, Face, FrameFaceDetectionOptions } from 'react-native-vision-camera-face-detector';
import { usePrivacy } from '../context/PrivacyContext';
import faceEnrollmentService from '../services/FaceEnrollmentService';

interface PrivacyCameraProps {
  children?: React.ReactNode;
}

export function PrivacyCamera({ children }: PrivacyCameraProps) {
  const { settings, updateFaceDetection, setCameraActive } = usePrivacy();
  const { hasPermission, requestPermission } = useCameraPermission();
  
  const shouldEnable = settings.enabled && settings.enableCameraDetection;
  const device = useCameraDevice('front');
  const cameraRef = useRef<VisionCamera>(null);

  const handleFacesDetected = useCallback(async (faces: Face[], _frame: Frame) => {
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
      const faceForComparison = {
        bounds: {
          size: { width: face.bounds.width, height: face.bounds.height },
          origin: { x: face.bounds.x, y: face.bounds.y },
        },
        yawAngle: face.yawAngle,
        rollAngle: face.rollAngle,
        leftEyeOpenProbability: face.leftEyeOpenProbability,
        rightEyeOpenProbability: face.rightEyeOpenProbability,
        leftEyePosition: face.leftEyeOpenProbability ? { x: 0, y: 0 } : undefined,
        rightEyePosition: face.rightEyeOpenProbability ? { x: 0, y: 0 } : undefined,
        noseBasePosition: { x: 0, y: 0 },
        mouthPosition: { x: 0, y: 0 },
      };
      
      const compareResult = await faceEnrollmentService.compareFace(faceForComparison as any);
      similarity = compareResult.similarity;
      isUserFace = compareResult.isSamePerson;
    }
    
    updateFaceDetection(true, false, eyesClosed, similarity, isUserFace);
  }, [settings.eyeOpenThreshold, settings.userFaceEnrolled, updateFaceDetection]);

  const faceDetectionOptions: FrameFaceDetectionOptions = {
    performanceMode: 'accurate',
    landmarkMode: 'all',
    contourMode: 'none',
    classificationMode: 'all',
    trackingEnabled: false,
  };

  useEffect(() => {
    faceEnrollmentService.loadTemplate().then(template => {
      if (template) {
        console.log('[PrivacyCamera] User face template loaded');
      }
    });
  }, []);

  useEffect(() => {
    if (!hasPermission && shouldEnable) {
      requestPermission();
    }
  }, [hasPermission, shouldEnable, requestPermission]);

  useEffect(() => {
    setCameraActive(shouldEnable && hasPermission && !!device);
    
    if (!shouldEnable) {
      updateFaceDetection(false, false, false, 0, true);
    }
  }, [shouldEnable, hasPermission, device, setCameraActive, updateFaceDetection]);

  if (!shouldEnable || !hasPermission || !device) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        faceDetectionCallback={handleFacesDetected}
        faceDetectionOptions={faceDetectionOptions}
      >
        {children}
      </Camera>
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
