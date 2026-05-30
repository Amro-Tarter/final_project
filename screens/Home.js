import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { Theme } from '../components/components';
import { useTasks } from '../hooks/useTasks';
import { useGoals } from '../hooks/useGoals';
import { useDiary } from '../hooks/useDiary';
import { useUserProfile } from '../hooks/useUserProfile';
import { useNotifications } from '../context/NotificationContext';
import { HeroJourneyCard } from '../components/ui/HeroJourneyCard';
import { CoPilotCard } from '../components/ui/CoPilotCard';
import { TaskStepCard } from '../components/ui/TaskStepCard';
import { MomentumMeter } from '../components/ui/MomentumMeter';
import { ReflectionPromptCard } from '../components/ui/ReflectionPromptCard';
import { SectionHeader } from '../components/ui/SegmentTabs';
import { EmptyState } from '../components/ui/EmptyState';
import { JourneyCopy } from '../constants/JourneyCopy';
import {
    getTimeGreeting,
    getUserDisplayName,
    getPrimaryDestination,
    getCurrentPitStop,
    getNextSteps,
    calculateMomentum,
    getCoPilotMessage,
} from '../utils/journeyHelpers';
import { Plus } from 'lucide-react-native';
import { DailyJourneySnapshot } from '../components/ui/DailyJourneySnapshot';

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const { tasks, loading, toggleTaskStatus } = useTasks();
    const { goals } = useGoals();
    const { entries } = useDiary();
    const { profile } = useUserProfile();
    const { showNotification } = useNotifications();

    const displayName = getUserDisplayName(user);
    const greeting = `${getTimeGreeting()}, ${displayName}`;
    const destination = useMemo(() => getPrimaryDestination(goals), [goals]);
    const pitStop = destination ? getCurrentPitStop(tasks, destination.id) : null;
    const nextSteps = useMemo(() => getNextSteps(tasks, 3), [tasks]);
    const momentum = useMemo(() => calculateMomentum(tasks), [tasks]);
    const coPilotMessage = useMemo(
        () => getCoPilotMessage(profile, tasks, entries),
        [profile, tasks, entries]
    );

    const handleToggle = async (task) => {
        await toggleTaskStatus(task);
        if (task.status !== 'completed') {
            try {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (_) {}
            showNotification('success', 'Step completed! 🌟', 3);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {destination ? (
                    <HeroJourneyCard
                        greeting={greeting}
                        destination={destination.title}
                        progress={destination.progress || 0}
                        pitStop={pitStop?.title}
                        nextStep={nextSteps[0]?.title}
                        onContinue={() => navigation.navigate('GoalDetails', { goalId: destination.id })}
                    />
                ) : (
                    <HeroJourneyCard
                        empty
                        onSetDestination={() => navigation.navigate('GoalForm')}
                    />
                )}

                <DailyJourneySnapshot
                    destination={destination?.title}
                    nextStep={nextSteps[0]?.title}
                    focusTime={user?.onboardingAnswers?.dailyExecutionTime}
                    onPress={() => nextSteps[0] && navigation.navigate('TaskDetails', { taskId: nextSteps[0].id })}
                />

                <CoPilotCard
                    message={coPilotMessage}
                    onPress={() => navigation.navigate('AIChat')}
                />

                <View style={styles.section}>
                    <SectionHeader
                        title="Today's Next Steps"
                        action={nextSteps.length > 0 ? 'See all' : undefined}
                        onAction={() => navigation.navigate('PlanTab')}
                    />
                    {loading ? (
                        <Text style={styles.loadingText}>Loading your path...</Text>
                    ) : nextSteps.length > 0 ? (
                        nextSteps.map(task => (
                            <TaskStepCard
                                key={task.id}
                                task={task}
                                onToggle={() => handleToggle(task)}
                                onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })}
                            />
                        ))
                    ) : (
                        <EmptyState
                            title={JourneyCopy.empty.tasks.title}
                            subtitle={JourneyCopy.empty.tasks.subtitle}
                            cta={JourneyCopy.empty.tasks.cta}
                            onPress={() => navigation.navigate('TaskForm')}
                            icon={Plus}
                        />
                    )}
                </View>

                <MomentumMeter
                    level={momentum}
                    message={
                        momentum >= 60
                            ? "You've been moving consistently toward your goals."
                            : JourneyCopy.home.momentumDefault
                    }
                />

                <ReflectionPromptCard
                    prompt={JourneyCopy.home.reflectionPrompt}
                    onPress={() => navigation.navigate('DiaryForm')}
                />

                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    scroll: {
        padding: Theme.spacing.lg,
        paddingTop: Theme.spacing.md,
    },
    section: {
        marginBottom: 20,
    },
    loadingText: {
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        paddingVertical: 12,
    },
});
