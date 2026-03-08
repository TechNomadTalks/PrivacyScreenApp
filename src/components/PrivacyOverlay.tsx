/**
 * PrivacyOverlay Component - Full-screen overlay that obscures content
 */

import React, { useEffect, useRef } from 'react';
import { 
  Animated,
  StatusBar,
} from 'react-native';
import { usePrivacy } from '../context/PrivacyContext';

interface PrivacyOverlayProps {
  intensity?: number;
  showPattern?: boolean;
}

export function PrivacyOverlay({ 
  intensity: intensityProp = 0.85, 
  showPattern = false 
}: PrivacyOverlayProps) {
  const intensity = Number.isFinite(intensityProp) ? Math.max(0, Math.min(1, intensityProp)) : 0.85;
  const { state, settings } = usePrivacy();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shouldShow = state.isProtected && settings.enabled;
    
    Animated.timing(fadeAnim, {
      toValue: shouldShow ? 1 : 0,
      duration: shouldShow ? 200 : 150,
      useNativeDriver: true,
    }).start();
  }, [state.isProtected, settings.enabled, fadeAnim]);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: fadeAnim,
          backgroundColor: `rgba(0, 0, 0, ${intensity})`,
        }
      ]}
      pointerEvents="none"
    >
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
};

import { StyleSheet } from 'react-native';
export default PrivacyOverlay;
