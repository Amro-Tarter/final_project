import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../components';
import { useAppTheme } from '../../context/ThemeContext';

export function EmptyState({ title, subtitle, cta, onPress, icon: Icon }) {
    const { colors } = useAppTheme();
    return (
        <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.container}
        >
            {Icon && (
                <View style={[styles.iconWrap, { backgroundColor: colors.secondaryLight }]}>
                    <Icon size={32} color={colors.secondary} />
                </View>
            )}
            <Text style={[styles.title, { color: colors.textMain }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            {cta && onPress && (
                <TouchableOpacity style={styles.ctaWrapper} onPress={onPress} activeOpacity={0.85}>
                    <LinearGradient
                        colors={Theme.gradients.hero}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.ctaGradient}
                    >
                        <Text style={styles.ctaText}>{cta}</Text>
                    </LinearGradient>
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
    ctaWrapper: {
        borderRadius: Theme.radii.lg,
        ...Theme.shadows.glow,
    },
    ctaGradient: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: Theme.radii.lg,
    },
    ctaText: {
        color: '#fff',
        fontFamily: Theme.typography.subHeader,
        fontSize: 15,
    },
});
