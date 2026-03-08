/**
 * Settings Storage Service - Persist and retrieve privacy settings
 * Uses AsyncStorage for local persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrivacySettings, DEFAULT_PRIVACY_SETTINGS } from '../types';

const SETTINGS_KEY = '@privacy_screen_settings';

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
        // Validate and merge with defaults to handle any missing fields
        return { ...DEFAULT_PRIVACY_SETTINGS, ...parsed };
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
