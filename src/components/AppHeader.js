import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

/**
 * AppHeader — sticky top bar with logo and stats badges.
 * Mirrors the web app's <header class="app-header">.
 */
export default function AppHeader({ totalCount, dueCount }) {
    return (
        <View style={styles.header}>
            <View style={styles.logo}>
                <Text style={styles.logoIcon}>✦</Text>
                <Text style={styles.logoText}>Hedeflerim</Text>
            </View>
            <View style={styles.badges}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalCount} Hedef</Text>
                </View>
                {dueCount > 0 && (
                    <View style={[styles.badge, styles.badgeAccent]}>
                        <Text style={[styles.badgeText, styles.badgeTextAccent]}>
                            {dueCount} Yaklaşan
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
    },
    logo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    logoIcon: {
        fontSize: 16,
        color: Colors.accentDark,
    },
    logoText: {
        fontSize: Typography.md,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.3,
    },
    badges: {
        flexDirection: 'row',
        gap: Spacing.xs,
        alignItems: 'center',
    },
    badge: {
        backgroundColor: Colors.surface2,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: 3,
    },
    badgeAccent: {
        backgroundColor: Colors.accentBg,
        borderColor: Colors.accent,
    },
    badgeText: {
        fontSize: Typography.xs,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    badgeTextAccent: {
        color: '#8A7200',
    },
});
