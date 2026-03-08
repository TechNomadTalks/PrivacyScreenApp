import React, { useCallback, useMemo } from "react";
import { StyleSheet, View, StatusBar } from "react-native";

import { PrivacyProvider, usePrivacy } from "./src/context/PrivacyContext";
import { PrivacyOverlay } from "./src/components/PrivacyOverlay";
import Settings from "./src/components/Settings";
import { useSensors } from "./src/hooks/useSensors";
import { DeviceOrientation } from "./src/types";

function MainApp() {
  const { state, settings, updateOrientation } = usePrivacy();

  const handleOrientationChange = useCallback((orientation: DeviceOrientation) => {
    updateOrientation(orientation);
  }, [updateOrientation]);

  // Start sensors - always enabled when privacy is enabled
  useSensors({ enabled: settings.enabled, onOrientationChange: handleOrientationChange });

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
    <PrivacyProvider>
      <MainApp />
    </PrivacyProvider>
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
});
