/**
 * Settings Component - User configuration for privacy screen
 */

import React from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { usePrivacy } from "../context/PrivacyContext";

interface SettingsProps {
  onRequestPermission?: () => void;
}

export function Settings({ onRequestPermission }: SettingsProps) {
  const { settings, updateSettings, state } = usePrivacy();

  const handleToggleEnabled = () => {
    updateSettings({ enabled: !settings.enabled });
  };

  const handleTogglePattern = () => {
    updateSettings({ enablePattern: !settings.enablePattern });
  };

  const handleIntensityChange = (increase: boolean) => {
    const newIntensity = increase 
      ? Math.min(1, settings.filterIntensity + 0.1)
      : Math.max(0.5, settings.filterIntensity - 0.1);
    updateSettings({ filterIntensity: newIntensity });
  };

  const getStatusText = () => {
    if (!settings.enabled) return 'Disabled';
    if (state.isProtected) return 'Protected';
    return 'Unprotected';
  };

  const getStatusColor = () => {
    if (!settings.enabled) return '#9E9E9E';
    if (state.isProtected) return '#4CAF50';
    return '#FF9800';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Privacy Screen</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.rowContent}>
            <Text style={styles.label}>Enable Privacy</Text>
            <Text style={styles.description}>
              Protect your screen from prying eyes
            </Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={handleToggleEnabled}
            trackColor={{ false: "#767577", true: "#81C784" }}
            thumbColor={settings.enabled ? "#4CAF50" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Detection Mode</Text>
        <Text style={styles.infoText}>
          Orientation-based detection is active. The screen will be protected when the device 
          is tilted away from your viewing position.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filter Settings</Text>
        
        <View style={styles.row}>
          <View style={styles.rowContent}>
            <Text style={styles.label}>Pattern Overlay</Text>
            <Text style={styles.description}>
              Add diagonal lines for extra privacy
            </Text>
          </View>
          <Switch
            value={settings.enablePattern}
            onValueChange={handleTogglePattern}
            trackColor={{ false: "#767577", true: "#81C784" }}
            thumbColor={settings.enablePattern ? "#4CAF50" : "#f4f3f4"}
            disabled={!settings.enabled}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowContent}>
            <Text style={styles.label}>Filter Intensity</Text>
            <Text style={styles.description}>
              {(settings.filterIntensity * 100).toFixed(0)}% opacity
            </Text>
          </View>
          <View style={styles.intensityButtons}>
            <TouchableOpacity 
              style={styles.intensityButton}
              onPress={() => handleIntensityChange(false)}
              disabled={!settings.enabled || settings.filterIntensity <= 0.5}
            >
              <Text style={styles.intensityButtonText}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.intensityButton}
              onPress={() => handleIntensityChange(true)}
              disabled={!settings.enabled || settings.filterIntensity >= 1}
            >
              <Text style={styles.intensityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Status</Text>
        
        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Viewing Orientation:</Text>
          <Text style={styles.debugValue}>{state.isViewingOrientation ? "Yes" : "No"}</Text>
        </View>

        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Pitch (tilt fwd/back):</Text>
          <Text style={styles.debugValue}>{state.orientation.pitch.toFixed(1)} deg</Text>
        </View>
        
        <View style={styles.debugRow}>
          <Text style={styles.debugLabel}>Roll (tilt side):</Text>
          <Text style={styles.debugValue}>{state.orientation.roll.toFixed(1)} deg</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoItem}>- Screen appears normal when you hold phone normally</Text>
        <Text style={styles.infoItem}>- Screen dims when you tilt the phone away</Text>
        <Text style={styles.infoItem}>- Tilting sideways or laying flat triggers protection</Text>
        <Text style={styles.infoItem}>- Works offline using motion sensors only</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00BCD4",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  rowContent: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  description: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 2,
  },
  intensityButtons: {
    flexDirection: "row",
    gap: 8,
  },
  intensityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  intensityButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  debugRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  debugLabel: {
    fontSize: 14,
    color: "#9E9E9E",
  },
  debugValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "monospace",
  },
  infoSection: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00BCD4",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#BDBDBD",
    lineHeight: 20,
  },
  infoItem: {
    fontSize: 13,
    color: "#BDBDBD",
    marginBottom: 4,
    lineHeight: 20,
  },
});

export default Settings;
