import React, { useCallback } from "react";
import { StyleSheet, View, StatusBar, ActivityIndicator, Text } from "react-native";

import { PrivacyProvider, usePrivacy } from "./src/context/PrivacyContext";
import { PrivacyOverlay } from "./src/components/PrivacyOverlay";
import Settings from "./src/components/Settings";
import { useSensors } from "./src/hooks/useSensors";
import { DeviceOrientation } from "./src/types";
import ErrorBoundary from "./src/components/ErrorBoundary";

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#00BCD4" />
      <Text style={styles.loadingText}>Loading settings...</Text>
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
      <StatusBar hidden={state.isProtected} />
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
    backgroundColor: "#121212",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#9E9E9E",
    marginTop: 16,
    fontSize: 14,
  },
});
