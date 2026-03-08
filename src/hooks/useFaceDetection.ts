/**
 * useFaceDetection Hook - Camera-based face detection for privacy screen
 * Uses expo-camera with expo-face-detector
 */

import { detectFacesAsync, FaceDetectorMode, FaceDetectorLandmarks, FaceDetectorClassifications } from 'expo-face-detector';

const faceDetectorOptions = {
  mode: FaceDetectorMode.fast,
  detectLandmarks: FaceDetectorLandmarks.all,
  runClassifications: FaceDetectorClassifications.all,
  minDetectionInterval: 100,
  tracking: true,
};

export function useFaceDetection() {
  return {
    faceDetectorOptions,
    detectFacesAsync,
  };
}

export default useFaceDetection;
