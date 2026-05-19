import ICAL from 'ical.js';
import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';
import { config } from './config.js';
export function writeIcsFile(intent) {
    const comp = new ICAL.Component(['vcalendar', [], []]);
    comp.updatePropertyWithValue('prodid', '-//AC-47//NONSGML Proton Calendar Assistant//EN');
    comp.updatePropertyWithValue('version', '2.0');
    const vevent = new ICAL.Component('vevent');
    const event = new ICAL.Event(vevent);
    event.summary = intent.title;
    if (intent.description)
        event.description = intent.description;
    if (intent.location)
        event.location = intent.location;
    const start = DateTime.fromISO(`${intent.date}T${intent.start_time}`, { zone: config.timezone });
    let end;
    if (intent.end_time) {
        end = DateTime.fromISO(`${intent.date}T${intent.end_time}`, { zone: config.timezone });
    }
    else if (intent.duration_minutes) {
        end = start.plus({ minutes: intent.duration_minutes });
    }
    else {
        end = start.plus({ minutes: config.defaultDuration });
    }
    event.startDate = ICAL.Time.fromJSDate(start.toJSDate(), true);
    event.endDate = ICAL.Time.fromJSDate(end.toJSDate(), true);
    comp.addSubcomponent(vevent);
    if (!fs.existsSync(config.icsOutputDir)) {
        fs.mkdirSync(config.icsOutputDir, { recursive: true });
    }
    const slug = intent.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const dateStr = intent.date?.replace(/-/g, '') || 'unknown';
    const fileName = `${dateStr}-${slug}.ics`;
    const filePath = path.join(config.icsOutputDir, fileName);
    fs.writeFileSync(filePath, comp.toString());
    return filePath;
}
