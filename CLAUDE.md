# Grippy - Claude Code Context

## Project Overview
PWA for Tindeq Progressor climbing force sensor. Web Bluetooth API → real-time grip strength data streaming. Target: iOS via Bluefy browser.

## Architecture

### TypeScript Setup
- `moduleResolution: "bundler"` - imports without extensions
- Strict mode enabled, full type safety
- ESM throughout (type: "module" in package.json)

### Testing Strategy (BDD-First)
1. Write Gherkin scenario in `features/*.feature`
2. Implement step definition in `features/support/*.steps.ts`
3. Make scenario pass
4. Add unit tests for complex logic only

**Current Status**: 18 scenarios (118 steps) passing, 49 unit tests passing

### Bluetooth Library
- Custom implementation of Tindeq Progressor API (no external packages)
- TLV (Tag-Length-Value) protocol, little-endian
- `src/lib/tindeq-protocol.ts` - Protocol layer
- `src/lib/tindeq-client.ts` - Client with connection/streaming/pause

## Common Commands

```bash
npm run dev              # Start dev server
npm test                 # Unit tests (Vitest)
npm run test:bdd         # BDD scenarios (Cucumber + tsx)
npm run test:all         # All tests
npm run build            # Production build
```

## Key Patterns

### Imports (No Extensions)
```typescript
import { TindeqClient } from './lib/tindeq-client'  // ✅
```

### Cucumber + ESM + TypeScript
- Runs with: `NODE_OPTIONS='--import tsx/esm' cucumber-js`
- Step definitions use regex to avoid ambiguity
- Example: `/^I click the "(Connect|Disconnect)" button$/`

### State Management
- Connection: `disconnected | connecting | connected | disconnecting`
- Streaming: `idle | streaming | paused`
- Pause keeps connection alive, just freezes UI updates

## Browser Support
- Desktop: Chrome, Edge (Web Bluetooth native)
- iOS: Bluefy Browser only (Safari doesn't support Web Bluetooth)
- Must serve over HTTPS for Web Bluetooth

## Testing Rules
- BDD scenarios = source of truth for behavior
- Unit tests = protocol parsing, edge cases
- NO redundant coverage between BDD and unit tests

### CRITICAL: Spec Synchronization
**After ANY code change that affects behavior:**
1. Check if Gherkin scenarios in `features/*.feature` need updates
2. If implementation adds/changes behavior, update the relevant scenario FIRST
3. Then update step definitions
4. Verify tests pass with `npm run test:all`

**Examples:**
- Add battery warning → Update `device-info.feature` scenario
- Change streaming behavior → Update `data-streaming.feature`
- Modify connection flow → Update `bluetooth-connection.feature`

**The Gherkin files are living documentation. Keep them in sync with code.**

## Next Steps
- [ ] PWA manifest + service worker
- [ ] React UI (connection, streaming controls)
- [ ] Real-time chart visualization
- [ ] Session management + data persistence
