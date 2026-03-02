import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

const FILTERS = [
    { key: 'all', label: 'Tümü' },
    { key: 'active', label: 'Aktif' },
    { key: 'completed', label: 'Tamamlanan' },
    { key: 'pinned', label: '⭐ Favori' },
];

/**
 * FilterTabs — horizontal tab row, tightly wraps its content.
 * alignSelf: 'flex-start' on tabGroup prevents vertical stretching.
 */
export default function FilterTabs({ filterBy, onFilterChange }) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.tabGroup}>
                {FILTERS.map(f => {
                    const active = filterBy === f.key;
                    return (
                        <TouchableOpacity
                            key={f.key}
                            style={[styles.tab, active && styles.tabActive]}
                            onPress={() => onFilterChange(f.key)}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.tabText, active && styles.tabTextActive]}>
                                {f.label}
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
        // İçeriği dikeyde sıkıştır; ScrollView yüksekliği içeriğe göre ölçeklesin
        alignItems: 'flex-start',
    },
    tabGroup: {
        flexDirection: 'row',
        alignItems: 'center',   // sekmeler dikeyde ortada
        alignSelf: 'flex-start', // beyaz kutu yalnızca sekmeleri sarar, uzamaz
        gap: Spacing.xs,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.md,
        padding: 4,
    },
    tab: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: Radii.sm,
    },
    tabActive: {
        backgroundColor: Colors.accent,
    },
    tabText: {
        fontSize: Typography.sm,
        fontWeight: '500',
        color: Colors.textMuted,
        lineHeight: 18,
    },
    tabTextActive: {
        fontWeight: '700',
        color: '#5A4800',
    },
});
