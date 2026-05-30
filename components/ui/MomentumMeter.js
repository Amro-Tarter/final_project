import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Theme } from '../components';
import { ProgressBar } from './ProgressRing';

export function MomentumMeter({ level = 0, message }) {
    return (
        <MotiView
            from={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 450, delay: 200 }}
            style={styles.card}
        >
            <View style={styles.header}>
                <Text style={styles.label}>Momentum Level</Text>
                <Text style={styles.value}>{level}%</Text>
            </View>
            <ProgressBar progress={level} height={10} color={Theme.colors.success} />
            <Text style={styles.message}>{message}</Text>
        </MotiView>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Theme.colors.surface,
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
