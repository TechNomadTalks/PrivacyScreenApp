/**
 * Settings Component - Minimal smart UI for privacy screen
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
import { PrivacySettings } from "../types";

interface SettingsProps {
  onRequestPermission?: () => void;
}

const COLORS = {
  bg: '#000000',
  surface: '#0D0D0D',
  surfaceHover: '#1A1A1A',
  red: '#E53935',
  redDim: '#8B2828',
  text: '#FFFFFF',
  textMuted: '#666666',
  textDim: '#333333',
  border: '#1F1F1F',
};

export function Settings({ onRequestPermission }: SettingsProps) {
  const { settings, updateSettings, state } = usePrivacy();

  const handleToggleEnabled = () => {
    updateSettings((prev: PrivacySettings) => ({ enabled: !prev.enabled }));
  };

  const handleTogglePattern = () => {
    updateSettings((prev: PrivacySettings) => ({ enablePattern: !prev.enablePattern }));
  };

  const handleTogglePersist = () => {
    updateSettings((prev: PrivacySettings) => ({ persistSettings: !prev.persistSettings }));
  };

  const handleIntensityChange = (increase: boolean) => {
    updateSettings((prev: PrivacySettings) => ({ 
      filterIntensity: increase 
        ? Math.min(1, prev.filterIntensity + 0.1)
        : Math.max(0.5, prev.filterIntensity - 0.1)
    }));
  };

  const handleHysteresisChange = (increase: boolean) => {
    updateSettings((prev: PrivacySettings) => ({ 
      hysteresisDelay: increase 
        ? Math.min(2000, prev.hysteresisDelay + 100)
        : Math.max(100, prev.hysteresisDelay - 100)
    }));
  };

  const getStatusText = () => {
    if (!settings.enabled) return 'OFF';
    if (state.isProtected) return 'ACTIVE';
    return 'READY';
  };

  const getStatusColor = () => {
    if (!settings.enabled) return COLORS.textMuted;
    if (state.isProtected) return COLORS.red;
    return COLORS.textMuted;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>PRIVACY</Text>
          <Text style={styles.subtitle}>Screen Protection</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.mainToggle, settings.enabled && styles.mainToggleActive]}
        onPress={handleToggleEnabled}
        activeOpacity={0.8}
      >
        <View style={styles.mainToggleContent}>
          <Text style={styles.mainToggleLabel}>
            {settings.enabled ? 'PROTECTION ON' : 'PROTECTION OFF'}
          </Text>
          <Text style={styles.mainToggleDesc}>
            {settings.enabled 
              ? 'Your screen is being monitored' 
              : 'Tap to enable privacy protection'}
          </Text>
        </View>
        <View style={[
          styles.toggleIndicator,
          settings.enabled && styles.toggleIndicatorActive
        ]}>
          {settings.enabled && <View style={styles.toggleDot} />}
        </View>
      </TouchableOpacity>

      {settings.enabled && (
        <>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Orientation</Text>
              <Text style={styles.statusValue}>
                {state.isViewingOrientation ? 'VIEWING' : 'EXPOSED'}
              </Text>
            </View>
            <View style={styles.statusBar}>
              <View style={[
                styles.statusBarFill, 
                { width: state.isViewingOrientation ? '100%' : '0%' }
              ]} />
            </View>
            <View style={styles.sensorRow}>
              <Text style={styles.sensorLabel}>Pitch</Text>
              <Text style={styles.sensorValue}>{state.orientation.pitch.toFixed(1)}°</Text>
            </View>
            <View style={styles.sensorRow}>
              <Text style={styles.sensorLabel}>Roll</Text>
              <Text style={styles.sensorValue}>{state.orientation.roll.toFixed(1)}°</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OPTIONS</Text>
            
            <View style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.label}>Pattern</Text>
              </View>
              <Switch
                value={settings.enablePattern}
                onValueChange={handleTogglePattern}
                trackColor={{ false: COLORS.surfaceHover, true: COLORS.redDim }}
                thumbColor={settings.enablePattern ? COLORS.red : COLORS.textMuted}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.label}>Remember</Text>
              </View>
              <Switch
                value={settings.persistSettings}
                onValueChange={handleTogglePersist}
                trackColor={{ false: COLORS.surfaceHover, true: COLORS.redDim }}
                thumbColor={settings.persistSettings ? COLORS.red : COLORS.textMuted}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INTENSITY</Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Opacity</Text>
              <Text style={styles.sliderValue}>{(settings.filterIntensity * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.sliderTrack}>
              <View style={[
                styles.sliderFill, 
                { width: `${settings.filterIntensity * 100}%` }
              ]} />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => handleIntensityChange(false)}
                disabled={settings.filterIntensity <= 0.5}
              >
                <Text style={[
                  styles.buttonText,
                  settings.filterIntensity <= 0.5 && styles.buttonTextDisabled
                ]}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => handleIntensityChange(true)}
                disabled={settings.filterIntensity >= 1}
              >
                <Text style={[
                  styles.buttonText,
                  settings.filterIntensity >= 1 && styles.buttonTextDisabled
                ]}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.sliderContainer, styles.sliderMargin]}>
              <Text style={styles.sliderLabel}>Response</Text>
              <Text style={styles.sliderValue}>{settings.hysteresisDelay}ms</Text>
            </View>
            <View style={styles.sliderTrack}>
              <View style={[
                styles.sliderFill, 
                { width: `${(settings.hysteresisDelay / 2000) * 100}%` }
              ]} />
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => handleHysteresisChange(false)}
                disabled={settings.hysteresisDelay <= 100}
              >
                <Text style={[
                  styles.buttonText,
                  settings.hysteresisDelay <= 100 && styles.buttonTextDisabled
                ]}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => handleHysteresisChange(true)}
                disabled={settings.hysteresisDelay >= 2000}
              >
                <Text style={[
                  styles.buttonText,
                  settings.hysteresisDelay >= 2000 && styles.buttonTextDisabled
                ]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Uses device sensors only</Text>
        <Text style={styles.footerText}>No camera • No internet</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingTop: 32,
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
    marginTop: 4,
    letterSpacing: 2,
  },
  statusDot: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  mainToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mainToggleActive: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.surfaceHover,
  },
  mainToggleContent: {
    flex: 1,
  },
  mainToggleLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  mainToggleDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  toggleIndicator: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceHover,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  toggleIndicatorActive: {
    backgroundColor: COLORS.red,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.text,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 1,
  },
  statusBar: {
    height: 4,
    backgroundColor: COLORS.surfaceHover,
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    backgroundColor: COLORS.red,
    borderRadius: 2,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  sensorLabel: {
    fontSize: 11,
    color: COLORS.textDim,
  },
  sensorValue: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textDim,
    letterSpacing: 2,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowContent: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderMargin: {
    marginTop: 20,
  },
  sliderLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  sliderValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'monospace',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: COLORS.surfaceHover,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: COLORS.red,
    borderRadius: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    width: '48%',
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '300',
    color: COLORS.text,
  },
  buttonTextDisabled: {
    color: COLORS.textDim,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 10,
    color: COLORS.textDim,
    letterSpacing: 1,
    marginBottom: 4,
  },
});

export default Settings;
