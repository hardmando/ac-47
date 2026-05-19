export type IntentType = 'ADD_EVENT' | 'QUERY_FREE_TIME';
export interface AddEventIntent {
    intent: 'ADD_EVENT';
    title: string;
    date: string | null;
    start_time: string | null;
    end_time: string | null;
    duration_minutes: number | null;
    description: string | null;
    location: string | null;
    ambiguous_fields: string[];
}
export interface QueryFreeTimeIntent {
    intent: 'QUERY_FREE_TIME';
    window_start: string;
    window_end: string;
    duration_minutes: number;
}
export type Intent = AddEventIntent | QueryFreeTimeIntent;
export declare const ADD_EVENT_SYSTEM_PROMPT = "\nRespond ONLY with a JSON object. No preamble, no markdown.\nJSON schema:\n{\n  \"intent\": \"ADD_EVENT\",\n  \"title\": \"string\",\n  \"date\": \"YYYY-MM-DD or null\",\n  \"start_time\": \"HH:MM or null\",\n  \"end_time\": \"HH:MM or null\",\n  \"duration_minutes\": \"number or null\",\n  \"description\": \"string or null\",\n  \"location\": \"string or null\",\n  \"ambiguous_fields\": [\"list of field names that need clarification\"]\n}\n";
export declare const QUERY_FREE_TIME_SYSTEM_PROMPT = "\nRespond ONLY with a JSON object. No preamble, no markdown.\nJSON schema:\n{\n  \"intent\": \"QUERY_FREE_TIME\",\n  \"window_start\": \"YYYY-MM-DD\",\n  \"window_end\": \"YYYY-MM-DD\",\n  \"duration_minutes\": \"number\"\n}\n";
export declare const MAIN_SYSTEM_PROMPT = "\nYou are a calendar assistant. Determine the user's intent.\nIf they want to add an event, use ADD_EVENT.\nIf they want to find free time, use QUERY_FREE_TIME.\nCurrent time: {{now}}\nRespond ONLY with one of the specified JSON schemas.\n";
//# sourceMappingURL=intent.d.ts.map