/**
 * Face Detection Service - Placeholder for future camera-based detection
 */

import { FaceDetectionResult, PrivacyThresholds } from "../types";

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

class FaceDetectionService {
  private lastFaceData: FaceDetectionResult | null = null;

  async requestPermissions(): Promise<boolean> {
    // No permissions needed for orientation-only mode
    return true;
  }

  processFaces(faces: FaceFeature[]): FaceDetectionResult {
    const faceCount = faces.length;
    
    if (faceCount === 0) {
      const result: FaceDetectionResult = {
        isDetected: false,
        faceCount: 0,
        yaw: 0,
        pitch: 0,
        leftEyeOpen: 1,
        rightEyeOpen: 1,
        bounds: { x: 0, y: 0, width: 0, height: 0 },
      };
      this.lastFaceData = result;
      return result;
    }

    if (faceCount > 1) {
      const result: FaceDetectionResult = {
        isDetected: true,
        faceCount,
        yaw: 0,
        pitch: 0,
        leftEyeOpen: 0,
        rightEyeOpen: 0,
        bounds: { x: 0, y: 0, width: 0, height: 0 },
      };
      this.lastFaceData = result;
      return result;
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

    const result: FaceDetectionResult = {
      isDetected: true,
      faceCount: 1,
      yaw,
      pitch,
      leftEyeOpen,
      rightEyeOpen,
      bounds,
    };

    this.lastFaceData = result;
    return result;
  }

  static isUserLooking(
    faceResult: FaceDetectionResult,
    thresholds: PrivacyThresholds
  ): { isLooking: boolean; reason: string } {
    if (!faceResult.isDetected) {
      return { isLooking: false, reason: "No face detected" };
    }

    if (faceResult.faceCount > 1) {
      return { isLooking: false, reason: "Multiple faces detected" };
    }

    if (Math.abs(faceResult.yaw) > thresholds.yawThreshold) {
      return { 
        isLooking: false, 
        reason: "Yaw angle " + faceResult.yaw.toFixed(1) + " exceeds threshold " + thresholds.yawThreshold 
      };
    }

    if (
      faceResult.pitch < thresholds.pitchThresholdMin ||
      faceResult.pitch > thresholds.pitchThresholdMax
    ) {
      return { 
        isLooking: false, 
        reason: "Pitch angle " + faceResult.pitch.toFixed(1) + " outside range" 
      };
    }

    const avgEyeOpen = (faceResult.leftEyeOpen + faceResult.rightEyeOpen) / 2;
    if (avgEyeOpen < thresholds.eyeOpenThreshold) {
      return { 
        isLooking: false, 
        reason: "Eye openness " + avgEyeOpen.toFixed(2) + " below threshold" 
      };
    }

    return { isLooking: true, reason: "User is looking at screen" };
  }

  getLastFaceData(): FaceDetectionResult | null {
    return this.lastFaceData;
  }

  setCamera(camera: any): void {
    // Not used in orientation-only mode
  }

  dispose(): void {
    this.lastFaceData = null;
  }
}

export const faceDetectionService = new FaceDetectionService();
export default faceDetectionService;
