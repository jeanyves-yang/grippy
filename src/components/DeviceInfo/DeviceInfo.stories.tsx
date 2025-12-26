import type { Meta, StoryObj } from '@storybook/react'
import { DeviceInfo } from './DeviceInfo'

const meta = {
  title: 'Components/DeviceInfo',
  component: DeviceInfo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DeviceInfo>

export default meta
type Story = StoryObj<typeof meta>

export const FullBattery: Story = {
  args: {
    battery: {
      voltage: 4200,
      percentage: 100,
    },
  },
}

export const MidBattery: Story = {
  args: {
    battery: {
      voltage: 3600,
      percentage: 50,
    },
  },
}

export const LowBattery: Story = {
  args: {
    battery: {
      voltage: 3100,
      percentage: 15,
    },
  },
}

export const NoBattery: Story = {
  args: {
    battery: null,
  },
}
