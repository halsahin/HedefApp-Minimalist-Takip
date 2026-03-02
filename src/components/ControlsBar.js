import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

const SORT_OPTIONS = [
    { key: 'days', label: 'Kalan Güne Göre' },
    { key: 'date', label: 'Tarihe Göre' },
    { key: 'category', label: 'Kategoriye Göre' },
    { key: 'name', label: 'Ada Göre' },
];

/**
 * ControlsBar — sort selector + "Yeni Hedef" button.
 * Mirrors <div class="controls-bar">.
 *
 * Since React Native has no native <select>, we implement a
 * simple inline dropdown that toggles on press.
 */
export default function ControlsBar({ sortBy, onSortChange, onAddPress }) {
    const [open, setOpen] = useState(false);
    const current = SORT_OPTIONS.find(o => o.key === sortBy) || SORT_OPTIONS[0];

    return (
        <View style={styles.bar}>
            {/* Sort dropdown */}
            <View style={styles.sortGroup}>
                <Text style={styles.sortLabel}>Sırala:</Text>
                <View>
                    <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setOpen(v => !v)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.selectorText}>{current.label}</Text>
                        <Text style={styles.arrow}>{open ? '▴' : '▾'}</Text>
                    </TouchableOpacity>

                    {open && (
                        <View style={styles.dropdown}>
                            {SORT_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[
                                        styles.dropdownItem,
                                        opt.key === sortBy && styles.dropdownItemActive,
                                    ]}
                                    onPress={() => {
                                        onSortChange(opt.key);
                                        setOpen(false);
                                    }}
                                    activeOpacity={0.75}
                                >
                                    <Text
                                        style={[
                                            styles.dropdownText,
                                            opt.key === sortBy && styles.dropdownTextActive,
                                        ]}
                                    >
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            {/* Add button */}
            <TouchableOpacity
                style={styles.addBtn}
                onPress={onAddPress}
                activeOpacity={0.8}
            >
                <Text style={styles.addBtnText}>+ Yeni Hedef</Text>
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
    sortLabel: {
        fontSize: Typography.sm,
        fontWeight: '500',
        color: Colors.textMuted,
    },
    selector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: 6,
    },
    selectorText: {
        fontSize: Typography.sm,
        fontWeight: '500',
        color: Colors.text,
    },
    arrow: {
        fontSize: 10,
        color: Colors.textMuted,
    },
    dropdown: {
        position: 'absolute',
        top: 34,
        left: 0,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
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
    dropdownItemActive: {
        backgroundColor: Colors.accentBg,
    },
    dropdownText: {
        fontSize: Typography.sm,
        color: Colors.text,
    },
    dropdownTextActive: {
        fontWeight: '700',
        color: '#5A4800',
    },
    addBtn: {
        backgroundColor: Colors.accent,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 3,
    },
    addBtnText: {
        fontSize: Typography.sm,
        fontWeight: '700',
        color: '#5A4800',
    },
});
