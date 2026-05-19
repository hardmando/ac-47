export const ADD_EVENT_SYSTEM_PROMPT = `
Respond ONLY with a JSON object. No preamble, no markdown.
JSON schema:
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
`;
export const QUERY_FREE_TIME_SYSTEM_PROMPT = `
Respond ONLY with a JSON object. No preamble, no markdown.
JSON schema:
{
  "intent": "QUERY_FREE_TIME",
  "window_start": "YYYY-MM-DD",
  "window_end": "YYYY-MM-DD",
  "duration_minutes": "number"
}
`;
export const MAIN_SYSTEM_PROMPT = `
You are a calendar assistant. Determine the user's intent.
If they want to add an event, use ADD_EVENT.
If they want to find free time, use QUERY_FREE_TIME.
Current time: {{now}}
Respond ONLY with one of the specified JSON schemas.
`;
