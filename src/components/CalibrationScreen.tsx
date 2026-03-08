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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const currentStepData = CALIBRATION_STEPS[currentStep];

  useEffect(() => {
    if (isCalibrating) {
      const interval = setInterval(() => {
        setSamples(prev => [...prev, state.orientation]);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isCalibrating, state.orientation]);

  useEffect(() => {
    if (isCalibrating && samples.length >= 20) {
      processCalibration();
    }
  }, [samples, isCalibrating]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const startCalibration = () => {
    setIsCalibrating(true);
    setSamples([]);
  };

  const processCalibration = () => {
    if (samples.length < 20) return;

    const pitchValues = samples.map(s => s.pitch);
    const rollValues = samples.map(s => s.roll);

    const pitchMin = Math.min(...pitchValues);
    const pitchMax = Math.max(...pitchValues);
    const rollMin = Math.min(...rollValues);
    const rollMax = Math.max(...rollValues);
    
    const pitchCenter = pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length;
    const rollCenter = rollValues.reduce((a, b) => a + b, 0) / rollValues.length;

    const tolerance = 15;

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
      setCurrentStep(prev => prev + 1);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CALIBRATE</Text>
        <Text style={styles.subtitle}>Hold phone in your typical viewing position</Text>
      </View>

      <View style={styles.progressContainer}>
        {CALIBRATION_STEPS.map((step, index) => (
          <View 
            key={step.id} 
            style={[
              styles.progressDot,
              index <= currentStep && styles.progressDotActive
            ]} 
          />
        ))}
      </View>

      <View style={styles.stepContainer}>
        <Text style={styles.stepIcon}>{currentStepData.icon}</Text>
        <Text style={styles.stepName}>{currentStepData.name}</Text>
        <Text style={styles.stepDescription}>{currentStepData.description}</Text>
      </View>

      {isCalibrating ? (
        <View style={styles.calibratingContainer}>
          <Animated.View style={[styles.calibrateRing, { opacity: pulseAnim }]} />
          <Text style={styles.calibratingText}>
            {samples.length > 0 ? `${samples.length}/20` : 'CALIBRATING...'}
          </Text>
          <Text style={styles.sensorValues}>
            P: {state.orientation.pitch.toFixed(1)}° • R: {state.orientation.roll.toFixed(1)}°
          </Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.button}
          onPress={startCalibration}
        >
          <Text style={styles.buttonText}>START</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={styles.skipButton}
        onPress={skipCalibration}
      >
        <Text style={styles.skipText}>SKIP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.red,
    borderColor: COLORS.red,
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepIcon: {
    fontSize: 48,
    color: COLORS.red,
    marginBottom: 16,
  },
  stepName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 2,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  calibratingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  calibrateRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.red,
    marginBottom: 20,
  },
  calibratingText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.red,
    letterSpacing: 2,
  },
  sensorValues: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: COLORS.red,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 2,
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
