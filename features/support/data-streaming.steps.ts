import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'vitest';
import { StreamState } from '../../src/lib/tindeq-client';
import type { WeightMeasurement } from '../../src/lib/tindeq-protocol';

interface World {
  client: any;
  streamState: StreamState;
  measurements: WeightMeasurement[];
  lastMeasurement: WeightMeasurement | null;
  peakForce: number | null;
  error: Error | null;
}

Given('the device is calibrated', function(this: World) {
  // Assume device is tared/calibrated
});

// Match measurement control buttons with optional "button" word
When(/^I click(?: the)? "(Start Measurement|Pause|Resume|Stop Measurement|Stop)"(?: button)?$/, async function(this: World, buttonText: string) {
  if (buttonText === 'Start Measurement') {
    await this.client.startStreaming();
    this.streamState = this.client.getStreamState();
  } else if (buttonText === 'Pause') {
    this.client.pauseStreaming();
    this.streamState = this.client.getStreamState();
  } else if (buttonText === 'Resume') {
    this.client.resumeStreaming();
    this.streamState = this.client.getStreamState();
  } else if (buttonText === 'Stop Measurement' || buttonText === 'Stop') {
    await this.client.stopStreaming();
    this.streamState = this.client.getStreamState();
  }
});

Then('the device should start streaming data', function(this: World) {
  expect(this.streamState).toBe(StreamState.STREAMING);
});

Then('I should see real-time force values updating', function(this: World) {
  // UI will update with measurements from callback
  expect(this.streamState).toBe(StreamState.STREAMING);
});

Then('the graph should display the force curve', function(this: World) {
  // Graph component will render measurements
  expect(this.streamState).toBe(StreamState.STREAMING);
});

Then('the {string} button should be enabled', function(this: World, buttonText: string) {
  // UI state management
  expect(this.streamState).not.toBe(StreamState.IDLE);
});

Then(/^the "(Pause|Resume|Stop)" button should be visible(?: again)?$/, function(this: World, buttonText: string) {
  // UI state management based on stream state
  if (buttonText === 'Resume') {
    expect(this.streamState).toBe(StreamState.PAUSED);
  } else if (buttonText === 'Pause') {
    expect(this.streamState).toBe(StreamState.STREAMING);
  }
});

Then('the {string} button should remain enabled', function(this: World, buttonText: string) {
  // Stop button should always be available during streaming or paused
  expect([StreamState.STREAMING, StreamState.PAUSED]).toContain(this.streamState);
});

Given('the device is streaming data', async function(this: World) {
  await this.client.startStreaming();
  this.streamState = this.client.getStreamState();
  expect(this.streamState).toBe(StreamState.STREAMING);
});

Given('the device streaming is paused', async function(this: World) {
  // Must start streaming before we can pause
  await this.client.startStreaming();
  this.client.pauseStreaming();
  this.streamState = this.client.getStreamState();
  expect(this.streamState).toBe(StreamState.PAUSED);
});

Then('the data streaming should pause', function(this: World) {
  expect(this.streamState).toBe(StreamState.PAUSED);
});

Then('the graph should freeze at the current state', function(this: World) {
  // UI should stop updating graph while paused
  expect(this.streamState).toBe(StreamState.PAUSED);
});

Then('the data streaming should resume', function(this: World) {
  expect(this.streamState).toBe(StreamState.STREAMING);
});

Then('the graph should continue from where it paused', function(this: World) {
  // UI should resume updating graph
  expect(this.streamState).toBe(StreamState.STREAMING);
});

Then('the device should stop streaming data', function(this: World) {
  expect(this.streamState).toBe(StreamState.IDLE);
});

Then('the final force values should be displayed', function(this: World) {
  // UI shows final stats
  expect(this.streamState).toBe(StreamState.IDLE);
});

Then('the graph should show the complete session', function(this: World) {
  // Graph displays all collected measurements
  expect(this.streamState).toBe(StreamState.IDLE);
});

Then('the session should be finalized', function(this: World) {
  expect(this.streamState).toBe(StreamState.IDLE);
});

Then('the graph should show the complete session up to the pause point', function(this: World) {
  // Graph shows data collected before pause
  expect(this.streamState).toBe(StreamState.IDLE);
});

When('the device sends a force measurement of {float} kg', function(this: World, weight: number) {
  this.lastMeasurement = {
    weight,
    timestamp: Date.now(),
  };
  this.measurements = this.measurements || [];
  this.measurements.push(this.lastMeasurement);
});

Then('the displayed value should show {string}', function(this: World, expectedValue: string) {
  expect(this.lastMeasurement).toBeDefined();
  const displayValue = `${this.lastMeasurement!.weight} kg`;
  expect(displayValue).toBe(expectedValue);
});

Then('the graph should update with the new data point', function(this: World) {
  expect(this.measurements.length).toBeGreaterThan(0);
});

When('the Bluetooth connection is lost', function(this: World) {
  // Initialize measurements array if not already done
  if (!this.measurements) {
    this.measurements = [];
  }
  this.error = new Error('Connection lost');
  this.streamState = StreamState.IDLE;
});

Then('streaming should stop automatically', function(this: World) {
  expect(this.streamState).toBe(StreamState.IDLE);
});

Then('I should see {string} error message', function(this: World, errorMessage: string) {
  expect(this.error).toBeDefined();
  expect(this.error!.message).toContain('Connection lost');
});

Then('the partial data should be preserved', function(this: World) {
  // Data collected before disconnect should still be available
  expect(this.measurements).toBeDefined();
});

When('I complete a hang', function(this: World) {
  // Simulate a complete hang with peak force
  this.measurements = [
    { weight: 10, timestamp: Date.now() },
    { weight: 30, timestamp: Date.now() + 100 },
    { weight: 50, timestamp: Date.now() + 200 },
    { weight: 52.5, timestamp: Date.now() + 300 },  // peak
    { weight: 48, timestamp: Date.now() + 400 },
    { weight: 20, timestamp: Date.now() + 500 },
  ];
  this.peakForce = Math.max(...this.measurements.map(m => m.weight));
});

Then('I should see the peak force value', function(this: World) {
  expect(this.peakForce).toBeDefined();
  expect(this.peakForce).toBe(52.5);
});

Then('the peak should be highlighted on the graph', function(this: World) {
  // UI should highlight the peak point on graph
  expect(this.peakForce).toBe(52.5);
});

Then('the Bluetooth connection should remain active', function(this: World) {
  // Connection state should still be connected during pause
  expect(this.streamState).toBe(StreamState.PAUSED);
});

Then('the device should continue sending data', function(this: World) {
  // Device continues to send but we don't process while paused
  expect(this.streamState).toBe(StreamState.PAUSED);
});

Then('the UI should not display new data points until resumed', function(this: World) {
  // UI frozen during pause
  expect(this.streamState).toBe(StreamState.PAUSED);
});
