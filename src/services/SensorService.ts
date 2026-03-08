/**
 * Sensor Service - Handles accelerometer and gyroscope for device orientation
 * 
 * SECURITY: All processing is done locally on-device. No data is sent to any server.
 */

import { Accelerometer, Gyroscope } from "expo-sensors";
import { DeviceOrientation, PrivacyThresholds } from "../types";

type OrientationCallback = (orientation: DeviceOrientation) => void;

interface SensorData {
  x: number;
  y: number;
  z: number;
}

const SENSOR_DATA_MAX_VALUE = 50; // Maximum expected sensor value (in g-force roughly)
const MIN_SENSOR_UPDATE_INTERVAL = 50; // Minimum ms between updates (rate limiting)

export class SensorServiceClass {
  private accelerometerSubscription: { remove: () => void } | null = null;
  private gyroscopeSubscription: { remove: () => void } | null = null;
  private lastAccelerometerData: SensorData = { x: 0, y: 0, z: 0 };
  private lastGyroscopeData: SensorData = { x: 0, y: 0, z: 0 };
  private isListening = false;
  private callback: OrientationCallback | null = null;
  private lastUpdateTime = 0;
  private instanceId: string;

  constructor() {
    this.instanceId = Math.random().toString(36).substring(2, 15);
  }

  /**
   * Validate sensor data is within expected bounds
   */
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

  /**
   * Clamp value to safe range
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Start listening to accelerometer and gyroscope sensors
   */
  startListening(callback: OrientationCallback): boolean {
    if (this.isListening) {
      console.log(`[SensorService:${this.instanceId}] Already listening`);
      return false;
    }

    // Validate callback
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
          console.warn(`[SensorService:${this.instanceId}] Invalid sensor data received`);
          return;
        }
        
        this.lastAccelerometerData = {
          x: this.clamp(data.x, -SENSOR_DATA_MAX_VALUE, SENSOR_DATA_MAX_VALUE),
          y: this.clamp(data.y, -SENSOR_DATA_MAX_VALUE, SENSOR_DATA_MAX_VALUE),
          z: this.clamp(data.z, -SENSOR_DATA_MAX_VALUE, SENSOR_DATA_MAX_VALUE),
        };
        this.calculateOrientationInternal();
      });

      this.gyroscopeSubscription = Gyroscope.addListener((data: SensorData) => {
        if (!this.isValidSensorData(data)) {
          return;
        }
        
        this.lastGyroscopeData = {
          x: this.clamp(data.x, -SENSOR_DATA_MAX_VALUE, SENSOR_DATA_MAX_VALUE),
          y: this.clamp(data.y, -SENSOR_DATA_MAX_VALUE, SENSOR_DATA_MAX_VALUE),
          z: this.clamp(data.z, -SENSOR_DATA_MAX_VALUE, SENSOR_DATA_MAX_VALUE),
        };
      });

      console.log(`[SensorService:${this.instanceId}] Started listening`);
      return true;
    } catch (error) {
      console.error(`[SensorService:${this.instanceId}] Failed to start sensors:`, error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Stop listening to sensors and clean up resources
   */
  stopListening(): void {
    this.cleanup();
    console.log(`[SensorService:${this.instanceId}] Stopped listening`);
  }

  private cleanup(): void {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }

    if (this.gyroscopeSubscription) {
      this.gyroscopeSubscription.remove();
      this.gyroscopeSubscription = null;
    }

    this.isListening = false;
    this.callback = null;
  }

  /**
   * Calculate orientation from accelerometer data
   * Uses gravity vector to determine pitch and roll
   * Includes rate limiting
   */
  private calculateOrientationInternal(): void {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastUpdateTime < MIN_SENSOR_UPDATE_INTERVAL) {
      return;
    }
    this.lastUpdateTime = now;

    const self = this;
    const { x, y, z } = self.lastAccelerometerData;
    
    // Validate data before calculation
    if (!this.isValidSensorData({ x, y, z })) {
      return;
    }
    
    // Calculate pitch (rotation around X-axis) - tilt forward/back
    const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
    
    // Calculate roll (rotation around Z-axis) - tilt sideways
    const roll = Math.atan2(-x, z) * (180 / Math.PI);
    
    // Calculate yaw (rotation around Y-axis)
    const yaw = Math.atan2(x, z) * (180 / Math.PI);

    // Validate calculated values
    if (!isFinite(pitch) || !isFinite(roll) || !isFinite(yaw)) {
      console.warn(`[SensorService:${this.instanceId}] Invalid orientation calculated`);
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

  /**
   * Check if device is in a typical viewing orientation
   */
  static isViewingOrientation(
    orientation: DeviceOrientation,
    thresholds: PrivacyThresholds
  ): boolean {
    if (!orientation || !thresholds) {
      return false;
    }

    const { pitch, roll } = orientation;
    
    // Validate inputs
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

  /**
   * Check if device is likely flat on a table
   */
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

  /**
   * Check for rapid rotation (potential security concern)
   */
  static isRapidRotation(gyroData: SensorData): boolean {
    if (!gyroData) {
      return false;
    }

    const threshold = 2.0; // radians per second
    
    if (!isFinite(gyroData.x) || !isFinite(gyroData.y) || !isFinite(gyroData.z)) {
      return false;
    }

    const magnitude = Math.sqrt(
      gyroData.x * gyroData.x +
      gyroData.y * gyroData.y +
      gyroData.z * gyroData.z
    );
    return magnitude > threshold;
  }

  /**
   * Get current sensor readings
   */
  getCurrentData(): { accelerometer: SensorData; gyroscope: SensorData } | null {
    if (!this.isListening) {
      return null;
    }
    return {
      accelerometer: { ...this.lastAccelerometerData },
      gyroscope: { ...this.lastGyroscopeData },
    };
  }

  /**
   * Check if currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Get instance ID (for debugging)
   */
  getInstanceId(): string {
    return this.instanceId;
  }

  /**
   * Reset the service (useful when app comes back from background)
   */
  reset(): void {
    this.cleanup();
    this.lastAccelerometerData = { x: 0, y: 0, z: 0 };
    this.lastGyroscopeData = { x: 0, y: 0, z: 0 };
    this.lastUpdateTime = 0;
  }
}

// Factory function to create new instances instead of singleton
export function createSensorService(): SensorServiceClass {
  return new SensorServiceClass();
}

// Default singleton instance for backwards compatibility
export const sensorService = new SensorServiceClass();
export default sensorService;
