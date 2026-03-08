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
  Image,
  Linking,
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
  textMuted: '#AAAAAA',
  border: '#1F1F1F',
};

const SOCIAL_LINKS = {
  github: 'https://github.com/TechNomadTalks',
  linkedin: 'https://linkedin.com/in/technomadtalks',
  tiktok: 'https://tiktok.com/@technomadtalks',
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

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>DIY PRIVACY</Text>
        </View>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.jpeg')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>TechNomadTalks</Text>
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

      <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.statusBadgeText}>{getStatusText()}</Text>
      </View>

      {settings.enabled && (
        <>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabelBold}>ORIENTATION</Text>
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
                <Text style={styles.labelBold}>Pattern</Text>
              </View>
              <Switch
                value={settings.enablePattern}
                onValueChange={handleTogglePattern}
                trackColor={{ false: COLORS.surfaceHover, true: COLORS.red }}
                thumbColor={settings.enablePattern ? '#FFFFFF' : COLORS.textMuted}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.labelBold}>Remember</Text>
              </View>
              <Switch
                value={settings.persistSettings}
                onValueChange={handleTogglePersist}
                trackColor={{ false: COLORS.surfaceHover, true: COLORS.red }}
                thumbColor={settings.persistSettings ? '#FFFFFF' : COLORS.textMuted}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INTENSITY</Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabelBold}>OPACITY</Text>
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
                style={styles.sliderButton}
                onPress={() => handleIntensityChange(false)}
                disabled={settings.filterIntensity <= 0.5}
              >
                <Text style={[
                  styles.sliderButtonText,
                  settings.filterIntensity <= 0.5 && styles.buttonTextDisabled
                ]}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sliderButton}
                onPress={() => handleIntensityChange(true)}
                disabled={settings.filterIntensity >= 1}
              >
                <Text style={[
                  styles.sliderButtonText,
                  settings.filterIntensity >= 1 && styles.buttonTextDisabled
                ]}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.sliderContainer, { marginTop: 20 }]}>
              <Text style={styles.sliderLabelBold}>RESPONSE</Text>
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
                style={styles.sliderButton}
                onPress={() => handleHysteresisChange(false)}
                disabled={settings.hysteresisDelay <= 100}
              >
                <Text style={[
                  styles.sliderButtonText,
                  settings.hysteresisDelay <= 100 && styles.buttonTextDisabled
                ]}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sliderButton}
                onPress={() => handleHysteresisChange(true)}
                disabled={settings.hysteresisDelay >= 2000}
              >
                <Text style={[
                  styles.sliderButtonText,
                  settings.hysteresisDelay >= 2000 && styles.buttonTextDisabled
                ]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerTextBold}>NO CAMERA • NO INTERNET</Text>
        <Text style={styles.footerText}>Uses device sensors only</Text>
      </View>

      <View style={styles.socialContainer}>
        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => openLink(SOCIAL_LINKS.github)}
        >
          <Image 
            source={require('../../assets/icon-github.png')}
            style={styles.socialIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => openLink(SOCIAL_LINKS.linkedin)}
        >
          <Image 
            source={require('../../assets/icon-linkedin.png')}
            style={styles.socialIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.socialButton}
          onPress={() => openLink(SOCIAL_LINKS.tiktok)}
        >
          <Image 
            source={require('../../assets/icon-tiktok.png')}
            style={styles.socialIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 8,
    color: '#888888',
    marginTop: 2,
    letterSpacing: 1,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  mainToggleDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
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
    backgroundColor: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 20,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
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
  statusLabelBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  statusBar: {
    height: 6,
    backgroundColor: COLORS.surfaceHover,
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    backgroundColor: COLORS.red,
    borderRadius: 3,
  },
  sensorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  sensorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  sensorValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.red,
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
  labelBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabelBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sliderValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.red,
    fontFamily: 'monospace',
  },
  sliderTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceHover,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: COLORS.red,
    borderRadius: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sliderButton: {
    width: '48%',
    height: 44,
    backgroundColor: COLORS.red,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#888888',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    marginBottom: 20,
  },
  footerTextBold: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.red,
    letterSpacing: 2,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
});

export default Settings;
