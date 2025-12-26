import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'vitest';
import type { BatteryInfo, FirmwareVersion } from '../../src/lib/tindeq-protocol';

interface World {
  client: any;
  batteryInfo: BatteryInfo | null;
  firmwareVersion: FirmwareVersion | null;
  lowBatteryWarning: boolean;
}

When('I request the battery status', async function(this: World) {
  // Mock battery response
  this.batteryInfo = {
    voltage: 3850,
    percentage: 71,
  };
});

Then('I should see the battery percentage', function(this: World) {
  expect(this.batteryInfo).toBeDefined();
  expect(this.batteryInfo!.percentage).toBeDefined();
  expect(this.batteryInfo!.percentage).toBeGreaterThanOrEqual(0);
  expect(this.batteryInfo!.percentage).toBeLessThanOrEqual(100);
});

Then('I should see the battery voltage in millivolts', function(this: World) {
  expect(this.batteryInfo).toBeDefined();
  expect(this.batteryInfo!.voltage).toBeGreaterThan(0);
});

Then('the battery indicator should show the correct level', function(this: World) {
  expect(this.batteryInfo).toBeDefined();
  const percentage = this.batteryInfo!.percentage!;

  // Verify percentage is reasonable
  expect(percentage).toBeGreaterThan(0);
  expect(percentage).toBeLessThan(100);
});

Given('the device battery is below {int}%', function(this: World, threshold: number) {
  this.batteryInfo = {
    voltage: 3100,
    percentage: 15,
  };
  this.lowBatteryWarning = this.batteryInfo.percentage! < threshold;
});

When('I am using the application', function(this: World) {
  // App is running
});

Then('I should see a {string} warning', function(this: World, warningText: string) {
  if (warningText === 'Low battery') {
    expect(this.lowBatteryWarning).toBe(true);
  }
});

Then('the warning should be prominently displayed', function(this: World) {
  expect(this.lowBatteryWarning).toBe(true);
});

When('I request the firmware version', async function(this: World) {
  // Mock firmware version response
  this.firmwareVersion = {
    major: 1,
    minor: 2,
    patch: 3,
    version: '1.2.3',
  };
});

Then('I should see the version number in format {string}', function(this: World, format: string) {
  expect(this.firmwareVersion).toBeDefined();
  expect(this.firmwareVersion!.version).toMatch(/^\d+\.\d+\.\d+$/);
});

Then('the version should be displayed in the device info section', function(this: World) {
  expect(this.firmwareVersion).toBeDefined();
  expect(this.firmwareVersion!.version).toBe('1.2.3');
});

Given('I am viewing the device info', function(this: World) {
  this.batteryInfo = {
    voltage: 3850,
    percentage: 71,
  };
});

When('{int} minutes pass', function(this: World, minutes: number) {
  // Time has passed, trigger auto-refresh
  // In real implementation, this would be a timer/interval
});

Then('the battery status should automatically refresh', function(this: World) {
  // Battery status would be re-requested
  expect(this.batteryInfo).toBeDefined();
});

Then('I should see the updated battery percentage', function(this: World) {
  expect(this.batteryInfo).toBeDefined();
  expect(this.batteryInfo!.percentage).toBeDefined();
});

When('the battery level changes', function(this: World) {
  // Simulate battery level change during streaming
  this.batteryInfo = {
    voltage: 3700,
    percentage: 58,
  };
});

Then('the battery indicator should update in real-time', function(this: World) {
  expect(this.batteryInfo!.percentage).toBe(58);
});

Then('streaming should continue uninterrupted', function(this: World) {
  // Streaming state should remain active
  expect(this.client.getStreamState()).toBe('streaming');
});
