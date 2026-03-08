/**
 * Calibration Screen - Calibrate phone orientations
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { usePrivacy } from "../context/PrivacyContext";
import { CalibrationProfile, DeviceOrientation } from "../types";

interface CalibrationStep {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const CALIBRATION_STEPS: CalibrationStep[] = [
  { id: 'desk', name: 'SITTING', description: 'Hold phone as you would at a desk', icon: '◧' },
  { id: 'bed', name: 'LYING DOWN', description: 'Hold phone as you would in bed', icon: '▭' },
  { id: 'hand', name: 'HANDHELD', description: 'Hold phone in your hand comfortably', icon: '☺' },
];

const COLORS = {
  bg: '#000000',
  surface: '#0D0D0D',
  red: '#E53935',
  redDim: '#8B2828',
  text: '#FFFFFF',
  textMuted: '#AAAAAA',
  border: '#1F1F1F',
};

interface CalibrationScreenProps {
  onComplete: () => void;
}

export function CalibrationScreen({ onComplete }: CalibrationScreenProps) {
  const { state, settings, updateSettings } = usePrivacy();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [samples, setSamples] = useState<DeviceOrientation[]>([]);
  const [calibrationTime, setCalibrationTime] = useState(10);
  const [showSuccess, setShowSuccess] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const stepFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let pulse: Animated.CompositeAnimation;
    if (isCalibrating) {
      pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
    }
    return () => {
      if (pulse) pulse.stop();
      pulseAnim.setValue(1);
    };
  }, [isCalibrating, pulseAnim]);

  useEffect(() => {
    if (isCalibrating) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(0);
    }
  }, [isCalibrating, progressAnim]);

  useEffect(() => {
    if (isCalibrating) {
      setCalibrationTime(10);
      
      const countdown = setInterval(() => {
        setCalibrationTime(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      const timeout = setTimeout(() => {
        setIsCalibrating(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 800);
      }, 10000);
      
      const interval = setInterval(() => {
        setSamples(prev => [...prev, state.orientation]);
      }, 100);
      
      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
        clearInterval(countdown);
      };
    }
  }, [isCalibrating]);

  useEffect(() => {
    if (!isCalibrating && samples.length > 0) {
      processCalibration();
    }
  }, [samples, isCalibrating]);

  const startCalibration = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setIsCalibrating(true);
    setSamples([]);
  };

  const processCalibration = () => {
    if (samples.length < 10) return;

    const pitchValues = samples.map(s => s.pitch);
    const rollValues = samples.map(s => s.roll);

    const pitchMin = Math.min(...pitchValues);
    const pitchMax = Math.max(...pitchValues);
    const rollMin = Math.min(...rollValues);
    const rollMax = Math.max(...rollValues);
    
    const pitchCenter = pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length;
    const rollCenter = rollValues.reduce((a, b) => a + b, 0) / rollValues.length;

    const tolerance = 8;

    const newProfile: CalibrationProfile = {
      id: currentStepData.id,
      name: currentStepData.name,
      pitchMin: pitchMin - tolerance,
      pitchMax: pitchMax + tolerance,
      rollMin: rollMin - tolerance,
      rollMax: rollMax + tolerance,
      pitchCenter,
      rollCenter,
    };

    const existingProfiles = settings.calibration.profiles.filter(p => p.id !== currentStepData.id);
    const updatedProfiles = [...existingProfiles, newProfile];
    
    const isComplete = currentStep >= CALIBRATION_STEPS.length - 1;

    updateSettings({
      calibration: {
        profiles: updatedProfiles,
        isCalibrated: isComplete,
        activeProfileId: isComplete ? updatedProfiles[0]?.id || null : null,
      }
    });

    setIsCalibrating(false);
    setSamples([]);

    if (currentStep < CALIBRATION_STEPS.length - 1) {
      Animated.parallel([
        Animated.timing(stepFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(prev => prev + 1);
        Animated.timing(stepFadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      onComplete();
    }
  };

  const skipCalibration = () => {
    updateSettings({
      calibration: {
        profiles: [],
        isCalibrated: true,
        activeProfileId: null,
      }
    });
    onComplete();
  };

  const currentStepData = CALIBRATION_STEPS[currentStep];
  const progress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>CALIBRATE</Text>
          <Text style={styles.subtitle}>Hold phone in your typical viewing position</Text>
        </View>

        <View style={styles.progressContainer}>
          {CALIBRATION_STEPS.map((step, index) => (
            <Animated.View 
              key={step.id}
              style={[
                styles.progressDot,
                index < currentStep && styles.progressDotComplete,
                index === currentStep && isCalibrating && styles.progressDotActive,
              ]} 
            />
          ))}
        </View>

        <Animated.View style={[styles.stepContainer, { opacity: stepFadeAnim }]}>
          <View style={styles.iconContainer}>
            <Text style={styles.stepIcon}>{currentStepData.icon}</Text>
          </View>
          <Text style={styles.stepName}>{currentStepData.name}</Text>
          <Text style={styles.stepDescription}>{currentStepData.description}</Text>
        </Animated.View>

        {isCalibrating ? (
          <View style={styles.calibratingContainer}>
            <View style={styles.ringContainer}>
              <Animated.View 
                style={[
                  styles.calibrateRingOuter, 
                  { 
                    opacity: pulseAnim,
                    transform: [{ scale: pulseAnim }]
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.calibrateRingInner,
                  { 
                    borderColor: showSuccess ? COLORS.text : COLORS.red,
                  }
                ]}
              >
                <Animated.Text style={[
                  styles.calibratingText,
                  showSuccess && styles.calibratingTextSuccess
                ]}>
                  {showSuccess ? '✓' : calibrationTime}
                </Animated.Text>
              </Animated.View>
            </View>
            
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }
                ]} 
              />
            </View>

            <Text style={styles.sensorValues}>
              P: {state.orientation.pitch.toFixed(1)}° • R: {state.orientation.roll.toFixed(1)}°
            </Text>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
              style={styles.button}
              onPress={startCalibration}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>START</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {!isCalibrating && (
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={skipCalibration}
          >
            <Text style={styles.skipText}>SKIP</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 40,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressDotComplete: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  progressDotActive: {
    backgroundColor: COLORS.red,
    borderColor: COLORS.red,
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.red,
  },
  stepIcon: {
    fontSize: 40,
    color: COLORS.red,
  },
  stepName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 3,
  },
  stepDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  calibratingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  ringContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  calibrateRingOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.red,
  },
  calibrateRingInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  calibratingText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.red,
  },
  calibratingTextSuccess: {
    color: COLORS.text,
  },
  progressBarContainer: {
    width: '80%',
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.red,
    borderRadius: 2,
  },
  sensorValues: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: COLORS.red,
    paddingVertical: 18,
    paddingHorizontal: 64,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 3,
  },
  skipButton: {
    alignSelf: 'center',
  },
  skipText: {
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
});

export default CalibrationScreen;
