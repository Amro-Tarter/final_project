import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { Plus, Map } from 'lucide-react-native';
import { useGoals } from '../../hooks/useGoals';
import { useTasks } from '../../hooks/useTasks';
import { DestinationCard } from '../../components/ui/JourneyCards';
import { EmptyState } from '../../components/ui/EmptyState';
import { JourneyCopy } from '../../constants/JourneyCopy';
import { getCurrentPitStop, getGoalTasks } from '../../utils/journeyHelpers';

export default function GoalList({ navigation }) {
    const { goals, loading } = useGoals();
    const { tasks } = useTasks();

    const activeGoals = useMemo(
        () => goals.filter(g => g.status !== 'completed'),
        [goals]
    );

    const renderItem = ({ item }) => {
        const pitStop = getCurrentPitStop(tasks, item.id);
        const remaining = getGoalTasks(tasks, item.id).filter(t => t.status === 'pending').length;

        return (
            <DestinationCard
                goal={item}
                pitStop={pitStop?.title}
                remainingStops={remaining}
                onPress={() => navigation.navigate('GoalDetails', { goalId: item.id })}
            />
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Your Journey</Text>
                    <Text style={styles.headerSub}>Destinations you're heading toward</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('GoalForm')}
                >
                    <Plus size={24} color={Theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={activeGoals}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    loading ? (
                        <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 60 }} />
                    ) : (
                        <EmptyState
                            title={JourneyCopy.empty.goals.title}
                            subtitle={JourneyCopy.empty.goals.subtitle}
                            cta={JourneyCopy.empty.goals.cta}
                            onPress={() => navigation.navigate('GoalForm')}
                            icon={Map}
                        />
                    )
                }
            />
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
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
    },
    headerTitle: {
        fontSize: 26,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
    },
    headerSub: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginTop: 4,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: Theme.spacing.lg,
        paddingTop: 0,
        flexGrow: 1,
    },
});
