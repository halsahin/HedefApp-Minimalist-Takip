import React, { useState, useMemo } from 'react';
import {
    Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, StatusBar,
} from 'react-native';
import { Spacing, Radii, Typography } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { calcRemainingDays, formatDate } from '../utils/dateUtils';
import { CATEGORY_ICON_MAP } from '../constants/categories';

let CalendarComponent = null;
try {
    CalendarComponent = require('react-native-calendars').Calendar;
} catch {
    CalendarComponent = null;
}

export default function CalendarModal({ visible, onClose, goals }) {
    const { colors, isDark } = useTheme();
    const { t, locale } = useLanguage();
    const [selectedDate, setSelectedDate] = useState(null);

    const today = new Date().toISOString().slice(0, 10);

    const markedDates = useMemo(() => {
        const marks = {};
        for (const goal of goals) {
            if (!goal.deadline) continue;
            const existing = marks[goal.deadline] || { dots: [] };
            existing.dots = [
                ...(existing.dots || []),
                {
                    color: goal.completed
                        ? colors.success
                        : goal.recurring
                            ? colors.accent
                            : colors.danger,
                    key: goal.id,
                },
            ];
            marks[goal.deadline] = existing;
        }
        if (selectedDate) {
            marks[selectedDate] = {
                ...(marks[selectedDate] || {}),
                selected: true,
                selectedColor: colors.accentDark,
            };
        }
        return marks;
    }, [goals, selectedDate, colors]);

    const goalsOnDay = selectedDate
        ? goals.filter(g => g.deadline === selectedDate)
        : [];

    const calendarTheme = {
        backgroundColor: colors.surface,
        calendarBackground: colors.surface,
        textSectionTitleColor: colors.textMuted,
        dayTextColor: colors.text,
        todayTextColor: colors.accentDark,
        selectedDayBackgroundColor: colors.accentDark,
        selectedDayTextColor: isDark ? colors.text : '#1A1A2E',
        arrowColor: colors.accentDark,
        monthTextColor: colors.text,
        indicatorColor: colors.accentDark,
        textDayFontSize: Typography.base,
        textMonthFontSize: Typography.base,
        textDayHeaderFontSize: Typography.xs,
        dotColor: colors.danger,
        selectedDotColor: colors.text,
        disabledArrowColor: colors.textLight,
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.root, { backgroundColor: colors.bg }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.title, { color: colors.text }]}>{t('calendar.title')}</Text>
                    <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                        <Text style={[styles.closeBtn, { color: colors.textMuted }]}>{t('calendar.close')}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {CalendarComponent ? (
                        <CalendarComponent
                            markingType="multi-dot"
                            markedDates={markedDates}
                            onDayPress={day => setSelectedDate(day.dateString)}
                            theme={calendarTheme}
                            style={{ backgroundColor: colors.surface }}
                        />
                    ) : (
                        <View style={styles.noCalendar}>
                            <Text style={[styles.noCalendarText, { color: colors.textMuted }]}>
                                react-native-calendars kurulu değil.{'\n'}
                                Terminal'de çalıştır: npx expo install react-native-calendars
                            </Text>
                        </View>
                    )}

                    <View style={[styles.legend, { borderTopColor: colors.border }]}>
                        <LegendDot color={colors.danger} label="Aktif" />
                        <LegendDot color={colors.accent} label="Tekrarlayan" />
                        <LegendDot color={colors.success} label="Tamamlanan" />
                    </View>

                    {selectedDate && (
                        <View style={[styles.daySection, { borderTopColor: colors.border }]}>
                            <Text style={[styles.dayTitle, { color: colors.text }]}>
                                {goalsOnDay.length > 0
                                    ? t('calendar.goalsDue')
                                    : t('calendar.noGoals')}
                            </Text>
                            {goalsOnDay.map(goal => {
                                const days = calcRemainingDays(goal.deadline);
                                return (
                                    <View key={goal.id} style={[styles.goalRow, {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                    }]}>
                                        <Text style={styles.goalIcon}>
                                            {CATEGORY_ICON_MAP[goal.category] || '📌'}
                                        </Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.goalName, { color: colors.text },
                                                goal.completed && { textDecorationLine: 'line-through', color: colors.textMuted }
                                            ]}>
                                                {goal.name}
                                            </Text>
                                            <Text style={[styles.goalDate, { color: colors.textLight }]}>
                                                {formatDate(goal.deadline, locale)}
                                            </Text>
                                        </View>
                                        {goal.completed && (
                                            <Text style={[styles.goalBadge, { color: colors.success }]}>✓</Text>
                                        )}
                                        {!goal.completed && days < 0 && (
                                            <Text style={[styles.goalBadge, { color: colors.danger }]}>⚡</Text>
                                        )}
                                        {goal.recurring && (
                                            <Text style={styles.goalBadge}>🔁</Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

function LegendDot({ color, label }) {
    return (
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + Spacing.md : 44 + Spacing.md,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    title: { fontSize: Typography.md, fontWeight: '700' },
    closeBtn: { fontSize: Typography.sm, fontWeight: '600' },
    noCalendar: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    noCalendarText: { fontSize: Typography.sm, textAlign: 'center', lineHeight: 22 },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.lg,
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { fontSize: Typography.xs, color: '#888' },
    daySection: {
        padding: Spacing.lg,
        borderTopWidth: 1,
        gap: Spacing.sm,
    },
    dayTitle: { fontSize: Typography.sm, fontWeight: '700', marginBottom: Spacing.xs },
    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        borderRadius: Radii.sm,
        borderWidth: 1,
        padding: Spacing.md,
    },
    goalIcon: { fontSize: 20 },
    goalName: { fontSize: Typography.sm, fontWeight: '600' },
    goalDate: { fontSize: Typography.xs, marginTop: 2 },
    goalBadge: { fontSize: 16 },
});
