# Grippy

A Progressive Web App for tracking climbing grip strength using the Tindeq Progressor force sensor.

🚀 **Live Demo:** [grippy-vert.vercel.app](https://grippy-vert.vercel.app) | [Demo Mode](https://grippy-vert.vercel.app?demo=true)

## Preview

![Grippy Interface](/screenshots/grippy-demo.png)

## What is Grippy?

Grippy lets you connect your Tindeq Progressor (a Bluetooth-enabled climbing dynamometer) directly to your phone or computer to:

- **Track grip strength in real-time** - See live force measurements as you hang
- **Monitor training sessions** - View peak force, track progress over time
- **Train anywhere** - Works on iPhone via Bluefy browser (no App Store needed!)
- **Own your data** - All measurements stay on your device

Perfect for climbers who want to track finger strength training without relying on proprietary apps or cloud services.

## Why Grippy?

- 🚫 **No App Store account needed** - Run as PWA on iOS through Bluefy browser
- 🔓 **Open source** - Full control over your training data
- 📱 **Offline-ready** - PWA works without internet connection
- ⚡ **Direct Bluetooth** - No intermediary apps or services
- ✅ **Fully tested** - BDD specifications ensure reliability

## Features

- 📱 **PWA Support** - Install on iOS (via Bluefy browser) and Android
- 🔵 **Bluetooth Connectivity** - Direct Web Bluetooth API integration
- 📊 **Real-time Data** - Live force measurement streaming
- ⏸️ **Pause/Resume** - Control data streaming during training
- 🔋 **Battery Monitoring** - Track device battery level
- 📈 **Peak Detection** - Automatically identify max force values

## Getting Started

### Prerequisites

- Node.js 18+
- Modern browser with Web Bluetooth (Chrome, Edge, or Bluefy on iOS)
- Tindeq Progressor device

### Installation

```bash
npm install
```

### Development

```bash
# Start dev server
npm run dev

# Run unit tests
npm test

# Run BDD tests
npm run test:bdd

# Run all tests
npm run test:all

# Open test UI
npm run test:ui
```

### Building

```bash
npm run build
npm run preview
```

## Quick Start

### Desktop (Chrome/Edge)
1. Visit [grippy-vert.vercel.app](https://grippy-vert.vercel.app)
2. Click "Connect" and select your Progressor
3. Click "Start" to begin measuring

### iOS (iPhone/iPad)
Since Safari doesn't support Web Bluetooth:

1. Install [Bluefy Browser](https://apps.apple.com/us/app/bluefy-web-ble-browser/id1492822055) from App Store (free)
2. Open [grippy-vert.vercel.app](https://grippy-vert.vercel.app) in Bluefy
3. Grant Bluetooth permissions
4. Connect to your Progressor device

### Demo Mode (No Device Required)
Try the app without a Progressor: [grippy-vert.vercel.app?demo=true](https://grippy-vert.vercel.app?demo=true)

## Project Structure

```
grippy/
├── features/                     # Gherkin BDD specifications
│   ├── bluetooth-connection.feature
│   ├── data-streaming.feature
│   ├── device-info.feature
│   └── support/                  # Cucumber step definitions
├── src/
│   ├── lib/
│   │   ├── tindeq-protocol.ts   # Bluetooth protocol implementation
│   │   └── tindeq-client.ts     # Bluetooth client class
│   ├── App.tsx                   # Main application
│   └── main.tsx                  # Entry point
├── tests/unit/                   # Vitest unit tests
└── public/                       # Static assets
```

## Technology Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **PWA**: vite-plugin-pwa + Workbox
- **Testing**: Vitest (unit) + Cucumber (BDD)
- **Bluetooth**: Web Bluetooth API

## Tindeq Progressor Protocol

The app implements the official [Tindeq Progressor API](https://tindeq.com/progressor_api/) using:

- **Service UUID**: `7e4e1701-1ea6-40c9-9dcc-13d34ffead57`
- **Data Characteristic**: `7e4e1702-1ea6-40c9-9dcc-13d34ffead57`
- **Control Characteristic**: `7e4e1703-1ea6-40c9-9dcc-13d34ffead57`
- **Encoding**: TLV (Tag-Length-Value) format, little-endian

## Testing

### BDD with Cucumber

```bash
npm run test:bdd
```

**18 scenarios, 118 steps** covering:
- Bluetooth connection/disconnection
- Data streaming with pause/resume
- Device information (battery, firmware)

### Unit Tests

```bash
npm test
```

**49 unit tests** covering:
- Protocol encoding/decoding
- Client state management
- Data parsing

## Development Status

- ✅ Bluetooth library implementation
- ✅ BDD specifications and tests
- ✅ Unit tests
- 🚧 PWA manifest and service worker
- 🚧 React UI components
- 🚧 Real-time data visualization
- 📋 Session management (planned)
- 📋 Data persistence (planned)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- [Tindeq](https://tindeq.com/) for the Progressor API documentation
- [hangtime-grip-connect](https://github.com/Stevie-Ray/hangtime-grip-connect) for protocol reference
