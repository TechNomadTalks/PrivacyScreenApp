/**
 * Settings Storage Service - Persist and retrieve privacy settings
 * Uses AsyncStorage for local persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrivacySettings, DEFAULT_PRIVACY_SETTINGS } from '../types';

const SETTINGS_KEY = '@privacy_screen_settings';

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
  if (typeof settings.yawThreshold === 'number' && Number.isFinite(settings.yawThreshold)) {
    validated.yawThreshold = settings.yawThreshold;
  }
  if (typeof settings.pitchThresholdMin === 'number' && Number.isFinite(settings.pitchThresholdMin)) {
    validated.pitchThresholdMin = settings.pitchThresholdMin;
  }
  if (typeof settings.pitchThresholdMax === 'number' && Number.isFinite(settings.pitchThresholdMax)) {
    validated.pitchThresholdMax = settings.pitchThresholdMax;
  }
  if (typeof settings.rollThreshold === 'number' && Number.isFinite(settings.rollThreshold)) {
    validated.rollThreshold = settings.rollThreshold;
  }
  if (typeof settings.pitchThresholdViewingMin === 'number' && Number.isFinite(settings.pitchThresholdViewingMin)) {
    validated.pitchThresholdViewingMin = settings.pitchThresholdViewingMin;
  }
  if (typeof settings.pitchThresholdViewingMax === 'number' && Number.isFinite(settings.pitchThresholdViewingMax)) {
    validated.pitchThresholdViewingMax = settings.pitchThresholdViewingMax;
  }
  if (typeof settings.eyeOpenThreshold === 'number' && Number.isFinite(settings.eyeOpenThreshold)) {
    validated.eyeOpenThreshold = Math.max(0, Math.min(1, settings.eyeOpenThreshold));
  }
  if (typeof settings.persistSettings === 'boolean') {
    validated.persistSettings = settings.persistSettings;
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
