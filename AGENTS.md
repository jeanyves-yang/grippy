# Grippy Development Guide

## Project Overview
PWA for Tindeq Progressor climbing force sensor. Direct Web Bluetooth connection for real-time grip strength tracking. Targets iOS (via Bluefy browser) and desktop Chrome/Edge.

## Architecture

### Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Build**: Vite + PWA plugin
- **Testing**: Vitest (unit) + Cucumber (BDD with Gherkin)
- **Bluetooth**: Custom Web Bluetooth API implementation

### Key Design Decisions
- **No external Bluetooth packages** - Custom implementation for full control
- **BDD-first** - Gherkin scenarios define behavior before code
- **Type-safe** - Strict TypeScript throughout
- **ESM only** - Modern module system, no CommonJS

## File Structure
```
src/lib/tindeq-protocol.ts  # Protocol constants, TLV encoding, parsers
src/lib/tindeq-client.ts     # Bluetooth client class
src/components/              # React components (TBD)
features/*.feature           # Gherkin BDD specs
features/support/*.steps.ts  # Cucumber step definitions
tests/unit/*.test.ts         # Vitest unit tests
```

## Development Workflow

### 1. BDD-First Development
```bash
# 1. Write Gherkin scenario in features/*.feature
# 2. Run and see it fail
npm run test:bdd

# 3. Implement step definition in features/support/*.steps.ts
# 4. Implement code to make it pass
# 5. Verify
npm run test:all
```

### 2. TypeScript Patterns
```typescript
// ✅ Imports without extensions (bundler resolves)
import { TindeqClient } from './lib/tindeq-client'

// ✅ Use enum for protocol constants
export enum CommandTag { TARE_SCALE = 0x64 }

// ✅ Use string unions for states
type StreamState = 'idle' | 'streaming' | 'paused'
```

### 3. Testing Rules
- **Gherkin scenarios** = Source of truth for user-facing behavior
- **Unit tests** = Low-level protocol parsing, edge cases
- **NO redundancy** - Don't test same thing in both

### 4. Cucumber + ESM + TypeScript
```bash
# Runs with tsx loader for TS+ESM support
NODE_OPTIONS='--import tsx/esm' cucumber-js

# Step definitions use regex to avoid ambiguity
When(/^I click the "(Connect|Disconnect)" button$/, ...)
```

## CRITICAL: Spec Synchronization

**After ANY code change affecting behavior:**
1. Update relevant `features/*.feature` scenario FIRST
2. Update step definitions if needed
3. Run `npm run test:all` to verify
4. Commit specs WITH code changes

**The Gherkin files are living documentation.**

## Common Commands
```bash
npm run dev          # Dev server with HMR
npm test             # Unit tests (Vitest)
npm run test:bdd     # BDD scenarios (Cucumber)
npm run test:all     # All tests
npm run build        # Production build
```

## Browser Compatibility
- **Desktop**: Chrome, Edge (native Web Bluetooth)
- **iOS**: Bluefy Browser (Web Bluetooth wrapper)
- **Not supported**: Safari, Firefox
- **Requirements**: HTTPS for Web Bluetooth

## Bluetooth Protocol
- Service: `7e4e1701-1ea6-40c9-9dcc-13d34ffead57`
- TLV encoding (Tag-Length-Value), little-endian
- **Command tags**: 100-111 (decimal: tare=100, start=101, stop=102, battery=111)
- **Response tags**: 0-4 (CMD_RESPONSE=0, WEIGHT=1, RFD_PEAK=2, RFD_SERIES=3, LOW_BATTERY=4)
- **Weight data format**: Batched! 120 bytes = 15 measurements × 8 bytes each (4-byte float32 weight + 4-byte uint32 timestamp)
- **Parse strategy**: Loop through data in 8-byte chunks, extract weight+timestamp pairs
- Pause/resume = client-side (device keeps streaming, we just don't process)

## Next Steps
- [ ] Component architecture (consider Storybook)
- [ ] Real-time chart (Chart.js or Recharts)
- [ ] Session management
- [ ] Data persistence (IndexedDB)
- [ ] PWA icons (need 192x192 and 512x512 PNGs)
