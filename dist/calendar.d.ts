import { DateTime } from 'luxon';
export interface BusySlot {
    start: DateTime;
    end: DateTime;
}
export declare function getBusySlots(icsPath: string, windowStart: DateTime, windowEnd: DateTime): BusySlot[];
export declare function findFreeSlots(busySlots: BusySlot[], windowStart: DateTime, windowEnd: DateTime, durationMinutes: number): BusySlot[];
//# sourceMappingURL=calendar.d.ts.map