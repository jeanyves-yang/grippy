# BDD Features - Gherkin Specification Guidelines

## Feature Files

### Current Features (27 scenarios)
- `bluetooth-connection.feature` - Connection management (6 scenarios)
- `data-streaming.feature` - Streaming controls (9 scenarios)
- `device-info.feature` - Battery & firmware (5 scenarios)
- `graph-visualization.feature` - Chart display (7 scenarios)

## Writing Gherkin Scenarios

### Structure
```gherkin
Feature: [User-facing capability]
  As a [user type]
  I want to [action]
  So that [benefit]

  Background:
    Given [common precondition]

  Scenario: [Specific behavior]
    Given [initial state]
    When [action]
    Then [expected outcome]
```

### Best Practices

**Do:**
- Write from user perspective
- Use present tense ("I see", not "I should see")
- Be specific about expected behavior
- Keep scenarios focused (one behavior)

**Don't:**
- Test implementation details
- Duplicate unit test coverage
- Use technical jargon users wouldn't understand

## Step Definitions

Location: `features/support/*.steps.ts`

### Patterns
```typescript
// Use regex to avoid ambiguous matches
When(/^I click the "(Connect|Disconnect)" button$/, ...)

// Parameterize values
Then('the displayed value should show {string}', ...)

// Share context via World interface
interface World { client: any, measurements: any[] }
```

### Running Tests
```bash
npm run test:bdd  # Cucumber scenarios
npm run test:all  # All tests (BDD + unit + Storybook)
```

## CRITICAL: Keep Specs in Sync

**After changing behavior:**
1. Update `.feature` file FIRST
2. Update step definitions
3. Run `npm run test:all`
4. Commit specs WITH code

**The Gherkin files are the source of truth.**

## Cucumber Configuration

Using tsx for ESM + TypeScript:
- Command: `NODE_OPTIONS='--import tsx/esm' cucumber-js`
- Config: `cucumber.js` (explicit file imports)
- Step definitions: `features/support/*.steps.ts`

## Coverage Guidelines

**Gherkin scenarios cover:**
- User workflows
- Integration between components
- Error handling user sees
- State transitions

**Unit tests cover:**
- Protocol parsing
- Edge cases
- Math calculations
- Low-level utilities

**No overlap** - Don't test same thing twice!
