import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { ArrowLeft, Trophy, Flag, Star } from 'lucide-react-native';
import { useTasks } from '../../hooks/useTasks';
import { useGoals } from '../../hooks/useGoals';
import { useDiary } from '../../hooks/useDiary';
import { EmptyState } from '../../components/ui/EmptyState';

export default function CelebrationWall({ navigation }) {
    const { tasks } = useTasks();
    const { goals } = useGoals();
    const { entries } = useDiary();

    const completedGoals = useMemo(
        () => goals.filter(g => g.status === 'completed'),
        [goals]
    );
    const completedMilestones = useMemo(
        () => tasks.filter(t => t.status === 'completed' && t.goalId),
        [tasks]
    );
    const positiveEntries = useMemo(
        () => entries.filter(e => e.mood === 'good').slice(0, 5),
        [entries]
    );

    const hasWins = completedGoals.length > 0 || completedMilestones.length > 0 || positiveEntries.length > 0;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Celebration Wall</Text>
                <View style={{ width: 24 }} />
            </View>

            {!hasWins ? (
                <EmptyState
                    title="Your wins are waiting."
                    subtitle="Complete a step or reach a destination to see them here."
                    icon={Trophy}
                />
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    {completedGoals.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Destinations Reached</Text>
                            {completedGoals.map(g => (
                                <View key={g.id} style={styles.winCard}>
                                    <Trophy size={22} color={Theme.colors.primary} />
                                    <View style={styles.winText}>
                                        <Text style={styles.winTitle}>{g.title}</Text>
                                        <Text style={styles.winSub}>Goal completed</Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    {completedMilestones.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Pit Stops Reached</Text>
                            {completedMilestones.slice(0, 10).map(t => (
                                <View key={t.id} style={styles.winCard}>
                                    <Flag size={22} color={Theme.colors.success} />
                                    <View style={styles.winText}>
                                        <Text style={styles.winTitle}>{t.title}</Text>
                                        <Text style={styles.winSub}>Milestone completed</Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    {positiveEntries.length > 0 && (
                        <>
                            <Text style={styles.sectionTitle}>Positive Memories</Text>
                            {positiveEntries.map(e => (
                                <View key={e.id} style={styles.winCard}>
                                    <Star size={22} color={Theme.colors.warning} />
                                    <View style={styles.winText}>
                                        <Text style={styles.winTitle}>{e.title || 'Reflection'}</Text>
                                        <Text style={styles.winSub} numberOfLines={2}>{e.content}</Text>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
    },
    back: { padding: 8, marginLeft: -8 },
    headerTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
    },
    content: {
        padding: Theme.spacing.lg,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 12,
        marginTop: 8,
    },
    winCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    winText: {
        flex: 1,
        marginLeft: 14,
    },
    winTitle: {
        fontSize: 15,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
        marginBottom: 4,
    },
    winSub: {
        fontSize: 13,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        lineHeight: 18,
    },
});
