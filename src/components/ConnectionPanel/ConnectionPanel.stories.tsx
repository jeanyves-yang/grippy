import type { Meta, StoryObj } from '@storybook/react'
import { ConnectionPanel } from './ConnectionPanel'
import { ConnectionState } from '../../lib/tindeq-client'

const meta = {
  title: 'Components/ConnectionPanel',
  component: ConnectionPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ConnectionPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Disconnected: Story = {
  args: {
    connectionState: ConnectionState.DISCONNECTED,
    isBluetoothSupported: true,
    onConnect: () => console.log('Connect clicked'),
    onDisconnect: () => console.log('Disconnect clicked'),
    error: null,
  },
}

export const Connecting: Story = {
  args: {
    connectionState: ConnectionState.CONNECTING,
    isBluetoothSupported: true,
    onConnect: () => console.log('Connect clicked'),
    onDisconnect: () => console.log('Disconnect clicked'),
    error: null,
  },
}

export const Connected: Story = {
  args: {
    connectionState: ConnectionState.CONNECTED,
    isBluetoothSupported: true,
    onConnect: () => console.log('Connect clicked'),
    onDisconnect: () => console.log('Disconnect clicked'),
    error: null,
  },
}

export const WithError: Story = {
  args: {
    connectionState: ConnectionState.DISCONNECTED,
    isBluetoothSupported: true,
    onConnect: () => console.log('Connect clicked'),
    onDisconnect: () => console.log('Disconnect clicked'),
    error: 'Failed to connect to device',
  },
}

export const BluetoothNotSupported: Story = {
  args: {
    connectionState: ConnectionState.DISCONNECTED,
    isBluetoothSupported: false,
    onConnect: () => console.log('Connect clicked'),
    onDisconnect: () => console.log('Disconnect clicked'),
    error: null,
  },
}
