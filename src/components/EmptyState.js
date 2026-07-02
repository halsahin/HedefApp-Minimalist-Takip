import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Typography, Spacing, Radii, Shadows } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';

const FEATURE_ICONS = {
    f1: 'plus-circle',
    f2: 'smartphone',
    f3: 'bell',
    f4: 'trending-up'
};

export default function EmptyState({ onAddPress }) {
    const { t } = useLanguage();
    const { colors, isDark } = useTheme();

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            bounces={false}
        >
            {/* Hero */}
            <View style={styles.hero}>
                <View style={[styles.heroIconWrap, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                    <Feather name="target" size={40} color={isDark ? colors.accent : colors.accentDark} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>{t('empty.title')}</Text>
                <Text style={[styles.desc, { color: colors.textMuted }]}>{t('empty.desc')}</Text>
            </View>

            {/* Feature cards */}
            <View style={styles.features}>
                {Object.keys(FEATURE_ICONS).map(key => (
                    <View
                        key={key}
                        style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                        <View style={[styles.featureIconWrap, { backgroundColor: colors.surface2 }]}>
                            <Feather name={FEATURE_ICONS[key]} size={20} color={colors.textMuted} />
                        </View>
                        <View style={styles.featureText}>
                            <Text style={[styles.featureTitle, { color: colors.text }]}>
                                {t(`empty.${key}.title`)}
                            </Text>
                            <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                                {t(`empty.${key}.desc`)}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* CTA */}
            <TouchableOpacity 
                style={[styles.btn, { backgroundColor: colors.accent, shadowColor: colors.accent }]} 
                onPress={onAddPress} 
                activeOpacity={0.8}
            >
                <Text style={[styles.btnText, { color: colors.bg }]}>{t('empty.btn')}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.xxl,
    },
    hero: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    heroIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        borderWidth: 1,
    },
    title: {
        fontSize: Typography.lg,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: Spacing.xs,
        letterSpacing: -0.3,
    },
    desc: {
        fontSize: Typography.base - 1,
        textAlign: 'center',
        lineHeight: 22,
    },
    features: {
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Radii.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.md,
        ...Shadows.sm,
    },
    featureIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: Typography.base - 1,
        fontWeight: '700',
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: Typography.sm,
        lineHeight: 18,
    },
    btn: {
        borderRadius: Radii.md,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 3,
    },
    btnText: {
        fontSize: Typography.base,
        fontWeight: '700',
    },
});
