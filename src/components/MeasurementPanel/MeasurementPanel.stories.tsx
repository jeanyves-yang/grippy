import type { Meta, StoryObj } from '@storybook/react'
import { MeasurementPanel } from './MeasurementPanel'
import { StreamState } from '../../lib/tindeq-client'

const meta = {
  title: 'Components/MeasurementPanel',
  component: MeasurementPanel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MeasurementPanel>

export default meta
type Story = StoryObj<typeof meta>

const mockMeasurements = Array.from({ length: 50 }, (_, i) => ({
  weight: Math.sin(i / 10) * 20 + 25,
  timestamp: Date.now() - (50 - i) * 100,
}))

export const Idle: Story = {
  args: {
    currentWeight: 0,
    peakWeight: 0,
    measurements: [],
    streamState: StreamState.IDLE,
    onStart: () => console.log('Start clicked'),
    onPause: () => console.log('Pause clicked'),
    onResume: () => console.log('Resume clicked'),
    onStop: () => console.log('Stop clicked'),
  },
}

export const Streaming: Story = {
  args: {
    currentWeight: 42.5,
    peakWeight: 52.3,
    measurements: mockMeasurements,
    streamState: StreamState.STREAMING,
    onStart: () => console.log('Start clicked'),
    onPause: () => console.log('Pause clicked'),
    onResume: () => console.log('Resume clicked'),
    onStop: () => console.log('Stop clicked'),
  },
}

export const Paused: Story = {
  args: {
    currentWeight: 38.2,
    peakWeight: 52.3,
    measurements: mockMeasurements.slice(0, 30),
    streamState: StreamState.PAUSED,
    onStart: () => console.log('Start clicked'),
    onPause: () => console.log('Pause clicked'),
    onResume: () => console.log('Resume clicked'),
    onStop: () => console.log('Stop clicked'),
  },
}

export const WithData: Story = {
  args: {
    currentWeight: 0,
    peakWeight: 52.3,
    measurements: mockMeasurements,
    streamState: StreamState.IDLE,
    onStart: () => console.log('Start clicked'),
    onPause: () => console.log('Pause clicked'),
    onResume: () => console.log('Resume clicked'),
    onStop: () => console.log('Stop clicked'),
  },
}
