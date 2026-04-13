import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Typography, Spacing, Radii } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function AppHeader({ totalCount, dueCount, onMenuPress, folderName, onFolderPress }) {
    const { t } = useLanguage();
    const { colors } = useTheme();

    return (
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            {/* Tıklanabilir klasör/başlık */}
            <TouchableOpacity style={styles.titleArea} onPress={onFolderPress} activeOpacity={0.75}>
                <Text style={[styles.logoIcon, { color: colors.accentDark }]}>✦</Text>
                <Text style={[styles.logoText, { color: colors.text }]} numberOfLines={1}>
                    {folderName ?? t('header.title')}
                </Text>
                <Text style={[styles.dropArrow, { color: colors.textMuted }]}>▾</Text>
            </TouchableOpacity>

            <View style={styles.right}>
                <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                        <Text style={[styles.badgeText, { color: colors.textMuted }]}>
                            {t('header.goals', { n: totalCount })}
                        </Text>
                    </View>
                    {dueCount > 0 && (
                        <View style={[styles.badge, { backgroundColor: colors.accentBg, borderColor: colors.accent }]}>
                            <Text style={[styles.badgeText, { color: '#8A7200' }]}>
                                {t('header.upcoming', { n: dueCount })}
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress} activeOpacity={0.75}>
                    <View style={[styles.line, { backgroundColor: colors.text }]} />
                    <View style={[styles.line, styles.lineMid, { backgroundColor: colors.text }]} />
                    <View style={[styles.line, { backgroundColor: colors.text }]} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    titleArea: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        flexShrink: 1,
        maxWidth: '55%',
    },
    logoIcon: { fontSize: 16 },
    logoText: { fontSize: Typography.md, fontWeight: '700', letterSpacing: -0.3, flexShrink: 1 },
    dropArrow: { fontSize: 20, fontWeight: '700', lineHeight: 22 },
    right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    badges: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
    badge: { borderWidth: 1, borderRadius: Radii.full, paddingHorizontal: Spacing.sm + 2, paddingVertical: 3 },
    badgeText: { fontSize: Typography.xs, fontWeight: '600' },
    menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', gap: 5 },
    line: { width: 20, height: 2, borderRadius: 1 },
    lineMid: { width: 14 },
});
