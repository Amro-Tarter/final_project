import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { Theme } from '../components';

export function EmptyState({ title, subtitle, cta, onPress, icon: Icon }) {
    return (
        <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.container}
        >
            {Icon && (
                <View style={styles.iconWrap}>
                    <Icon size={32} color={Theme.colors.secondary} />
                </View>
            )}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {cta && onPress && (
                <TouchableOpacity style={styles.cta} onPress={onPress} activeOpacity={0.85}>
                    <Text style={styles.ctaText}>{cta}</Text>
                </TouchableOpacity>
            )}
        </MotiView>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 24,
    },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    cta: {
        backgroundColor: Theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: Theme.radii.lg,
        ...Theme.shadows.md,
    },
    ctaText: {
        color: '#fff',
        fontFamily: Theme.typography.subHeader,
        fontSize: 15,
    },
});
