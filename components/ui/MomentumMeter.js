import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from './GlassCard';
import { MotiView } from 'moti';
import { Theme } from '../components';
import { ProgressBar } from './ProgressRing';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export function MomentumMeter({ level = 0, message }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    return (
        <MotiView
            from={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 450, delay: 200 }}
            style={{ marginBottom: 20 }}
        >
            <GlassCard style={[styles.card, { borderColor: colors.border }]}>
            <View style={styles.header}>
                <Text style={[styles.label, { color: colors.textMain }]}>{t('momentumLevel')}</Text>
                <Text style={[styles.value, { color: colors.success }]}>{level}%</Text>
            </View>
            <ProgressBar progress={level} height={10} color={colors.success} />
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
            </GlassCard>
        </MotiView>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Theme.radii.lg,
        padding: 20,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    label: {
        fontSize: 15,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
    },
    value: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
        color: Theme.colors.success,
    },
    message: {
        marginTop: 12,
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        lineHeight: 20,
    },
});
