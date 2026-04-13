let _N = null;

async function getNotifications() {
    if (!_N) {
        try {
            _N = await import('expo-notifications');
        } catch {
            return null;
        }
    }
    return _N;
}

function makeTrigger(N, triggerDate, seconds) {
    const CalendarType = N.SchedulableTriggerInputTypes?.CALENDAR;
    const DateType = N.SchedulableTriggerInputTypes?.DATE;
    const IntervalType = N.SchedulableTriggerInputTypes?.TIME_INTERVAL;

    // CALENDAR is the most reliable on Android — uses exact date/time components
    if (CalendarType) {
        return {
            type: CalendarType,
            year: triggerDate.getFullYear(),
            month: triggerDate.getMonth() + 1,
            day: triggerDate.getDate(),
            hour: triggerDate.getHours(),
            minute: triggerDate.getMinutes(),
            second: 0,
            repeats: false,
            channelId: 'goal-reminders',
        };
    }
    if (DateType) {
        return { type: DateType, date: triggerDate, channelId: 'goal-reminders' };
    }
    if (IntervalType) {
        return { type: IntervalType, seconds, repeats: false, channelId: 'goal-reminders' };
    }
    return { seconds, channelId: 'goal-reminders' };
}

export async function setupNotifications() {
    const N = await getNotifications();
    if (!N) return;
    try {
        const { status } = await N.requestPermissionsAsync();
        if (status !== 'granted') return;

        N.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });

        // Android requires a notification channel — HIGH importance shows heads-up alerts
        if (N.setNotificationChannelAsync) {
            await N.setNotificationChannelAsync('goal-reminders', {
                name: 'Goal Reminders',
                importance: N.AndroidImportance?.HIGH ?? 4,
                vibrationPattern: [0, 250, 250, 250],
                sound: 'default',
            });
        }
    } catch (err) {
        console.warn('[notifications] setup error:', err);
    }
}

export async function scheduleGoalNotifications(goal, t) {
    const N = await getNotifications();
    if (!N) return;
    try {
        await cancelGoalNotifications(goal.id);
        if (goal.completed) return;

        const reminderDays = goal.reminderDays ?? [3, 1];
        if (!reminderDays.length) return;

        const now = new Date();
        const deadline = new Date(goal.deadline + 'T09:00:00');

        for (const days of reminderDays) {
            const triggerDate = new Date(deadline);
            triggerDate.setDate(triggerDate.getDate() - days);
            const seconds = Math.round((triggerDate.getTime() - now.getTime()) / 1000);
            if (seconds <= 0) continue;

            const body = days === 0
                ? t('notif.reminderToday', { name: goal.name })
                : t('notif.reminderDays', { name: goal.name, n: days });

            await N.scheduleNotificationAsync({
                content: {
                    title: t('notif.title'),
                    body,
                    data: { goalId: goal.id },
                },
                trigger: makeTrigger(N, triggerDate, seconds),
            });
        }
    } catch (err) {
        console.warn('[notifications] schedule error:', err);
    }
}

export async function cancelGoalNotifications(goalId) {
    const N = await getNotifications();
    if (!N) return;
    try {
        const scheduled = await N.getAllScheduledNotificationsAsync();
        for (const n of scheduled) {
            if (n.content?.data?.goalId === goalId) {
                await N.cancelScheduledNotificationAsync(n.identifier);
            }
        }
    } catch (err) {
        console.warn('[notifications] cancel error:', err);
    }
}
