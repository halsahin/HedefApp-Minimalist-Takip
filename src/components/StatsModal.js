import React, { useMemo } from 'react';
import {
    Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, StatusBar,
} from 'react-native';
import { Spacing, Radii, Typography } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { CATEGORIES, getCategoryLabel, CATEGORY_ICON_MAP } from '../constants/categories';
import { calcRemainingDays } from '../utils/dateUtils';

export default function StatsModal({ visible, onClose, goals }) {
    const { colors } = useTheme();
    const { t } = useLanguage();

    const stats = useMemo(() => {
        const total = goals.length;
        const completed = goals.filter(g => g.completed).length;
        const active = goals.filter(g => !g.completed).length;
        const overdue = goals.filter(g => !g.completed && calcRemainingDays(g.deadline) < 0).length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const byCategory = CATEGORIES.map(cat => ({
            key: cat.key,
            icon: CATEGORY_ICON_MAP[cat.key],
            label: getCategoryLabel(cat.key, t),
            count: goals.filter(g => g.category === cat.key).length,
        })).filter(c => c.count > 0);

        return { total, completed, active, overdue, rate, byCategory };
    }, [goals, t]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.root, { backgroundColor: colors.bg }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.title, { color: colors.text }]}>{t('stats.title')}</Text>
                    <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                        <Text style={[styles.closeBtn, { color: colors.textMuted }]}>{t('stats.close')}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={[styles.grid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <StatBox label={t('stats.total')} value={stats.total} icon="🎯" colors={colors} />
                        <StatBox label={t('stats.active')} value={stats.active} icon="⚡" colors={colors} accent />
                        <StatBox label={t('stats.completed')} value={stats.completed} icon="✅" colors={colors} success />
                        <StatBox label={t('stats.overdue')} value={stats.overdue} icon="⏰" colors={colors} danger />
                    </View>

                    <View style={[styles.rateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.rateLabel, { color: colors.textMuted }]}>{t('stats.rate')}</Text>
                        <Text style={[styles.rateValue, { color: colors.accent }]}>{stats.rate}%</Text>
                        <View style={[styles.rateBarBg, { backgroundColor: colors.border }]}>
                            <View
                                style={[styles.rateBarFill, {
                                    width: `${stats.rate}%`,
                                    backgroundColor: colors.accent,
                                }]}
                            />
                        </View>
                    </View>

                    {stats.byCategory.length > 0 && (
                        <View style={[styles.catCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                                {t('stats.byCategory')}
                            </Text>
                            {stats.byCategory.map(cat => (
                                <View key={cat.key} style={styles.catRow}>
                                    <Text style={[styles.catLabel, { color: colors.text }]}>
                                        {cat.icon} {cat.label}
                                    </Text>
                                    <View style={styles.catRight}>
                                        <View style={[styles.catBar, { backgroundColor: colors.border }]}>
                                            <View style={[styles.catBarFill, {
                                                width: `${stats.total > 0 ? Math.round(cat.count / stats.total * 100) : 0}%`,
                                                backgroundColor: colors.accentDark,
                                            }]} />
                                        </View>
                                        <Text style={[styles.catCount, { color: colors.textMuted }]}>{cat.count}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

function StatBox({ label, value, icon, colors, accent, success, danger }) {
    const valueColor = accent ? colors.accentDark : success ? colors.success : danger ? colors.danger : colors.text;
    return (
        <View style={[styles.statBox, { borderColor: colors.border }]}>
            <Text style={styles.statIcon}>{icon}</Text>
            <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
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
    content: { padding: Spacing.lg, gap: Spacing.md },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderRadius: Radii.md,
        borderWidth: 1,
        overflow: 'hidden',
    },
    statBox: {
        width: '50%',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRightWidth: 1,
        borderBottomWidth: 1,
    },
    statIcon: { fontSize: 22, marginBottom: 4 },
    statValue: { fontSize: Typography.xl, fontWeight: '700' },
    statLabel: { fontSize: Typography.xs, marginTop: 2, textAlign: 'center' },
    rateCard: {
        borderRadius: Radii.md,
        borderWidth: 1,
        padding: Spacing.lg,
        alignItems: 'center',
    },
    rateLabel: { fontSize: Typography.sm, marginBottom: 4 },
    rateValue: { fontSize: 40, fontWeight: '700' },
    rateBarBg: {
        width: '100%',
        height: 8,
        borderRadius: Radii.full,
        marginTop: Spacing.md,
        overflow: 'hidden',
    },
    rateBarFill: { height: '100%', borderRadius: Radii.full },
    catCard: {
        borderRadius: Radii.md,
        borderWidth: 1,
        padding: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.md,
    },
    catRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    catLabel: { flex: 1, fontSize: Typography.sm },
    catRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    catBar: {
        width: 80,
        height: 6,
        borderRadius: Radii.full,
        overflow: 'hidden',
    },
    catBarFill: { height: '100%', borderRadius: Radii.full },
    catCount: { fontSize: Typography.sm, fontWeight: '600', minWidth: 20, textAlign: 'right' },
});
