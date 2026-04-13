import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Typography, Spacing, Radii } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const SORT_OPTIONS = [
    { key: 'days', tKey: 'sort.byDays' },
    { key: 'date', tKey: 'sort.byDate' },
    { key: 'category', tKey: 'sort.byCategory' },
    { key: 'name', tKey: 'sort.byName' },
];

export default function ControlsBar({ sortBy, onSortChange, onAddPress }) {
    const { t } = useLanguage();
    const { colors } = useTheme();
    const [open, setOpen] = useState(false);
    const current = SORT_OPTIONS.find(o => o.key === sortBy) || SORT_OPTIONS[0];

    return (
        <View style={styles.bar}>
            <View style={styles.sortGroup}>
                <Text style={[styles.sortLabel, { color: colors.textMuted }]}>{t('sort.label')}</Text>
                <View>
                    <TouchableOpacity
                        style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => setOpen(v => !v)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.selectorText, { color: colors.text }]}>{t(current.tKey)}</Text>
                        <Text style={[styles.arrow, { color: colors.textMuted }]}>{open ? '▴' : '▾'}</Text>
                    </TouchableOpacity>

                    {open && (
                        <View style={[styles.dropdown, {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                        }]}>
                            {SORT_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[styles.dropdownItem,
                                    opt.key === sortBy && { backgroundColor: colors.accentBg }
                                    ]}
                                    onPress={() => { onSortChange(opt.key); setOpen(false); }}
                                    activeOpacity={0.75}
                                >
                                    <Text style={[styles.dropdownText, { color: colors.text },
                                    opt.key === sortBy && { fontWeight: '700', color: '#5A4800' }
                                    ]}>
                                        {t(opt.tKey)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={onAddPress} activeOpacity={0.8}>
                <Text style={styles.addBtnText}>{t('btn.newGoal')}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
    },
    sortGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        flex: 1,
    },
    sortLabel: { fontSize: Typography.sm, fontWeight: '500' },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: 6,
    },
    selectorText: { fontSize: Typography.sm, fontWeight: '500' },
    arrow: { fontSize: 14, fontWeight: '700' },
    dropdown: {
        position: 'absolute',
        top: 34,
        left: 0,
        borderWidth: 1,
        borderRadius: Radii.sm,
        zIndex: 1000,
        minWidth: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    dropdownItem: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.sm - 2,
    },
    dropdownText: { fontSize: Typography.sm },
    addBtn: {
        backgroundColor: '#F9E55A',
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        shadowColor: '#F9E55A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 3,
    },
    addBtnText: { fontSize: Typography.sm, fontWeight: '700', color: '#5A4800' },
});
