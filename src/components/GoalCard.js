import React, { useRef } from 'react';
import {
    View, Text, StyleSheet, Alert, Animated, PanResponder, TouchableOpacity,
} from 'react-native';
import { Typography, Spacing, Radii, Shadows } from '../constants/theme';
import { CATEGORY_ICON_MAP, getCategoryLabel } from '../constants/categories';
import { calcRemainingDays, formatDate, getDayChipInfo } from '../utils/dateUtils';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const SWIPE_THRESHOLD = 80;

export default function GoalCard({ goal, onToggleComplete, onTogglePin, onDelete, onPress }) {
    const { t, locale } = useLanguage();
    const { colors } = useTheme();

    const days = calcRemainingDays(goal.deadline);
    const overdue = !goal.completed && days < 0;
    const icon = CATEGORY_ICON_MAP[goal.category] || '📌';
    const chipInfo = getDayChipInfo(days, goal.completed);

    const dayDisplay = goal.completed ? '✓' : `${Math.abs(days)}`;
    const dayTextLabel = goal.completed
        ? t('goalCard.done')
        : (days < 0 ? t('goalCard.daysAgo') : t('goalCard.daysLeft'));

    const stripColor = goal.completed
        ? colors.success
        : goal.pinned
            ? colors.accentDark
            : overdue
                ? colors.danger
                : colors.border;

    const cardBg = goal.pinned ? colors.pinned : colors.surface;
    const cardBorder = goal.pinned ? colors.pinnedBorder : colors.border;
    const daysNumColor = goal.completed
        ? colors.success
        : overdue
            ? colors.danger
            : colors.text;

    // ── Swipe ─────────────────────────────────────────────────
    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(PanResponder.create({
        // Don't claim on start — let FlatList handle vertical scroll and taps naturally
        onStartShouldSetPanResponder: () => false,
        // Only claim when gesture is clearly horizontal
        onMoveShouldSetPanResponder: (_, g) =>
            Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderTerminationRequest: () => true,

        onPanResponderMove: (_, g) => {
            translateX.setValue(g.dx);
        },

        onPanResponderRelease: (_, g) => {
            if (g.dx < -SWIPE_THRESHOLD) {
                Animated.timing(translateX, { toValue: -500, duration: 200, useNativeDriver: true })
                    .start(() => {
                        Alert.alert(
                            t('delete.title'),
                            t('delete.msg'),
                            [
                                {
                                    text: t('delete.cancel'),
                                    style: 'cancel',
                                    onPress: () => { translateX.setValue(0); },
                                },
                                {
                                    text: t('delete.confirm'),
                                    style: 'destructive',
                                    onPress: () => { translateX.setValue(0); onDelete(goal.id); },
                                },
                            ]
                        );
                    });
            } else if (g.dx > SWIPE_THRESHOLD) {
                Animated.timing(translateX, { toValue: 500, duration: 200, useNativeDriver: true })
                    .start(() => { translateX.setValue(0); onToggleComplete(goal.id); });
            } else {
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 8 }).start();
            }
        },

        onPanResponderTerminate: () => {
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        },
    })).current;

    const handleDeletePress = () => {
        Alert.alert(
            t('delete.title'),
            t('delete.msg'),
            [
                { text: t('delete.cancel'), style: 'cancel' },
                { text: t('delete.confirm'), style: 'destructive', onPress: () => onDelete(goal.id) },
            ]
        );
    };

    const showProgress = !goal.completed && goal.progress > 0;

    return (
        <View style={styles.swipeWrapper}>
            <View style={[styles.revealLeft, { backgroundColor: colors.successSoft }]}>
                <Text style={[styles.revealIcon, { color: colors.success }]}>✓</Text>
            </View>
            <View style={[styles.revealRight, { backgroundColor: colors.dangerSoft }]}>
                <Text style={[styles.revealIcon, { color: colors.danger }]}>🗑</Text>
            </View>

            <Animated.View
                style={[styles.card, {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    transform: [{ translateX }],
                }]}
                {...panResponder.panHandlers}
            >
                <View style={[styles.strip, { backgroundColor: stripColor }]} />

                <TouchableOpacity
                    style={styles.cardInner}
                    onPress={onPress}
                    activeOpacity={0.85}
                >
                    <TouchableOpacity
                        style={[styles.checkbox,
                            goal.completed && { backgroundColor: colors.success, borderColor: colors.success }
                        ]}
                        onPress={() => onToggleComplete(goal.id)}
                        activeOpacity={0.7}
                    >
                        {goal.completed && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>

                    <View style={styles.body}>
                        <View style={styles.meta}>
                            <View style={[styles.categoryBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                                <Text style={[styles.categoryBadgeText, { color: colors.textMuted }]}>
                                    {icon} {getCategoryLabel(goal.category, t)}
                                </Text>
                            </View>
                            {goal.recurring && <Text style={styles.recurringBadge}>🔁</Text>}
                        </View>

                        <Text style={[styles.name, { color: colors.text },
                            goal.completed && { textDecorationLine: 'line-through', color: colors.textMuted }
                        ]} numberOfLines={2}>
                            {goal.name}
                        </Text>

                        {!!goal.description && (
                            <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>
                                {goal.description}
                            </Text>
                        )}

                        <Text style={[styles.dateInfo, { color: colors.textLight }]}>
                            📅 {formatDate(goal.deadline, locale)}
                        </Text>

                        {showProgress && (
                            <View style={styles.progressRow}>
                                <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                                    <View style={[styles.progressFill, {
                                        width: `${goal.progress}%`,
                                        backgroundColor: colors.success,
                                    }]} />
                                </View>
                                <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
                                    {goal.progress}%
                                </Text>
                            </View>
                        )}

                        {goal.subtasks && goal.subtasks.length > 0 && (
                            <Text style={[styles.subtaskHint, { color: colors.textLight }]}>
                                ✅ {goal.subtasks.filter(s => s.completed).length}/{goal.subtasks.length}
                            </Text>
                        )}
                    </View>

                    <View style={styles.right}>
                        <View style={styles.daysBlock}>
                            <Text style={[styles.daysNumber, { color: daysNumColor }]}>{dayDisplay}</Text>
                            <Text style={[styles.daysLabel, { color: colors.textMuted }]}>{dayTextLabel}</Text>
                            <ChipView chipInfo={chipInfo} t={t} colors={colors} />
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => onTogglePin(goal.id)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                                <Text style={[styles.actionIcon, goal.pinned && { color: colors.accentDark }]}>
                                    {goal.pinned ? '⭐' : '☆'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDeletePress} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
                                <Text style={styles.actionIcon}>🗑</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

function ChipView({ chipInfo, t, colors }) {
    const chipStyleMap = {
        done:    { bg: colors.successSoft, text: colors.success },
        good:    { bg: colors.successSoft, text: colors.success },
        warning: { bg: colors.accentBg,    text: '#C28000' },
        urgent:  { bg: colors.dangerSoft,  text: colors.danger },
    };
    const style = chipStyleMap[chipInfo.type] || chipStyleMap.good;
    return (
        <View style={[styles.chip, { backgroundColor: style.bg }]}>
            <Text style={[styles.chipText, { color: style.text }]}>
                {t(chipInfo.key, chipInfo.params)}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    swipeWrapper: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.sm + 2,
        borderRadius: Radii.md,
        overflow: 'hidden',
    },
    revealLeft: {
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    revealRight: {
        position: 'absolute',
        right: 0, top: 0, bottom: 0,
        width: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    revealIcon: { fontSize: 22, fontWeight: '700' },
    card: {
        borderRadius: Radii.md,
        borderWidth: 1,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: Spacing.md,
        paddingRight: Spacing.md,
        paddingLeft: Spacing.sm,
    },
    strip: {
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 3,
        borderTopLeftRadius: Radii.md,
        borderBottomLeftRadius: Radii.md,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#C0C0D0',
        marginTop: 2,
        marginLeft: Spacing.sm,
        marginRight: Spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    checkmark: { color: '#fff', fontSize: 11, fontWeight: '700' },
    body: { flex: 1, minWidth: 0, marginRight: Spacing.sm },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
        flexWrap: 'wrap',
    },
    categoryBadge: {
        borderWidth: 1,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
    },
    categoryBadgeText: { fontSize: Typography.xs, fontWeight: '600' },
    recurringBadge: { fontSize: 12 },
    name: { fontSize: Typography.base, fontWeight: '600', lineHeight: 20, marginBottom: 3 },
    desc: { fontSize: Typography.sm - 1, marginBottom: 4, lineHeight: 18 },
    dateInfo: { fontSize: Typography.xs, marginTop: 4 },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: 5,
    },
    progressBg: {
        flex: 1,
        height: 4,
        borderRadius: Radii.full,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: Radii.full },
    progressLabel: { fontSize: Typography.xs, fontWeight: '600', minWidth: 28, textAlign: 'right' },
    subtaskHint: { fontSize: Typography.xs, marginTop: 3 },
    right: { alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, minWidth: 68 },
    daysBlock: { alignItems: 'center' },
    daysNumber: { fontSize: 22, fontWeight: '700', lineHeight: 26 },
    daysLabel: {
        fontSize: Typography.xs,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    chip: { borderRadius: Radii.full, paddingHorizontal: 7, paddingVertical: 2, marginTop: 2 },
    chipText: { fontSize: 10, fontWeight: '700' },
    actions: { flexDirection: 'row', gap: 6, marginTop: Spacing.sm },
    actionIcon: { fontSize: 16, padding: 4 },
});
