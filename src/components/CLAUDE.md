# Components - Development Guidelines

## Component Structure
Each component follows this pattern:
```
ComponentName/
├── ComponentName.tsx        # Component logic
├── ComponentName.scss       # Component styles
├── ComponentName.stories.tsx # Storybook stories
└── index.ts                 # Re-export
```

## Component Design Principles

### Props Interface
- Always define TypeScript interface for props
- Use semantic prop names (onConnect, not onClick)
- Keep components pure (no side effects in render)

### Styling
- Import component SCSS: `import './ComponentName.scss'`
- Use semantic class names (`.connection-status`, not `.flex.items-center`)
- SCSS variables from `../../styles/_variables.scss`
- Mobile-first responsive design

### Storybook Stories
- Export all component states as stories
- Use `fn()` for action callbacks (logs in Storybook)
- Add `tags: ['autodocs']` for auto-generated docs
- At least 3-4 stories per component (idle/active/error states)

## Current Components

### ConnectionPanel
**Purpose:** Bluetooth connection management
**States:** disconnected, connecting, connected
**Props:** connectionState, onConnect, onDisconnect, error

### DeviceInfo
**Purpose:** Battery & firmware display
**States:** no battery, full, mid, low
**Props:** battery (nullable)

### MeasurementPanel
**Purpose:** Weight display, streaming controls, graph
**States:** idle, streaming, paused
**Props:** weights, measurements, streamState, callbacks

### ForceGraph
**Purpose:** Real-time Chart.js visualization
**States:** empty, with data
**Props:** measurements, peakWeight

## Testing Components

### In Storybook
```bash
npm run storybook
# Visit http://localhost:6006
# Interact with component states visually
```

### Component Tests
```bash
npm run test:all
# Storybook stories run as smoke tests via Vitest
```

## Component Best Practices

1. **Keep it simple** - Single responsibility
2. **Props down, events up** - One-way data flow
3. **No business logic** - Components render, parents manage state
4. **Accessibility** - Use semantic HTML, ARIA labels
5. **Mobile-first** - Touch targets min 44px

## When to Create New Component

- Reused in 2+ places
- >100 lines of JSX
- Distinct responsibility
- Needs isolated testing
