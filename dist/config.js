import dotenv from 'dotenv';
import { DateTime } from 'luxon';
dotenv.config();
export const config = {
    ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
    ollamaModel: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
    icsInputPath: process.env.ICS_INPUT_PATH || './calendar.ics',
    icsOutputDir: process.env.ICS_OUTPUT_DIR || './output',
    openclawEnabled: process.env.OPENCLAW_ENABLED === 'true',
    timezone: process.env.TIMEZONE || DateTime.local().zoneName,
    defaultDuration: parseInt(process.env.DEFAULT_EVENT_DURATION_MINUTES || '60', 10),
};
