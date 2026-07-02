import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Typography, Spacing, Radii } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const FILTER_KEYS = [
    { key: 'all',       tKey: 'filter.all' },
    { key: 'active',    tKey: 'filter.active' },
    { key: 'completed', tKey: 'filter.completed' },
    { key: 'pinned',    tKey: 'filter.pinned' },
];

export default function FilterTabs({ filterBy, onFilterChange }) {
    const { t } = useLanguage();
    const { colors, isDark } = useTheme();

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={[styles.tabGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {FILTER_KEYS.map(f => {
                    const active = filterBy === f.key;
                    return (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.tab, active && { backgroundColor: colors.accent }]}
                            onPress={() => onFilterChange(f.key)}
                            activeOpacity={0.75}
                        >
                            <Text style={[
                                styles.tabText, 
                                { 
                                    color: active ? colors.bg : colors.textMuted,
                                    fontWeight: active ? '700' : '500'
                                }
                            ]}>
                                {t(f.tKey)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.sm,
        alignItems: 'flex-start',
    },
    tabGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: Spacing.xs,
        borderWidth: 1,
        borderRadius: Radii.md,
        padding: 4,
    },
    tab: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: Radii.sm,
    },
    tabText: { fontSize: Typography.sm, fontWeight: '500', lineHeight: 18 },
});
