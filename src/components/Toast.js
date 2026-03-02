import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

/**
 * Toast — animated notification that slides up from bottom and auto-hides.
 * Mirrors the web toast implementation.
 *
 * Usage: pass `message` (string | null). When message changes to a truthy
 * value the toast shows; parent can clear it with onHide callback.
 */
export default function Toast({ message, onHide }) {
    const translateY = useRef(new Animated.Value(80)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timerRef = useRef(null);
    const animRef = useRef(null);

    useEffect(() => {
        if (!message) return;

        // Önceki animasyonu durdur
        animRef.current?.stop();

        // Show
        const showAnim = Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 280,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
        ]);
        animRef.current = showAnim;
        showAnim.start();

        // Auto-hide after 2.8s
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const hideAnim = Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 80,
                    duration: 280,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]);
            animRef.current = hideAnim;
            hideAnim.start(() => onHide?.());
        }, 2800);

        return () => {
            clearTimeout(timerRef.current);
            animRef.current?.stop();
        };
    }, [message]);

    if (!message) return null;

    return (
        <Animated.View
            style={[
                styles.toast,
                { transform: [{ translateY }], opacity },
            ]}
            pointerEvents="none"
        >
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        bottom: 90,   // above the AdBannerComponent
        alignSelf: 'center',
        backgroundColor: Colors.text,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm + 2,
        borderRadius: Radii.full,
        maxWidth: '85%',
    },
    text: {
        color: '#fff',
        fontSize: Typography.sm,
        fontWeight: '500',
        textAlign: 'center',
    },
});
