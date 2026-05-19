# AC-47 - Proton Calendar Natural Language Assistant

Manage Proton Calendar using plain English via local LLM.

## Docker Setup (Recommended)

1. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env: ensure OLLAMA_MODEL=qwen2.5:3b
   ```

2. **Start Services:**
   ```bash
   docker compose up -d ollama
   docker exec cal-ollama ollama pull qwen2.5:3b
   docker compose up -d
   ```

3. **OpenClaw Relay:**
   - Install Chrome extension.
   - Set gateway: `http://localhost:3737`.

4. **Run App:**
   ```bash
   docker attach cal-app
   ```

## Manual Setup

**Interactive Mode (REPL):**
```bash
npx ts-node src/index.ts
```

**Single Command:**
```bash
npx ts-node src/index.ts "Schedule lunch with Bob tomorrow at 12pm for 1 hour"
```

## Features

- **ADD_EVENT:** Schedules events via OpenClaw or generates a `.ics` fallback file.
- **QUERY_FREE_TIME:** Finds available slots in your calendar using the exported `.ics` file.
- **Natural Language:** Relative dates ("tomorrow", "next Friday") supported.
