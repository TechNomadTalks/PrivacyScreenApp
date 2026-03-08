import React, { useCallback } from "react";
import { StyleSheet, View, StatusBar, Text } from "react-native";

import { PrivacyProvider, usePrivacy } from "./src/context/PrivacyContext";
import { PrivacyOverlay } from "./src/components/PrivacyOverlay";
import Settings from "./src/components/Settings";
import { useSensors } from "./src/hooks/useSensors";
import { DeviceOrientation } from "./src/types";
import ErrorBoundary from "./src/components/ErrorBoundary";

const COLORS = {
  bg: '#000000',
  red: '#E53935',
  textMuted: '#666666',
};

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingDot} />
      <Text style={styles.loadingText}>INITIALIZING</Text>
    </View>
  );
}

function MainApp() {
  const { state, settings, updateOrientation, isLoading } = usePrivacy();

  const handleOrientationChange = useCallback((orientation: DeviceOrientation) => {
    updateOrientation(orientation);
  }, [updateOrientation]);

  useSensors({ enabled: !isLoading && settings.enabled, onOrientationChange: handleOrientationChange });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <PrivacyOverlay 
        intensity={settings.filterIntensity} 
        showPattern={settings.enablePattern} 
      />
      <View style={styles.content}>
        <Settings onRequestPermission={() => {}} />
      </View>
      <StatusBar hidden={state.isProtected} barStyle="light-content" />
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PrivacyProvider>
        <MainApp />
      </PrivacyProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.red,
    marginBottom: 20,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 3,
  },
});
