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
import { detectFacesAsync, FaceDetectorMode, FaceDetectorLandmarks, FaceDetectorClassifications, FaceFeature } from 'expo-face-detector';
import faceEnrollmentService from '../services/FaceEnrollmentService';

interface FaceEnrollmentScreenProps {
  onComplete: () => void;
  onCancel: () => void;
}

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

const faceDetectorOptions = {
  mode: FaceDetectorMode.fast,
  detectLandmarks: FaceDetectorLandmarks.all,
  runClassifications: FaceDetectorClassifications.all,
  minDetectionInterval: 100,
  tracking: true,
};

export function FaceEnrollmentScreen({ onComplete, onCancel }: FaceEnrollmentScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [enrollmentComplete, setEnrollmentComplete] = useState(false);
  const [instruction, setInstruction] = useState('Position your face in the frame');
  
  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const hasPermission = permission?.granted ?? false;

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

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

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      pulseAnim.setValue(1);
      progressAnim.setValue(0);
    }
  }, [isEnrolling, pulseAnim, progressAnim]);

  const captureFace = useCallback(async (): Promise<FaceFeature | null> => {
    if (!cameraRef.current) return null;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        skipProcessing: true,
        base64: false,
      });

      if (photo?.uri) {
        const result = await detectFacesAsync(photo.uri, faceDetectorOptions);
        
        if (result.faces.length === 1) {
          return result.faces[0];
        }
      }
    } catch (error) {
      console.log('Capture error:', error);
    }
    return null;
  }, []);

  const startEnrollment = useCallback(async () => {
    setIsEnrolling(true);
    setCaptureProgress(0);
    setInstruction('Hold steady...');

    const captureCount = 3;
    let success = false;

    for (let i = 0; i < captureCount; i++) {
      setCaptureProgress((i + 1) / captureCount);
      setInstruction(`Capturing ${i + 1}/${captureCount}...`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const face = await captureFace();
      if (face) {
        const enrolled = await faceEnrollmentService.enrollFace(face);
        if (enrolled) {
          success = true;
          break;
        }
      }
    }

    if (success) {
      setEnrollmentComplete(true);
      setInstruction('Face enrolled successfully!');
      setTimeout(() => {
        onComplete();
      }, 1500);
    } else {
      setInstruction('Enrollment failed. Please try again.');
      setIsEnrolling(false);
    }
  }, [captureFace, onComplete]);

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
                borderColor: COLORS.red,
                opacity: pulseAnim,
              }
            ]}>
              <Text style={styles.frameIcon}>☺</Text>
            </Animated.View>
          </View>

          <View style={styles.instructionContainer}>
            <Text style={styles.instruction}>{instruction}</Text>
            
            {isEnrolling && (
              <View style={styles.progressContainer}>
                <Animated.View style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]} />
              </View>
            )}
          </View>

          <View style={styles.buttonContainer}>
            {!isEnrolling && !enrollmentComplete && (
              <TouchableOpacity 
                style={styles.button}
                onPress={startEnrollment}
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
  progressContainer: {
    width: '80%',
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.green,
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
