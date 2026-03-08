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

export class SensorServiceClass {
  private accelerometerSubscription: { remove: () => void } | null = null;
  private gyroscopeSubscription: { remove: () => void } | null = null;
  private lastAccelerometerData: SensorData = { x: 0, y: 0, z: 0 };
  private lastGyroscopeData: SensorData = { x: 0, y: 0, z: 0 };
  private isListening = false;
  private callback: OrientationCallback | null = null;

  /**
   * Start listening to accelerometer and gyroscope sensors
   */
  startListening(callback: OrientationCallback): void {
    if (this.isListening) {
      return;
    }

    this.callback = callback;
    this.isListening = true;

    this.accelerometerSubscription = Accelerometer.addListener((data: SensorData) => {
      this.lastAccelerometerData = data;
      this.calculateOrientationInternal();
    });

    this.gyroscopeSubscription = Gyroscope.addListener((data: SensorData) => {
      this.lastGyroscopeData = data;
    });
  }

  /**
   * Stop listening to sensors and clean up resources
   */
  stopListening(): void {
    if (!this.isListening) {
      return;
    }

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
   */
  private calculateOrientationInternal(): void {
    const self = this;
    const { x, y, z } = self.lastAccelerometerData;
    
    // Calculate pitch (rotation around X-axis) - tilt forward/back
    const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
    
    // Calculate roll (rotation around Z-axis) - tilt sideways
    const roll = Math.atan2(-x, z) * (180 / Math.PI);
    
    // Calculate yaw (rotation around Y-axis)
    const yaw = Math.atan2(x, z) * (180 / Math.PI);

    const orientation: DeviceOrientation = {
      pitch,
      roll,
      yaw,
    };

    if (self.callback) {
      self.callback(orientation);
    }
  }

  /**
   * Check if device is in a typical viewing orientation
   */
  static isViewingOrientation(
    orientation: DeviceOrientation,
    thresholds: PrivacyThresholds
  ): boolean {
    const { pitch, roll } = orientation;
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
    const { pitch, roll } = orientation;
    return Math.abs(pitch) < 10 && Math.abs(roll) < 10;
  }

  /**
   * Check for rapid rotation (potential security concern)
   */
  static isRapidRotation(gyroData: SensorData): boolean {
    const threshold = 2.0; // radians per second
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
  getCurrentData(): { accelerometer: SensorData; gyroscope: SensorData } {
    return {
      accelerometer: this.lastAccelerometerData,
      gyroscope: this.lastGyroscopeData,
    };
  }

  /**
   * Check if currently listening
   */
  isActive(): boolean {
    return this.isListening;
  }
}

export const sensorService = new SensorServiceClass();
export default sensorService;
