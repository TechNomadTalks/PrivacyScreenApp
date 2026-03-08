/**
 * Sensor Service - Handles accelerometer for device orientation
 * 
 * SECURITY: All processing is done locally on-device. No data is sent to any server.
 */

import { Accelerometer } from "expo-sensors";
import { DeviceOrientation, PrivacyThresholds } from "../types";

type OrientationCallback = (orientation: DeviceOrientation) => void;

interface SensorData {
  x: number;
  y: number;
  z: number;
}

const SENSOR_DATA_MAX_VALUE = 50;
const MIN_SENSOR_UPDATE_INTERVAL = 50;

export class SensorServiceClass {
  private accelerometerSubscription: { remove: () => void } | null = null;
  private lastAccelerometerData: SensorData = { x: 0, y: 0, z: 0 };
  private isListening = false;
  private callback: OrientationCallback | null = null;
  private lastUpdateTime = 0;
  private instanceId: string;

  constructor() {
    this.instanceId = Math.random().toString(36).substring(2, 15);
  }

  private isValidSensorData(data: SensorData): boolean {
    return (
      data !== undefined &&
      data !== null &&
      typeof data.x === 'number' &&
      typeof data.y === 'number' &&
      typeof data.z === 'number' &&
      !isNaN(data.x) &&
      !isNaN(data.y) &&
      !isNaN(data.z) &&
      Math.abs(data.x) <= SENSOR_DATA_MAX_VALUE &&
      Math.abs(data.y) <= SENSOR_DATA_MAX_VALUE &&
      Math.abs(data.z) <= SENSOR_DATA_MAX_VALUE
    );
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  startListening(callback: OrientationCallback): boolean {
    if (this.isListening) {
      return false;
    }

    if (typeof callback !== 'function') {
      console.error(`[SensorService:${this.instanceId}] Invalid callback provided`);
      return false;
    }

    this.callback = callback;
    this.isListening = true;
    this.lastUpdateTime = Date.now();

    try {
      this.accelerometerSubscription = Accelerometer.addListener((data: SensorData) => {
        if (!this.isValidSensorData(data)) {
          return;
        }
        
        this.lastAccelerometerData = {
          x: this.clamp(data.x, -SENSOR_DATA_MAX_VALUE, SENSOR_DATA_MAX_VALUE),
          y: this.clamp(data.y, -SENSOR_DATA_MAX_VALUE, SENSOR_DATA_MAX_VALUE),
          z: this.clamp(data.z, -SENSOR_DATA_MAX_VALUE, SENSOR_DATA_MAX_VALUE),
        };
        this.calculateOrientationInternal();
      });

      return true;
    } catch (error) {
      console.error(`[SensorService:${this.instanceId}] Failed to start sensors:`, error);
      this.cleanup();
      return false;
    }
  }

  stopListening(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }

    this.isListening = false;
    this.callback = null;
  }

  private calculateOrientationInternal(): void {
    const now = Date.now();
    if (now - this.lastUpdateTime < MIN_SENSOR_UPDATE_INTERVAL) {
      return;
    }
    this.lastUpdateTime = now;

    const self = this;
    const { x, y, z } = self.lastAccelerometerData;
    
    if (!this.isValidSensorData({ x, y, z })) {
      return;
    }
    
    const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
    const roll = Math.atan2(-x, z) * (180 / Math.PI);
    const yaw = Math.atan2(x, z) * (180 / Math.PI);

    if (!isFinite(pitch) || !isFinite(roll) || !isFinite(yaw)) {
      return;
    }

    const orientation: DeviceOrientation = {
      pitch: this.clamp(pitch, -90, 90),
      roll: this.clamp(roll, -180, 180),
      yaw: this.clamp(yaw, -180, 180),
    };

    if (self.callback) {
      try {
        self.callback(orientation);
      } catch (error) {
        console.error(`[SensorService:${this.instanceId}] Callback error:`, error);
      }
    }
  }

  static isViewingOrientation(
    orientation: DeviceOrientation,
    thresholds: PrivacyThresholds
  ): boolean {
    if (!orientation || !thresholds) {
      return false;
    }

    const { pitch, roll } = orientation;
    
    if (!isFinite(pitch) || !isFinite(roll)) {
      return false;
    }

    const pitchInRange =
      pitch >= thresholds.pitchThresholdViewingMin &&
      pitch <= thresholds.pitchThresholdViewingMax;
    const rollInRange =
      roll >= -thresholds.rollThreshold &&
      roll <= thresholds.rollThreshold;
    return pitchInRange && rollInRange;
  }

  static isDeviceFlat(orientation: DeviceOrientation): boolean {
    if (!orientation) {
      return false;
    }
    
    const { pitch, roll } = orientation;
    
    if (!isFinite(pitch) || !isFinite(roll)) {
      return false;
    }
    
    return Math.abs(pitch) < 10 && Math.abs(roll) < 10;
  }

  getCurrentData(): { accelerometer: SensorData } | null {
    if (!this.isListening) {
      return null;
    }
    return {
      accelerometer: { ...this.lastAccelerometerData },
    };
  }

  isActive(): boolean {
    return this.isListening;
  }

  reset(): void {
    this.cleanup();
    this.lastAccelerometerData = { x: 0, y: 0, z: 0 };
    this.lastUpdateTime = 0;
  }
}

export function createSensorService(): SensorServiceClass {
  return new SensorServiceClass();
}

export const sensorService = new SensorServiceClass();
export default sensorService;
