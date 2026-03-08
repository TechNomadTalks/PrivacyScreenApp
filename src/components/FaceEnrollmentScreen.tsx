/**
 * FaceEnrollmentScreen - Capture user's face for identification
 * 
 * SECURITY:
 * - Only captures face templates, not images
 * - Templates stored locally using AsyncStorage
 * - No network transmission of biometric data
 * - User can clear enrollment at any time
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { detectFacesAsync, FaceDetectorMode, FaceDetectorLandmarks, FaceDetectorClassifications } from 'expo-face-detector';
import faceEnrollmentService from '../services/FaceEnrollmentService';

interface FaceEnrollmentScreenProps {
  onComplete: () => void;
  onCancel: () => void;
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

const COLORS = {
  bg: '#000000',
  surface: '#0D0D0D',
  red: '#E53935',
  redDim: '#8B2828',
  text: '#FFFFFF',
  textMuted: '#AAAAAA',
  border: '#1F1F1F',
  green: '#4CAF50',
};

export function FaceEnrollmentScreen({ onComplete, onCancel }: FaceEnrollmentScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentComplete, setEnrollmentComplete] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [instruction, setInstruction] = useState('Position your face in the frame');
  
  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const currentFaceRef = useRef<FaceData | null>(null);
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasPermission = permission?.granted ?? false;

  const checkForFace = useCallback(async () => {
    if (!cameraRef.current || !hasPermission) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        skipProcessing: true,
        base64: false,
      });
      
      if (photo?.uri) {
        const result = await detectFacesAsync(photo.uri, faceDetectorOptions);
        
        if (result.faces.length === 1) {
          setFaceDetected(true);
          currentFaceRef.current = result.faces[0] as FaceData;
          if (!isEnrolling) {
            setInstruction('Face detected - Tap Enroll to continue');
          }
        } else if (result.faces.length > 1) {
          setFaceDetected(false);
          setInstruction('Multiple faces - Please show only one face');
          currentFaceRef.current = null;
        } else {
          setFaceDetected(false);
          setInstruction('Position your face in the frame');
          currentFaceRef.current = null;
        }
      }
    } catch (error) {
      console.log('Face detection error:', error);
    }
  }, [hasPermission, isEnrolling]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (hasPermission && !enrollmentComplete) {
      detectionIntervalRef.current = setInterval(checkForFace, 500);
    }
    
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [hasPermission, enrollmentComplete, checkForFace]);

  useEffect(() => {
    if (isEnrolling) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isEnrolling, pulseAnim]);

  const startEnrollment = useCallback(async () => {
    if (!currentFaceRef.current) {
      setInstruction('No face detected. Please position your face.');
      return;
    }

    setIsEnrolling(true);
    setInstruction('Capturing face...');

    setTimeout(async () => {
      const face = currentFaceRef.current;
      if (face) {
        const success = await faceEnrollmentService.enrollFace(face as any);
        
        if (success) {
          setEnrollmentComplete(true);
          setInstruction('Face enrolled successfully!');
          if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
          }
          setTimeout(() => {
            onComplete();
          }, 1500);
        } else {
          setInstruction('Enrollment failed. Please try again.');
          setIsEnrolling(false);
        }
      } else {
        setInstruction('No face detected. Please try again.');
        setIsEnrolling(false);
      }
    }, 1500);
  }, [onComplete]);

  const clearEnrollment = useCallback(() => {
    Alert.alert(
      'Clear Face Data',
      'This will remove your enrolled face data. You can re-enroll later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            await faceEnrollmentService.clearEnrollment();
            setEnrollmentComplete(false);
            setInstruction('Face data cleared. You can re-enroll anytime.');
          }
        },
      ]
    );
  }, []);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>CAMERA ACCESS REQUIRED</Text>
          <Text style={styles.description}>
            Camera access is needed to enroll your face for identification.
          </Text>
          <TouchableOpacity style={styles.button} onPress={onCancel}>
            <Text style={styles.buttonText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancelText}>CANCEL</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>ENROLL FACE</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.frameContainer}>
            <Animated.View style={[
              styles.faceFrame,
              { 
                borderColor: faceDetected ? COLORS.green : COLORS.red,
                opacity: isEnrolling ? pulseAnim : 1,
              }
            ]}>
              <Text style={styles.frameIcon}>☺</Text>
            </Animated.View>
          </View>

          <View style={styles.instructionContainer}>
            <Text style={styles.instruction}>{instruction}</Text>
          </View>

          <View style={styles.buttonContainer}>
            {!isEnrolling && !enrollmentComplete && (
              <TouchableOpacity 
                style={[styles.button, !faceDetected && styles.buttonDisabled]}
                onPress={startEnrollment}
                disabled={!faceDetected}
              >
                <Text style={styles.buttonText}>ENROLL MY FACE</Text>
              </TouchableOpacity>
            )}

            {enrollmentComplete && (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>ENROLLED</Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearEnrollment}
            >
              <Text style={styles.clearText}>CLEAR FACE DATA</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.securityNote}>
            <Text style={styles.securityTitle}>SECURITY</Text>
            <Text style={styles.securityText}>
              • Only face templates are stored, not images{'\n'}
              • All data stays on your device{'\n'}
              • No internet connection required
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  camera: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    marginBottom: 20,
  },
  cancelText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  screenTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  description: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  frameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceFrame: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  frameIcon: {
    fontSize: 60,
    color: COLORS.textMuted,
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  instruction: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.red,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: COLORS.redDim,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  successContainer: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 15,
  },
  successText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  clearButton: {
    paddingVertical: 12,
  },
  clearText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  securityNote: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  securityTitle: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  securityText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default FaceEnrollmentScreen;
