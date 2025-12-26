Feature: Display Tindeq Progressor device information
  As a climber
  I want to see my Progressor device information
  So that I can monitor battery level and firmware version

  Background:
    Given I am connected to a Progressor device

  Scenario: Display battery level
    When I request the battery status
    Then I should see the battery percentage
    And I should see the battery voltage in millivolts
    And the battery indicator should show the correct level

  Scenario: Display low battery warning
    Given the device battery is below 20%
    When I am using the application
    Then I should see a "Low battery" warning
    And the warning should be prominently displayed

  Scenario: Display firmware version
    When I request the firmware version
    Then I should see the version number in format "X.Y.Z"
    And the version should be displayed in the device info section

  Scenario: Auto-refresh battery status
    Given I am viewing the device info
    When 5 minutes pass
    Then the battery status should automatically refresh
    And I should see the updated battery percentage

  Scenario: Battery status during streaming
    Given the device is streaming data
    When the battery level changes
    Then the battery indicator should update in real-time
    And streaming should continue uninterrupted
