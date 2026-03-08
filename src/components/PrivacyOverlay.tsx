/**
 * PrivacyOverlay Component - Full-screen overlay that obscures content
 */

import React, { useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { usePrivacy } from '../context/PrivacyContext';

const { width, height } = Dimensions.get('window');

interface PrivacyOverlayProps {
  intensity?: number; // 0-1, opacity of the dark overlay
  showPattern?: boolean; // Show diagonal pattern
}

export function PrivacyOverlay({ 
  intensity = 0.85, 
  showPattern = true 
}: PrivacyOverlayProps) {
  const { state, settings } = usePrivacy();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const patternOpacity = useRef(new Animated.Value(0)).current;

  // Animate overlay visibility
  useEffect(() => {
    const shouldShow = state.isProtected && settings.enabled;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: shouldShow ? 1 : 0,
        duration: shouldShow ? 200 : 150,
        easing: shouldShow ? Easing.out(Easing.ease) : Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(patternOpacity, {
        toValue: shouldShow && showPattern ? 1 : 0,
        duration: shouldShow ? 250 : 150,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]).start();
  }, [state.isProtected, settings.enabled, showPattern, fadeAnim, patternOpacity]);

  // Don't render if privacy is disabled
  if (!settings.enabled) {
    return null;
  }

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
      {/* Dark overlay */}
      <StatusBar hidden={state.isProtected} />
      
      {/* Pattern overlay for additional privacy */}
      {showPattern && (
        <Animated.View 
          style={[
            styles.patternContainer,
            { opacity: patternOpacity }
          ]}
          pointerEvents="none"
        >
          {/* Diagonal lines pattern - rendered as multiple views */}
          {Array.from({ length: 20 }).map((_, index) => (
            <View 
              key={index}
              style={[
                styles.patternLine,
                { 
                  transform: [
                    { rotate: `${-45 + index * 2}deg` },
                    { translateY: -height + index * 40 }
                  ],
                }
              ]}
            />
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternLine: {
    position: 'absolute',
    width: width * 2,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    left: -width / 2,
  },
});

export default PrivacyOverlay;
