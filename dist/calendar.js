import ICAL from 'ical.js';
import fs from 'fs';
import { DateTime } from 'luxon';
import { config } from './config.js';
export function getBusySlots(icsPath, windowStart, windowEnd) {
    if (!fs.existsSync(icsPath)) {
        return [];
    }
    const icsData = fs.readFileSync(icsPath, 'utf-8');
    const jcalData = ICAL.parse(icsData);
    const vcalendar = new ICAL.Component(jcalData);
    const vevents = vcalendar.getAllSubcomponents('vevent');
    const busySlots = [];
    vevents.forEach((vevent) => {
        const event = new ICAL.Event(vevent);
        const dtstart = event.startDate.toJSDate();
        const dtend = event.endDate.toJSDate();
        // Basic expansion for recurring events (simplified for prototype)
        if (event.isRecurring()) {
            const iter = event.iterator();
            let next;
            while ((next = iter.next()) && next.toJSDate() < windowEnd.toJSDate()) {
                const occurrence = event.getOccurrenceDetails(next);
                const start = DateTime.fromJSDate(occurrence.startDate.toJSDate()).setZone(config.timezone);
                const end = DateTime.fromJSDate(occurrence.endDate.toJSDate()).setZone(config.timezone);
                if (start < windowEnd && end > windowStart) {
                    busySlots.push({ start, end });
                }
            }
        }
        else {
            const start = DateTime.fromJSDate(dtstart).setZone(config.timezone);
            const end = DateTime.fromJSDate(dtend).setZone(config.timezone);
            if (start < windowEnd && end > windowStart) {
                busySlots.push({ start, end });
            }
        }
    });
    return busySlots.sort((a, b) => a.start.toMillis() - b.start.toMillis());
}
export function findFreeSlots(busySlots, windowStart, windowEnd, durationMinutes) {
    const freeSlots = [];
    let current = windowStart;
    for (const busy of busySlots) {
        if (busy.start > current) {
            const diff = busy.start.diff(current, 'minutes').minutes;
            if (diff >= durationMinutes) {
                freeSlots.push({ start: current, end: busy.start });
            }
        }
        if (busy.end > current) {
            current = busy.end;
        }
    }
    if (current < windowEnd) {
        const diff = windowEnd.diff(current, 'minutes').minutes;
        if (diff >= durationMinutes) {
            freeSlots.push({ start: current, end: windowEnd });
        }
    }
    return freeSlots;
}
