# Project
AC-47 - Proton Calendar Natural Language Assistant

# Goal
Let the user manage their Proton Calendar using plain English — adding events and finding free time — via a local LLM (Ollama) for parsing and OpenClaw for browser automation.

# Stack
- **Runtime:** Node.js (TypeScript) or Python — agent's choice, whichever fits cleaner
- **NLP / LLM:** Ollama local API (`http://localhost:11434`) — model configurable via `.env` (default: `qwen2.5:7b` or `mistral:7b`)
- **Browser automation:** OpenClaw (`clawd.bot`) with browser relay Chrome extension for writing to Proton Calendar UI
- **Calendar parsing:** `ical.js` (Node) or `icalendar` (Python) for reading `.ics` files
- **Date/time handling:** `chrono-node` (Node) or `dateparser` + `arrow` (Python) for fuzzy date resolution
- **Config:** `.env` file for all user-specific settings
- **Interface:** CLI (interactive REPL loop, single command mode both supported)
- **Storage:** Local filesystem only — no database, no cloud

# Features

## Core — NLP Input
- Accept a free-text string from the user (REPL prompt or CLI argument)
- Pass input to local Ollama model with a structured prompt requesting JSON output
- Parse model JSON response into an internal `Intent` object with one of two types:
  - `ADD_EVENT` — create a new calendar event
  - `QUERY_FREE_TIME` — find available slots in a given window

## Core — ADD_EVENT Flow
- Extract from user input: `title`, `date`, `start_time`, `end_time` (or duration), optional `description`, optional `location`
- If any required field is ambiguous or missing, re-prompt the user with a clarifying question (max 1 follow-up per field)
- Resolve relative dates ("next Friday", "tomorrow") against the current local date/time
- Write event to Proton Calendar via OpenClaw browser automation:
  1. Check if `calendar.proton.me` tab is already open; if not, open it
  2. Navigate to the correct date on the calendar
  3. Click "New event" button
  4. Fill in title, date, start time, end time, description, location fields
  5. Click save / confirm
  6. Screenshot or DOM-check to confirm event appeared
- On OpenClaw failure (login wall, CAPTCHA, element not found): fall back to generating a single-event `.ics` file and instruct the user to import it manually

## Core — QUERY_FREE_TIME Flow
- Load the user's exported `.ics` file (path set in `.env`)
- Parse all `VEVENT` entries, resolve recurring events within the query window using the ical library
- Accept query parameters extracted by LLM: `window_start`, `window_end`, `duration_minutes`
- Compute free slots: subtract all busy periods from the full window, filter slots shorter than `duration_minutes`
- Output a ranked list of available slots (earliest first) in human-readable format
- After displaying results, prompt: *"Would you like to schedule something in one of these slots? (enter slot number or 'no')"*
- If user selects a slot, switch to ADD_EVENT flow pre-filled with that time

## ICS Fallback (always available)
- Any ADD_EVENT result can also export a `.ics` file to a configurable output directory
- File contains a single `VEVENT` ready to drag-and-drop into Proton Calendar
- Filename format: `YYYYMMDD-<slugified-title>.ics`

## Configuration
- `.env` file controls:
  - `OLLAMA_HOST` (default `http://localhost:11434`)
  - `OLLAMA_MODEL` (default `qwen2.5:7b`)
  - `ICS_INPUT_PATH` — path to the user's exported Proton `.ics` file (for free-slot queries)
  - `ICS_OUTPUT_DIR` — where to write generated `.ics` fallback files
  - `OPENCLAW_ENABLED` — boolean toggle for browser automation (default `true`)
  - `TIMEZONE` — IANA timezone string (default: system timezone)
  - `DEFAULT_EVENT_DURATION_MINUTES` — used when end time not specified (default `60`)

## LLM Prompt Design
- System prompt instructs model to respond ONLY with a JSON object, no preamble, no markdown fences
- JSON schema for ADD_EVENT:
  ```json
  {
    "intent": "ADD_EVENT",
    "title": "string",
    "date": "YYYY-MM-DD or null",
    "start_time": "HH:MM or null",
    "end_time": "HH:MM or null",
    "duration_minutes": "number or null",
    "description": "string or null",
    "location": "string or null",
    "ambiguous_fields": ["list of field names that need clarification"]
  }
  ```
- JSON schema for QUERY_FREE_TIME:
  ```json
  {
    "intent": "QUERY_FREE_TIME",
    "window_start": "YYYY-MM-DD",
    "window_end": "YYYY-MM-DD",
    "duration_minutes": "number"
  }
  ```
- If model output is not valid JSON or schema is invalid, retry once with a stricter prompt before asking user to rephrase

# Constraints
- No external APIs other than local Ollama — no OpenAI, no cloud LLM calls
- No persistent database — all state is in-memory per session or on the filesystem (`.ics` files)
- OpenClaw browser automation targets `calendar.proton.me` only — no scraping or reading calendar data from the browser (read side always uses the exported `.ics` file)
- The `.ics` input file is managed by the user — the tool never deletes or modifies it, only reads it
- Generated `.ics` output files are standalone single-event files, never overwrites the source `.ics`
- Must work fully offline (except for OpenClaw needing the browser open to Proton)
- No login credentials are stored or handled by this tool — OpenClaw uses the user's existing authenticated browser session
- Relative date resolution must always use the user's local timezone from `TIMEZONE` env var
- If Ollama is unreachable, exit with a clear error message pointing to `OLLAMA_HOST` config
- CLI must be runnable as a single command: `node index.js "your message here"` (non-interactive mode) as well as `node index.js` (REPL mode)

# Style
- CLI output is clean and minimal — no excessive logging
- Use clear prefixes for output lines:
  - `>` for tool responses / results
  - `?` for clarifying questions / prompts
  - `✓` for success confirmations
  - `✗` for errors
  - `~` for fallback notices (e.g. "OpenClaw unavailable, writing .ics instead")
- Timestamps displayed in human-readable local time (e.g. `Friday May 23 · 10:00 AM – 11:00 AM`)
- Errors are brief and actionable — always say what the user can do to fix it
- No color output by default; enable with `--color` flag (use `chalk` or `colorama`)

# Notes

## OpenClaw Integration
- OpenClaw must be running locally (`clawdbot status` to verify) and the browser relay extension must be connected before ADD_EVENT flows that use browser automation
- If OpenClaw reports login/2FA blocker, the tool should immediately fall back to `.ics` output and tell the user
- Selector strategy: instruct OpenClaw via natural language actions (e.g. "click the New Event button"), not hardcoded CSS selectors — this makes it resilient to Proton UI changes
- Recommended OpenClaw browser profile: a dedicated `proton` profile to avoid mixing with daily browsing

## ICS Parsing Notes
- Proton Calendar exports use UTC timestamps — always convert to local timezone for display and comparison
- Recurring events (`RRULE`) must be expanded for the query window — do not skip them
- All-day events (`DATE` type, no time component) count as busy for the full day by default
- Events with `STATUS:CANCELLED` should be ignored

## Known Limitations to Document for User
- Free-slot queries require the user to have a reasonably fresh `.ics` export from Proton (Proton has no live sync)
- OpenClaw automation may break if Proton updates their UI — `.ics` fallback always works
- Local models (7B) can misparse complex relative expressions like "the Tuesday after next" — user should rephrase if clarification loop triggers more than once

## Suggested File Structure
```
/
├── index.ts (or main.py)       # Entry point, REPL loop, CLI arg handling
├── llm.ts                      # Ollama API call, prompt templates, JSON parse + retry
├── intent.ts                   # Intent types, validation, ambiguity detection
├── calendar.ts                 # .ics read, VEVENT parsing, free-slot computation
├── openclaw.ts                 # OpenClaw browser automation actions
├── ics-writer.ts               # Single-event .ics file generation
├── config.ts                   # .env loading, defaults, validation
├── utils/
│   └── datetime.ts             # Timezone handling, relative date resolution, formatting
├── .env.example                # Template with all supported variables and comments
└── README.md                   # Setup steps: install Ollama, pull model, configure .env, run OpenClaw
```
