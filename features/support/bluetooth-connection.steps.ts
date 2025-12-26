import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from 'vitest';
import { TindeqClient, ConnectionState } from '../../src/lib/tindeq-client.ts';

interface World {
  client: TindeqClient;
  connectionState: ConnectionState;
  error: Error | null;
  webBluetoothAvailable: boolean;
  mockDevice: any;
  mockServer: any;
  mockCharacteristic: any;
}

// Mock Web Bluetooth API setup
function setupMockBluetooth(world: World) {
  world.mockCharacteristic = {
    writeValue: () => Promise.resolve(),
    startNotifications: () => Promise.resolve(),
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  const mockService = {
    getCharacteristic: () => Promise.resolve(world.mockCharacteristic),
  };

  world.mockServer = {
    connected: true,
    getPrimaryService: () => Promise.resolve(mockService),
    disconnect: () => {},
  };

  world.mockDevice = {
    gatt: {
      connect: () => Promise.resolve(world.mockServer),
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  // Mock navigator.bluetooth using Object.defineProperty
  if (typeof global !== 'undefined') {
    Object.defineProperty(global, 'navigator', {
      writable: true,
      configurable: true,
      value: {
        bluetooth: {
          requestDevice: () => Promise.resolve(world.mockDevice),
        },
      },
    });
  }
}

function teardownMockBluetooth() {
  if (typeof global !== 'undefined' && 'navigator' in global) {
    delete (global as any).navigator;
  }
}

Before(function(this: World) {
  this.client = new TindeqClient();
  this.connectionState = ConnectionState.DISCONNECTED;
  this.error = null;
  this.webBluetoothAvailable = true;

  setupMockBluetooth(this);

  this.client.setConnectionStateCallback((state) => {
    this.connectionState = state;
  });

  this.client.setErrorCallback((error) => {
    this.error = error;
  });
});

After(function(this: World) {
  teardownMockBluetooth();
});

// Background steps
Given('the Web Bluetooth API is available', function(this: World) {
  this.webBluetoothAvailable = true;
  setupMockBluetooth(this);
});

Given('the Web Bluetooth API is not available', function(this: World) {
  this.webBluetoothAvailable = false;
  (global as any).navigator = {};
});

Given('the Tindeq Progressor is powered on', function(this: World) {
  // Mock device is already set up and available
});

Given('the device is within Bluetooth range', function(this: World) {
  // Mock device is reachable
});

// Connection scenarios - match only Connect Device or Disconnect
When(/^I click the "(Connect Device|Disconnect)" button$/, async function(this: World, buttonText: string) {
  if (buttonText === 'Connect Device') {
    // Don't actually connect yet - just initiate the request
    // The actual connection happens in "select device" or fails in "cancel" step
  } else if (buttonText === 'Disconnect') {
    await this.client.disconnect();
  }
});

Then('I should see a Bluetooth device picker', function(this: World) {
  // In real browser, requestDevice shows a picker
  // Mock automatically resolves
  expect((global as any).navigator.bluetooth).toBeDefined();
});

When('I select the Progressor device from the list', async function(this: World) {
  // User selected device from picker - now actually connect
  try {
    await this.client.connect();
  } catch (error) {
    this.error = error as Error;
  }
});

When('I cancel the Bluetooth device picker', async function(this: World) {
  // Simulate user cancellation - need to update mock before calling connect again
  Object.defineProperty(global, 'navigator', {
    writable: true,
    configurable: true,
    value: {
      bluetooth: {
        requestDevice: () => Promise.reject(new Error('User cancelled device selection')),
      },
    },
  });

  try {
    await this.client.connect();
  } catch (error) {
    this.error = error as Error;
  }
});

Then('the device should connect successfully', function(this: World) {
  expect(this.connectionState).toBe(ConnectionState.CONNECTED);
});

Then('I should see {string} message', function(this: World, message: string) {
  // UI will display this message based on connection state
  if (message === 'Connected to Progressor') {
    expect(this.connectionState).toBe(ConnectionState.CONNECTED);
  } else if (message === 'Disconnected') {
    expect(this.connectionState).toBe(ConnectionState.DISCONNECTED);
  }
});

Then('the connection status should be {string}', function(this: World, status: string) {
  expect(this.connectionState).toBe(status as ConnectionState);
});

Then('the connection status should remain {string}', function(this: World, status: string) {
  expect(this.connectionState).toBe(status as ConnectionState);
});

Then('I should not see any error message', function(this: World) {
  // Error should be about user cancellation, not a real error to show user
  if (this.error) {
    expect(this.error.message).toContain('User cancelled');
  }
});

When('I visit the application', function(this: World) {
  // Application loaded
});

Then('I should see {string} warning', function(this: World, warningText: string) {
  expect(TindeqClient.isWebBluetoothSupported()).toBe(false);
});

Then('the {string} button should be disabled', function(this: World, buttonText: string) {
  expect(TindeqClient.isWebBluetoothSupported()).toBe(false);
});

Given('I am connected to a Progressor device', async function(this: World) {
  setupMockBluetooth(this);
  await this.client.connect();
  expect(this.connectionState).toBe(ConnectionState.CONNECTED);
});

Then('the device should disconnect successfully', function(this: World) {
  expect(this.connectionState).toBe(ConnectionState.DISCONNECTED);
});

// Already paired scenarios
When('I view the connection section', function(this: World) {
  // User is viewing the UI
});

Then('I should see the device is {string}', function(this: World, status: string) {
  expect(this.connectionState).toBe(status as ConnectionState);
});

Then('I should see the {string} button', function(this: World, buttonText: string) {
  // UI should show this button based on connection state
  if (buttonText === 'Disconnect') {
    expect(this.connectionState).toBe(ConnectionState.CONNECTED);
  }
});

Then('I should not see the {string} button', function(this: World, buttonText: string) {
  // UI should hide this button based on connection state
  if (buttonText === 'Connect Device') {
    expect(this.connectionState).toBe(ConnectionState.CONNECTED);
  }
});

When('the connection is already active', function(this: World) {
  expect(this.connectionState).toBe(ConnectionState.CONNECTED);
});

Then('attempting to connect again should be prevented', async function(this: World) {
  try {
    await this.client.connect();
    throw new Error('Should have thrown error');
  } catch (error) {
    expect((error as Error).message).toContain('Already connected');
  }
});

Then('I should see an appropriate message', function(this: World) {
  // Error message should indicate already connected or connecting
  if (this.error) {
    expect(this.error.message).toMatch(/Already connected|connecting/);
  }
  // Or UI prevents the button from being clicked
});
