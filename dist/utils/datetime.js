import * as chrono from 'chrono-node';
import { DateTime } from 'luxon';
import { config } from '../config.js';
export function parseRelativeDate(text, referenceDate = new Date()) {
    const results = chrono.parse(text, referenceDate, { forwardDate: true });
    if (results.length === 0)
        return null;
    const date = results[0].start.date();
    return DateTime.fromJSDate(date).setZone(config.timezone);
}
export function formatEventTime(dt) {
    return dt.setZone(config.timezone).toLocaleString(DateTime.DATETIME_MED);
}
export function now() {
    return DateTime.now().setZone(config.timezone);
}
