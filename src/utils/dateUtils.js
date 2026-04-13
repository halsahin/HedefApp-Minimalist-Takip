// ──────────────────────────────────────────────
// Date / ID utilities
// ──────────────────────────────────────────────

export function todayMidnight() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Returns the number of whole days remaining until `deadline` (ISO date string).
 * Negative = overdue.
 */
export function calcRemainingDays(deadline) {
    const diff = new Date(deadline + 'T00:00:00') - todayMidnight();
    return Math.round(diff / (1000 * 60 * 60 * 24));
}

/**
 * Formats an ISO date string to the given locale.
 * e.g. "2026-03-15" → "15 Mart 2026" (tr-TR)
 */
export function formatDate(isoDate, locale = 'tr-TR') {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T12:00:00');
    return d.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Adds `days` days to today and returns an ISO date string (YYYY-MM-DD).
 */
export function deadlineFromDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
    ].join('-');
}

/**
 * Returns today + 30 days as an ISO date string (default deadline).
 */
export function defaultDeadline() {
    return deadlineFromDays(30);
}

/**
 * Short unique ID.
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * Returns chip config { key, params, type } based on remaining days.
 * Components translate the key using t(key, params).
 * type: 'done' | 'urgent' | 'warning' | 'good'
 */
export function getDayChipInfo(days, completed) {
    if (completed) return { key: 'chip.completed', params: {}, type: 'done' };
    if (days < 0) return { key: 'chip.daysAgo', params: { n: Math.abs(days) }, type: 'urgent' };
    if (days === 0) return { key: 'chip.today', params: {}, type: 'urgent' };
    if (days <= 3) return { key: 'chip.urgent', params: {}, type: 'urgent' };
    if (days <= 7) return { key: 'chip.thisWeek', params: {}, type: 'warning' };
    return { key: 'chip.onTrack', params: {}, type: 'good' };
}
