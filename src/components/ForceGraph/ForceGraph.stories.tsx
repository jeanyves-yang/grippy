import type { Meta, StoryObj } from '@storybook/react'
import { ForceGraph } from './ForceGraph'

const meta = {
  title: 'Components/ForceGraph',
  component: ForceGraph,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ForceGraph>

export default meta
type Story = StoryObj<typeof meta>

// Generate realistic hang simulation data
const generateHangData = (duration: number = 6, peakForce: number = 45) => {
  const measurements = []
  const samples = duration * 100 // 100 samples per second

  for (let i = 0; i < samples; i++) {
    const t = i / 100 // Time in seconds
    let weight = 0

    if (t < 1) {
      // Ramp up (0-1s)
      weight = (t / 1) * peakForce
    } else if (t < duration - 1) {
      // Hold with natural variation (1-5s)
      const variation = Math.sin(t * 10) * 2 + Math.random() * 1.5
      weight = peakForce + variation
    } else {
      // Release (5-6s)
      weight = peakForce * (1 - (t - (duration - 1)))
    }

    measurements.push({
      weight: Math.max(0, weight),
      timestamp: Date.now() - (samples - i) * 10,
    })
  }

  return measurements
}

export const Empty: Story = {
  args: {
    measurements: [],
  },
}

export const ShortHang: Story = {
  args: {
    measurements: generateHangData(3, 30),
    peakWeight: 30.5,
  },
}

export const NormalHang: Story = {
  args: {
    measurements: generateHangData(6, 45),
    peakWeight: 47.3,
  },
}

export const LongHang: Story = {
  args: {
    measurements: generateHangData(10, 55),
    peakWeight: 56.8,
  },
}

export const HighForce: Story = {
  args: {
    measurements: generateHangData(5, 80),
    peakWeight: 82.1,
  },
}

export const LiveStreaming: Story = {
  args: {
    measurements: generateHangData(2, 35).slice(0, 150), // Partial data (still streaming)
    peakWeight: 35.2,
  },
}
