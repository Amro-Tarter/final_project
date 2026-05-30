import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../components';
import { Sun } from 'lucide-react-native';

export function DailyJourneySnapshot({ destination, nextStep, focusTime, onPress }) {
    if (!nextStep && !destination) return null;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.9 : 1}>
            <View style={styles.iconWrap}>
                <Sun size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.content}>
                <Text style={styles.label}>Today's Journey Snapshot</Text>
                {destination && (
                    <Text style={styles.line} numberOfLines={1}>
                        Destination: <Text style={styles.bold}>{destination}</Text>
                    </Text>
                )}
                {nextStep && (
                    <Text style={styles.line} numberOfLines={1}>
                        Next step: <Text style={styles.bold}>{nextStep}</Text>
                    </Text>
                )}
                {focusTime && (
                    <Text style={styles.hint}>Suggested focus: {focusTime}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    content: { flex: 1 },
    label: {
        fontSize: 11,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 8,
    },
    line: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginBottom: 4,
    },
    bold: {
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
    },
    hint: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginTop: 4,
    },
});
