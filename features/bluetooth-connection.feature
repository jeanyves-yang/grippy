Feature: Connect to Tindeq Progressor via Bluetooth
  As a climber
  I want to connect my Tindeq Progressor to the web app
  So that I can track my grip strength in real-time

  Background:
    Given the Web Bluetooth API is available
    And the Tindeq Progressor is powered on
    And the device is within Bluetooth range

  Scenario: Successfully discover and connect to Progressor
    When I click the "Connect Device" button
    Then I should see a Bluetooth device picker
    When I select the Progressor device from the list
    Then the device should connect successfully
    And I should see "Connected to Progressor" message
    And the connection status should be "connected"

  Scenario: Handle connection failure
    When I click the "Connect Device" button
    And I cancel the Bluetooth device picker
    Then the connection status should remain "disconnected"
    And I should not see any error message

  Scenario: Web Bluetooth API not available
    Given the Web Bluetooth API is not available
    When I visit the application
    Then I should see "Web Bluetooth not supported" warning
    And the "Connect Device" button should be disabled

  Scenario: Disconnect from device
    Given I am connected to a Progressor device
    When I click the "Disconnect" button
    Then the device should disconnect successfully
    And the connection status should be "disconnected"
    And I should see "Disconnected" message

  Scenario: Show connection status when already paired
    Given I am connected to a Progressor device
    When I view the connection section
    Then I should see the device is "connected"
    And I should see the "Disconnect" button
    And I should not see the "Connect Device" button

  Scenario: Prevent duplicate connection attempts
    Given I am connected to a Progressor device
    When the connection is already active
    Then attempting to connect again should be prevented
    And I should see an appropriate message
