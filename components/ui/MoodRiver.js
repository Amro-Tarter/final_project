import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Theme } from '../components';

export function MoodRiver({ moods = [] }) {
    const display = moods.length >= 7 ? moods.slice(-7) : [...Array(7 - moods.length).fill('·'), ...moods];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mood River</Text>
            <Text style={styles.subtitle}>Past 7 days</Text>
            <View style={styles.river}>
                {display.map((emoji, i) => (
                    <MotiView
                        key={i}
                        from={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'timing', duration: 300, delay: i * 60 }}
                        style={styles.moodDot}
                    >
                        <Text style={styles.emoji}>{emoji}</Text>
                    </MotiView>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 20,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
    },
    subtitle: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginBottom: 16,
    },
    river: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    moodDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 18,
    },
});
