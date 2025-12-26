# Bluetooth Library - Implementation Notes

## Files
- `tindeq-protocol.ts` - Protocol constants, TLV encoding, parsers
- `tindeq-client.ts` - Bluetooth client class with connection/streaming
- `mock-tindeq-client.ts` - Simulated device for demo mode

## Protocol Implementation

### CRITICAL: Protocol Values (Tested with Real Device)
**These are the ACTUAL values from the Progressor device:**

**Response Tags** (what device sends):
- `0` = CMD_RESPONSE (generic ack)
- `1` = WEIGHT_MEASUREMENT ← **This is what weight data uses!**
- `2` = RFD_PEAK
- `3` = RFD_PEAK_SERIES
- `4` = LOW_BATTERY_WARNING

**Command Tags** (what we send):
- `100` = TARE_SCALE
- `101` = START_WEIGHT_MEASUREMENT
- `102` = STOP_WEIGHT_MEASUREMENT
- `111` = GET_BATTERY_VOLTAGE

### Batched Data Format
Weight measurements come in **batches of 15**:
- Total: 120 bytes per notification
- Per measurement: 8 bytes
  - 4 bytes: float32 weight (little-endian)
  - 4 bytes: uint32 timestamp (little-endian)

**Parse with loop:**
```typescript
for (let i = 0; i < data.length; i += 8) {
  const weight = view.getFloat32(i, true)
  const timestamp = view.getUint32(i + 4, true)
}
```

## TindeqClient Usage

### Connection Flow
```typescript
const client = new TindeqClient()
client.setConnectionStateCallback(state => {...})
client.setWeightDataCallback(measurement => {...})
await client.connect() // Shows browser picker
await client.getBatteryVoltage()
```

### Streaming Flow
```typescript
await client.tare() // Zero the scale
await client.startStreaming() // Start weight data
// Data comes via weightDataCallback (batched!)
client.pauseStreaming() // Pause UI updates
client.resumeStreaming() // Resume UI updates
await client.stopStreaming() // Stop device streaming
```

## Mock Client (Demo Mode)

Use `MockTindeqClient` for development without device:
- Simulates realistic hang patterns
- No Bluetooth required
- Same interface as real client

Enable in App: `?demo=true` URL parameter

## Common Mistakes to Avoid

❌ **Don't use old hex values for tags**
- Response tags are 0-4 (not 0xC8-0xCE)
- Command tags are 100-111 (not 0x64-0x6E)

❌ **Don't parse single weight**
- Weight data is BATCHED (15 per packet)
- Must loop through 8-byte chunks

❌ **Don't call writeValue with .buffer**
- Pass Uint8Array directly
- encodeCommand() returns BufferSource

✅ **Do clamp negative values**
- Force can't be negative
- Use `Math.max(0, weight)`

## Testing

Unit tests cover:
- TLV encoding/decoding
- Weight/battery/firmware parsing
- Connection state transitions
- Stream control logic
