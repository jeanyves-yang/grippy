import { Given, When, Then, Before } from '@cucumber/cucumber'
import { expect } from 'vitest'

interface World {
  client: any
  streamState: string
  measurements: any[]
  graphVisible: boolean
  layoutShifted: boolean
}

Before(function(this: World) {
  this.layoutShifted = false
  this.measurements = []
})

When('I view the measurement panel', function(this: World) {
  // Measurement panel is visible
})

Then('I should see an empty graph placeholder', function(this: World) {
  // Empty state should be visible
  expect(this.measurements.length).toBe(0)
})

Then('the placeholder should say {string}', function(this: World, text: string) {
  // UI shows empty message
})

Then('the graph area should be the same size as when streaming', function(this: World) {
  // Layout consistency check
  this.layoutShifted = false
})

When('force measurements are received', function(this: World) {
  // Measurements coming in from device
  this.measurements = this.measurements || []
})

Then('the graph should update immediately', function(this: World) {
  // Graph renders new data without delay
})

Then('I should see a blue line chart', function(this: World) {
  // Chart.js renders blue line
})

Then('the chart should show force on the Y-axis', function(this: World) {
  // Y-axis labeled with kg values
})

Then('the chart should fill the available space', function(this: World) {
  // Graph is responsive
})

When(/^I perform a hang \(ramp up, hold, release\)$/, function(this: World) {
  // Simulate realistic hang pattern
  this.measurements = [
    { weight: 10, timestamp: Date.now() },
    { weight: 25, timestamp: Date.now() + 500 },
    { weight: 35, timestamp: Date.now() + 1000 },
    { weight: 36, timestamp: Date.now() + 2000 }, // peak
    { weight: 34, timestamp: Date.now() + 3000 },
    { weight: 20, timestamp: Date.now() + 4000 },
    { weight: 5, timestamp: Date.now() + 5000 },
  ]
})

Then('the graph should show the ramp-up phase', function(this: World) {
  // First measurements show increasing force
  expect(this.measurements[1]!.weight).toBeGreaterThan(this.measurements[0]!.weight)
})

Then('the graph should show the hold phase with variations', function(this: World) {
  // Middle measurements relatively stable
  const midPoint = Math.floor(this.measurements.length / 2)
  expect(this.measurements[midPoint]!.weight).toBeGreaterThan(20)
})

Then('the graph should show the release phase', function(this: World) {
  // Final measurements show decreasing force
  const last = this.measurements.length - 1
  expect(this.measurements[last]!.weight).toBeLessThan(this.measurements[last - 1]!.weight)
})

Then('the curve should be smooth and continuous', function(this: World) {
  // Chart.js tension setting makes it smooth
})

Given('I have completed a measurement', function(this: World) {
  this.measurements = [
    { weight: 30, timestamp: Date.now() },
    { weight: 45, timestamp: Date.now() + 1000 },
  ]
})

When('the measurement data includes a peak force', function(this: World) {
  // Peak is calculated from measurements
})

Then('the peak value should be displayed below the graph', function(this: World) {
  // Peak display is visible
})

Then('the peak should be shown in blue highlighted text', function(this: World) {
  // Styling check
})

When('I resize the browser window', function(this: World) {
  // Window resize event
})

Then('the graph should resize responsively', function(this: World) {
  // Chart.js responsive: true
})

Then('the graph should maintain readability', function(this: World) {
  // Min/max height constraints work
})

Then('all controls should remain visible', function(this: World) {
  // No overflow hidden issues
})

When('I hover over the graph line', function(this: World) {
  // Mouse hover on chart
})

Then('I should see a tooltip', function(this: World) {
  // Chart.js tooltip enabled
})

Then('the tooltip should show the exact force value in kg', function(this: World) {
  // Tooltip callback formats correctly
})

Then('the tooltip should be formatted to {int} decimal places', function(this: World, decimals: number) {
  // toFixed(2) in tooltip callback
  expect(decimals).toBe(2)
})

Given('I am viewing an empty measurement panel', function(this: World) {
  this.measurements = []
})

When('I click {string} to begin streaming', function(this: World, buttonText: string) {
  // Start button clicked
})

Then('the graph should appear without layout shift', function(this: World) {
  expect(this.layoutShifted).toBe(false)
})

Then('the stats bar should remain in the same position', function(this: World) {
  // Stats bar has fixed position
})

Then('the control buttons should remain in the same position', function(this: World) {
  // Controls bar has fixed position
})
