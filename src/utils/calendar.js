import { Linking } from 'react-native';

let _C = null;

async function getCalendar() {
    if (!_C) {
        try {
            _C = await import('expo-calendar');
        } catch {
            return null;
        }
    }
    return _C;
}

export async function addGoalToCalendar(goal) {
    const C = await getCalendar();
    if (!C) return 'unavailable';

    try {
        const { status } = await C.requestCalendarPermissionsAsync();
        if (status !== 'granted') {
            // BUG-10: Provide openSettings so caller can show a "Go to Settings" button
            Linking.openSettings();
            return 'denied';
        }

        const calendars = await C.getCalendarsAsync(C.EntityTypes?.EVENT ?? 'event');
        const writable = calendars.find(c => c.allowsModifications && (c.isPrimary || c.source?.isLocalAccount || c.source?.name === 'Default'));
        const calId = writable?.id ?? calendars.find(c => c.allowsModifications)?.id;
        if (!calId) return 'no_calendar';

        const startDate = new Date(goal.deadline + 'T09:00:00');
        const endDate = new Date(goal.deadline + 'T10:00:00');

        await C.createEventAsync(calId, {
            title: goal.name,
            startDate,
            endDate,
            notes: goal.description || '',
            alarms: [{ relativeOffset: -24 * 60 }],
        });

        return 'ok';
    } catch (err) {
        console.warn('[calendar] error:', err);
        return 'error';
    }
}
