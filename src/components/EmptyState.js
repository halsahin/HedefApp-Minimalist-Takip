import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

/**
 * EmptyState — shown when the goal list is empty.
 * Mirrors <div class="empty-state">.
 */
export default function EmptyState({ onAddPress }) {
    return (
        <View style={styles.container}>
            <Text style={styles.icon}>🎯</Text>
            <Text style={styles.title}>Henüz hedef yok</Text>
            <Text style={styles.desc}>
                İlk hedefinizi eklemek için{'\n'}"Yeni Hedef" butonuna tıklayın.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={onAddPress} activeOpacity={0.8}>
                <Text style={styles.btnText}>+ İlk Hedefinizi Ekleyin</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxl,
    },
    icon: {
        fontSize: 56,
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography.md,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    desc: {
        fontSize: Typography.base - 1,
        color: Colors.textMuted,
        marginBottom: Spacing.xl,
        textAlign: 'center',
        lineHeight: 22,
    },
    btn: {
        backgroundColor: Colors.accent,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md - 2,
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 3,
    },
    btnText: {
        fontSize: Typography.base - 1,
        fontWeight: '700',
        color: '#5A4800',
    },
});
