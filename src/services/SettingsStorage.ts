/**
 * Settings Storage Service - Persist and retrieve privacy settings
 * Uses AsyncStorage for local persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrivacySettings, DEFAULT_PRIVACY_SETTINGS, CalibrationData, DEFAULT_CALIBRATION } from '../types';

const SETTINGS_KEY = '@diyprivacy_settings';

function validateSettings(obj: unknown): PrivacySettings {
  if (!obj || typeof obj !== 'object') {
    return DEFAULT_PRIVACY_SETTINGS;
  }

  const settings = obj as Record<string, unknown>;
  const validated: Partial<PrivacySettings> = {};

  if (typeof settings.enabled === 'boolean') {
    validated.enabled = settings.enabled;
  }
  if (typeof settings.filterIntensity === 'number' && Number.isFinite(settings.filterIntensity)) {
    validated.filterIntensity = Math.max(0, Math.min(1, settings.filterIntensity));
  }
  if (typeof settings.enablePattern === 'boolean') {
    validated.enablePattern = settings.enablePattern;
  }
  if (typeof settings.hysteresisDelay === 'number' && Number.isFinite(settings.hysteresisDelay)) {
    validated.hysteresisDelay = Math.max(0, Math.min(5000, settings.hysteresisDelay));
  }
  if (typeof settings.hysteresisDisableDelay === 'number' && Number.isFinite(settings.hysteresisDisableDelay)) {
    validated.hysteresisDisableDelay = Math.max(0, Math.min(5000, settings.hysteresisDisableDelay));
  }
  if (typeof settings.persistSettings === 'boolean') {
    validated.persistSettings = settings.persistSettings;
  }

  if (settings.calibration && typeof settings.calibration === 'object') {
    const calib = settings.calibration as Record<string, unknown>;
    const calibValidated: Partial<CalibrationData> = {};
    
    if (Array.isArray(calib.profiles)) {
      calibValidated.profiles = calib.profiles.map((p: unknown) => {
        const profile = p as Record<string, unknown>;
        return {
          id: String(profile.id || ''),
          name: String(profile.name || ''),
          pitchMin: Number(profile.pitchMin) || 0,
          pitchMax: Number(profile.pitchMax) || 0,
          rollMin: Number(profile.rollMin) || 0,
          rollMax: Number(profile.rollMax) || 0,
          pitchCenter: Number(profile.pitchCenter) || 0,
          rollCenter: Number(profile.rollCenter) || 0,
        };
      });
    }
    if (typeof calib.isCalibrated === 'boolean') {
      calibValidated.isCalibrated = calib.isCalibrated;
    }
    if (typeof calib.activeProfileId === 'string' || calib.activeProfileId === null) {
      calibValidated.activeProfileId = calib.activeProfileId;
    }
    
    validated.calibration = { ...DEFAULT_CALIBRATION, ...calibValidated };
  }

  return { ...DEFAULT_PRIVACY_SETTINGS, ...validated };
}

export class SettingsStorage {
  /**
   * Save settings to persistent storage
   */
  static async saveSettings(settings: PrivacySettings): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(settings);
      await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
      return true;
    } catch (error) {
      console.error('[SettingsStorage] Failed to save settings:', error);
      return false;
    }
  }

  /**
   * Load settings from persistent storage
   */
  static async loadSettings(): Promise<PrivacySettings> {
    try {
      const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
      if (jsonValue !== null) {
        const parsed = JSON.parse(jsonValue);
        return validateSettings(parsed);
      }
      return DEFAULT_PRIVACY_SETTINGS;
    } catch (error) {
      console.error('[SettingsStorage] Failed to load settings:', error);
      return DEFAULT_PRIVACY_SETTINGS;
    }
  }

  /**
   * Clear all stored settings
   */
  static async clearSettings(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
      return true;
    } catch (error) {
      console.error('[SettingsStorage] Failed to clear settings:', error);
      return false;
    }
  }

  /**
   * Check if settings exist in storage
   */
  static async hasSettings(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(SETTINGS_KEY);
      return value !== null;
    } catch (error) {
      return false;
    }
  }
}

export default SettingsStorage;
