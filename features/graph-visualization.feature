Feature: Visualize force data with real-time graph
  As a climber
  I want to see a real-time graph of my force measurements
  So that I can track my performance visually during training

  Background:
    Given I am connected to a Progressor device
    And the device is calibrated

  Scenario: Display empty graph state
    When I view the measurement panel
    Then I should see an empty graph placeholder
    And the placeholder should say "No data yet"
    And the graph area should be the same size as when streaming

  Scenario: Graph updates in real-time during streaming
    Given the device is streaming data
    When force measurements are received
    Then the graph should update immediately
    And I should see a blue line chart
    And the chart should show force on the Y-axis
    And the chart should fill the available space

  Scenario: Graph shows accurate force curve
    Given the device is streaming data
    When I perform a hang (ramp up, hold, release)
    Then the graph should show the ramp-up phase
    And the graph should show the hold phase with variations
    And the graph should show the release phase
    And the curve should be smooth and continuous

  Scenario: Peak force highlighted on graph
    Given I have completed a measurement
    When the measurement data includes a peak force
    Then the peak value should be displayed below the graph
    And the peak should be shown in blue highlighted text

  Scenario: Graph maintains aspect ratio
    When I resize the browser window
    Then the graph should resize responsively
    And the graph should maintain readability
    And all controls should remain visible

  Scenario: Graph tooltips show precise values
    Given the device is streaming data
    When I hover over the graph line
    Then I should see a tooltip
    And the tooltip should show the exact force value in kg
    And the tooltip should be formatted to 2 decimal places

  Scenario: Empty graph has consistent layout
    Given I am viewing an empty measurement panel
    When I click "Start" to begin streaming
    Then the graph should appear without layout shift
    And the stats bar should remain in the same position
    And the control buttons should remain in the same position
