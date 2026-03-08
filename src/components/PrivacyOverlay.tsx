/**
 * PrivacyOverlay Component - Full-screen overlay that obscures content
 */

import React, { useEffect, useRef } from 'react';
import { 
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { usePrivacy } from '../context/PrivacyContext';

interface PrivacyOverlayProps {
  maxIntensity?: number;
  showPattern?: boolean;
}

export function PrivacyOverlay({ 
  maxIntensity = 0.85, 
  showPattern = false 
}: PrivacyOverlayProps) {
  const { state, settings } = usePrivacy();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const intensityAnim = useRef(new Animated.Value(0)).current;

  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    const targetIntensity = state.protectionLevel * maxIntensity;
    const shouldShow = state.protectionLevel > 0.05 && settings.enabled;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: shouldShow ? 1 : 0,
        duration: shouldShow ? 300 : 500,
        useNativeDriver,
      }),
      Animated.timing(intensityAnim, {
        toValue: targetIntensity,
        duration: 300,
        useNativeDriver,
      }),
    ]).start();
  }, [state.protectionLevel, settings.enabled, fadeAnim, intensityAnim, maxIntensity, useNativeDriver]);

  const currentIntensity = intensityAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxIntensity],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
        }
      ]}
      pointerEvents="none"
    >
      <Animated.View 
        style={[
          styles.overlay,
          {
            opacity: currentIntensity,
          }
        ]}
        pointerEvents="none"
      />
      <StatusBar hidden={state.isProtected} />
    </Animated.View>
  );
}

const styles = {
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  } as const,
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  } as const,
};

import { StyleSheet } from 'react-native';
export default PrivacyOverlay;
