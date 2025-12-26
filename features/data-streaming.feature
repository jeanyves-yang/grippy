Feature: Stream real-time force data from Tindeq Progressor
  As a climber
  I want to see real-time force measurements from my Progressor
  So that I can monitor my grip strength during training

  Background:
    Given I am connected to a Progressor device
    And the device is calibrated

  Scenario: Start streaming force data
    When I click the "Start Measurement" button
    Then the device should start streaming data
    And I should see real-time force values updating
    And the graph should display the force curve
    And the "Pause" button should be enabled

  Scenario: Pause streaming force data
    Given the device is streaming data
    When I click the "Pause" button
    Then the data streaming should pause
    And the graph should freeze at the current state
    And the "Resume" button should be visible
    And the "Stop" button should remain enabled

  Scenario: Resume streaming force data
    Given the device streaming is paused
    When I click the "Resume" button
    Then the data streaming should resume
    And the graph should continue from where it paused
    And the "Pause" button should be visible again

  Scenario: Stop streaming force data
    Given the device is streaming data
    When I click the "Stop" button
    Then the device should stop streaming data
    And the final force values should be displayed
    And the graph should show the complete session

  Scenario: Stop while paused
    Given the device streaming is paused
    When I click the "Stop" button
    Then the device should stop streaming data
    And the session should be finalized
    And the graph should show the complete session up to the pause point

  Scenario: Receive and parse force measurements
    Given the device is streaming data
    When the device sends a force measurement of 50.5 kg
    Then the displayed value should show "50.5 kg"
    And the graph should update with the new data point

  Scenario: Handle streaming errors
    Given the device is streaming data
    When the Bluetooth connection is lost
    Then streaming should stop automatically
    And I should see "Connection lost" error message
    And the partial data should be preserved

  Scenario: Display peak force
    Given the device is streaming data
    When I complete a hang
    And I click "Stop Measurement"
    Then I should see the peak force value
    And the peak should be highlighted on the graph

  Scenario: Pause does not affect connection
    Given the device is streaming data
    When I click the "Pause" button
    Then the Bluetooth connection should remain active
    And the device should continue sending data
    But the UI should not display new data points until resumed
