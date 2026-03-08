/**
 * FaceEnrollmentService - Secure face template enrollment and comparison
 * 
 * SECURITY NOTES:
 * - Only stores face templates (numerical representations), NOT images
 * - Templates are generated from facial landmarks and features
 * - All processing stays on-device (no network requests)
 * - User can clear enrollment data at any time
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@privacy_face_template';
const TEMPLATE_VERSION = 'v1';

interface FaceFeature {
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  yawAngle?: number;
  rollAngle?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  leftEyePosition?: { x: number; y: number };
  rightEyePosition?: { x: number; y: number };
  noseBasePosition?: { x: number; y: number };
  mouthPosition?: { x: number; y: number };
  leftMouthPosition?: { x: number; y: number };
  rightMouthPosition?: { x: number; y: number };
  leftEarPosition?: { x: number; y: number };
  rightEarPosition?: { x: number; y: number };
  leftCheekPosition?: { x: number; y: number };
  rightCheekPosition?: { x: number; y: number };
  bottomMouthPosition?: { x: number; y: number };
}

interface FaceTemplate {
  version: string;
  createdAt: number;
  landmarks: number[];
  ratios: number[];
  eyeOpenness: number;
  faceSize: number;
}

interface FaceComparisonResult {
  isSamePerson: boolean;
  confidence: number;
  similarity: number;
}

function extractFaceFeatures(face: FaceFeature): FaceTemplate {
  const landmarks: number[] = [];
  
  if (face.leftEyePosition) {
    landmarks.push(face.leftEyePosition.x, face.leftEyePosition.y);
  }
  if (face.rightEyePosition) {
    landmarks.push(face.rightEyePosition.x, face.rightEyePosition.y);
  }
  if (face.noseBasePosition) {
    landmarks.push(face.noseBasePosition.x, face.noseBasePosition.y);
  }
  if (face.leftMouthPosition) {
    landmarks.push(face.leftMouthPosition.x, face.leftMouthPosition.y);
  }
  if (face.rightMouthPosition) {
    landmarks.push(face.rightMouthPosition.x, face.rightMouthPosition.y);
  }
  if (face.mouthPosition) {
    landmarks.push(face.mouthPosition.x, face.mouthPosition.y);
  }
  if (face.leftEarPosition) {
    landmarks.push(face.leftEarPosition.x, face.leftEarPosition.y);
  }
  if (face.rightEarPosition) {
    landmarks.push(face.rightEarPosition.x, face.rightEarPosition.y);
  }
  if (face.leftCheekPosition) {
    landmarks.push(face.leftCheekPosition.x, face.leftCheekPosition.y);
  }
  if (face.rightCheekPosition) {
    landmarks.push(face.rightCheekPosition.x, face.rightCheekPosition.y);
  }
  if (face.bottomMouthPosition) {
    landmarks.push(face.bottomMouthPosition.x, face.bottomMouthPosition.y);
  }

  const ratios = calculateRatios(face);
  
  const eyeOpenness = ((face.leftEyeOpenProbability || 0) + (face.rightEyeOpenProbability || 0)) / 2;
  
  const faceSize = face.bounds.size.width * face.bounds.size.height;

  return {
    version: TEMPLATE_VERSION,
    createdAt: Date.now(),
    landmarks,
    ratios,
    eyeOpenness,
    faceSize,
  };
}

function calculateRatios(face: FaceFeature): number[] {
  const ratios: number[] = [];
  
  const eyeDistance = Math.sqrt(
    Math.pow((face.rightEyePosition?.x || 0) - (face.leftEyePosition?.x || 0), 2) +
    Math.pow((face.rightEyePosition?.y || 0) - (face.leftEyePosition?.y || 0), 2)
  );
  
  const noseToMouth = Math.sqrt(
    Math.pow((face.mouthPosition?.x || 0) - (face.noseBasePosition?.x || 0), 2) +
    Math.pow((face.mouthPosition?.y || 0) - (face.noseBasePosition?.y || 0), 2)
  );
  
  const faceWidth = face.bounds.size.width;
  const faceHeight = face.bounds.size.height;
  
  const eyeToNose = Math.sqrt(
    Math.pow((face.noseBasePosition?.x || 0) - ((face.leftEyePosition?.x || 0) + (face.rightEyePosition?.x || 0)) / 2, 2) +
    Math.pow((face.noseBasePosition?.y || 0) - ((face.leftEyePosition?.y || 0) + (face.rightEyePosition?.y || 0)) / 2, 2)
  );

  if (eyeDistance > 0) {
    ratios.push(noseToMouth / eyeDistance);
    ratios.push(eyeToNose / eyeDistance);
    ratios.push(faceHeight / eyeDistance);
    ratios.push(faceWidth / eyeDistance);
  }
  
  ratios.push(face.yawAngle || 0);
  ratios.push(face.rollAngle || 0);

  return ratios;
}

function compareTemplates(enrolled: FaceTemplate, current: FaceTemplate): FaceComparisonResult {
  if (enrolled.ratios.length !== current.ratios.length) {
    return { isSamePerson: false, confidence: 0, similarity: 0 };
  }

  let ratioDiff = 0;
  for (let i = 0; i < enrolled.ratios.length; i++) {
    ratioDiff += Math.abs(enrolled.ratios[i] - current.ratios[i]);
  }
  const avgRatioDiff = ratioDiff / enrolled.ratios.length;

  const eyeOpennessDiff = Math.abs(enrolled.eyeOpenness - current.eyeOpenness);
  
  const sizeRatio = enrolled.faceSize > 0 ? current.faceSize / enrolled.faceSize : 1;
  const sizeDiff = Math.abs(1 - sizeRatio);

  let landmarkDiff = 0;
  const minLandmarks = Math.min(enrolled.landmarks.length, current.landmarks.length);
  if (minLandmarks > 0) {
    for (let i = 0; i < minLandmarks; i += 2) {
      const ex = enrolled.landmarks[i];
      const ey = enrolled.landmarks[i + 1];
      const cx = current.landmarks[i];
      const cy = current.landmarks[i + 1];
      
      if (ex && ey && cx && cy) {
        const enrolledFaceSize = Math.sqrt(enrolled.faceSize);
        const currentFaceSize = Math.sqrt(current.faceSize);
        const scale = (enrolledFaceSize + currentFaceSize) / 2;
        
        landmarkDiff += Math.sqrt(Math.pow((ex - cx) / scale, 2) + Math.pow((ey - cy) / scale, 2));
      }
    }
    landmarkDiff /= (minLandmarks / 2);
  }

  const similarity = 1 - Math.min(1, (avgRatioDiff * 0.4 + eyeOpennessDiff * 0.2 + sizeDiff * 0.1 + landmarkDiff * 0.3));
  
  const confidence = Math.max(0, Math.min(1, similarity));
  
  const isSamePerson = confidence > 0.65;

  return {
    isSamePerson,
    confidence,
    similarity,
  };
}

class FaceEnrollmentService {
  private enrolledTemplate: FaceTemplate | null = null;
  private isLoaded = false;

  async loadTemplate(): Promise<FaceTemplate | null> {
    if (this.isLoaded) {
      return this.enrolledTemplate;
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.enrolledTemplate = JSON.parse(stored);
        this.isLoaded = true;
        return this.enrolledTemplate;
      }
    } catch (error) {
      console.error('[FaceEnrollment] Failed to load template:', error);
    }
    
    this.isLoaded = true;
    return null;
  }

  async enrollFace(face: FaceFeature): Promise<boolean> {
    try {
      const template = extractFaceFeatures(face);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(template));
      this.enrolledTemplate = template;
      console.log('[FaceEnrollment] Face enrolled successfully');
      return true;
    } catch (error) {
      console.error('[FaceEnrollment] Failed to enroll face:', error);
      return false;
    }
  }

  async compareFace(face: FaceFeature): Promise<FaceComparisonResult> {
    if (!this.enrolledTemplate) {
      await this.loadTemplate();
    }

    if (!this.enrolledTemplate) {
      return { isSamePerson: false, confidence: 0, similarity: 0 };
    }

    const currentTemplate = extractFaceFeatures(face);
    return compareTemplates(this.enrolledTemplate, currentTemplate);
  }

  async clearEnrollment(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      this.enrolledTemplate = null;
      console.log('[FaceEnrollment] Enrollment cleared');
    } catch (error) {
      console.error('[FaceEnrollment] Failed to clear enrollment:', error);
    }
  }

  isEnrolled(): boolean {
    return this.enrolledTemplate !== null;
  }

  async requestPermissions(): Promise<boolean> {
    return true;
  }
}

export const faceEnrollmentService = new FaceEnrollmentService();
export default faceEnrollmentService;
