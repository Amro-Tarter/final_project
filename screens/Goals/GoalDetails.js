import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Theme, MyButton, NovaButton } from '../../components/components';
import { ArrowLeft, MapPin, CheckCircle2, Circle, Flag } from 'lucide-react-native';
import { useGoals } from '../../hooks/useGoals';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../context/NotificationContext';
import { CelebrationModal } from '../../components/ui/JourneyCards';
import { ProgressBar } from '../../components/ui/ProgressRing';

export default function GoalDetails({ navigation, route }) {
    const goalId = route?.params?.goalId;
    const [showCelebration, setShowCelebration] = useState(false);

    const { goals, updateGoal, deleteGoal } = useGoals();
    const { tasks, deleteTask } = useTasks();
    const { showNotification } = useNotifications();

    const goalTasks = tasks.filter(t => t.goalId === goalId);
    const hasTasks = goalTasks.length > 0;
    const allTasksCompleted = hasTasks && goalTasks.every(t => t.status === 'completed');
    const goal = goals.find(g => g.id === goalId);

    const currentIndex = goalTasks.findIndex(t => t.status === 'pending');

    if (!goal) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={Theme.colors.textMain} />
                    </TouchableOpacity>
                </View>
                <View style={styles.notFound}>
                    <Text style={styles.notFoundText}>This destination couldn't be found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const pct = Math.round((goal.progress || 0) * 100);

    const handleComplete = async () => {
        Alert.alert(
            'Destination Reached',
            'Congratulations on finishing your journey to this destination!',
            [
                { text: 'Not yet', style: 'cancel' },
                {
                    text: 'Complete Journey',
                    onPress: async () => {
                        await updateGoal(goal.id, { status: 'completed', progress: 1 });
                        try {
                            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (_) {}
                        setShowCelebration(true);
                    },
                },
            ]
        );
    };

    const handleDelete = () => {
        Alert.alert(
            'Remove Destination',
            'This will remove the destination and all linked pit stops.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await Promise.all(goalTasks.map(task => deleteTask(task.id)));
                            await deleteGoal(goal.id);
                            showNotification('warning', `Destination "${goal.title}" removed`);
                            navigation.goBack();
                        } catch (e) {
                            showNotification('error', 'Could not remove destination');
                        }
                    },
                },
            ]
        );
    };

    const getStopState = (index, task) => {
        if (task.status === 'completed') return 'completed';
        if (index === currentIndex) return 'current';
        return 'future';
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Journey Roadmap</Text>
                <TouchableOpacity onPress={() => navigation.navigate('GoalForm', { goal })}>
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={Theme.gradients.hero}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroBanner}
                >
                    <Text style={styles.heroLabel}>Destination</Text>
                    <Text style={styles.heroTitle}>{goal.title}</Text>
                    <Text style={styles.heroProgress}>{pct}% of the journey</Text>
                    <ProgressBar progress={pct} height={6} color="rgba(255,255,255,0.85)" />
                    {goal.deadline && (
                        <Text style={styles.heroDeadline}>Target: {goal.deadline}</Text>
                    )}
                </LinearGradient>

                <Text style={styles.sectionTitle}>Your Route</Text>

                <View style={styles.timeline}>
                    <View style={styles.routeLine} />

                    {goalTasks.map((item, index) => {
                        const state = getStopState(index, item);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.stopRow}
                                onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
                                activeOpacity={0.85}
                            >
                                <View style={styles.markerCol}>
                                    {state === 'completed' ? (
                                        <MotiView
                                            from={{ scale: 0.8 }}
                                            animate={{ scale: 1 }}
                                            style={[styles.marker, styles.markerDone]}
                                        >
                                            <CheckCircle2 size={22} color={Theme.colors.success} />
                                        </MotiView>
                                    ) : state === 'current' ? (
                                        <MotiView
                                            from={{ scale: 1 }}
                                            animate={{ scale: [1, 1.08, 1] }}
                                            transition={{ loop: true, type: 'timing', duration: 2000 }}
                                            style={[styles.marker, styles.markerCurrent]}
                                        >
                                            <Flag size={18} color={Theme.colors.primary} />
                                        </MotiView>
                                    ) : (
                                        <View style={[styles.marker, styles.markerFuture]}>
                                            <Circle size={20} color={Theme.colors.border} />
                                        </View>
                                    )}
                                </View>

                                <View style={[
                                    styles.stopCard,
                                    state === 'current' && styles.stopCardCurrent,
                                    state === 'completed' && styles.stopCardDone,
                                ]}>
                                    <Text style={styles.stopLabel}>
                                        {state === 'completed' ? 'Pit Stop · Done' : state === 'current' ? 'Current Pit Stop' : 'Upcoming Stop'}
                                    </Text>
                                    <Text style={[
                                        styles.stopTitle,
                                        state === 'completed' && styles.stopTitleDone,
                                    ]}>
                                        {item.title}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    <View style={styles.stopRow}>
                        <View style={styles.markerCol}>
                            <View style={[styles.marker, styles.markerFinish]}>
                                <MapPin size={20} color={Theme.colors.secondary} />
                            </View>
                        </View>
                        <Text style={styles.finishLabel}>Finish Line</Text>
                    </View>
                </View>

                <MyButton
                    title={goal.status === 'completed' ? 'Journey Completed 🎉' : 'Mark Destination Complete'}
                    disabled={goal.status === 'completed' || !allTasksCompleted}
                    style={{
                        marginTop: Theme.spacing.lg,
                        backgroundColor: goal.status === 'completed' ? Theme.colors.success : Theme.colors.primary,
                    }}
                    onPress={handleComplete}
                />

                <NovaButton
                    title="Plan Roadmap with Nova"
                    onPress={() => {
                        const intentText = `I want to plan the roadmap for my goal: "${goal.title}". Can we break it down into milestones?`;
                        const hiddenContext = `The user wants to expand the roadmap for their existing goal "${goal.title}". DO NOT execute any tools yet. Analyze their progress and discuss adding structured milestones (tasks) to help them finish. MUST FOLLOW ROADMAP GENERATION RULES based on their Main Struggle. ONLY use the create_roadmap tool after they explicitly agree. When you use the create_roadmap tool, use the goal name "${goal.title}".`;
                        navigation.navigate('AIChat', {
                            initialIntentText: intentText,
                            hiddenContext,
                            isSilent: true,
                        });
                    }}
                    style={{ marginTop: Theme.spacing.md }}
                />

                <MyButton
                    title="Add Pit Stop Manually"
                    type="secondary"
                    onPress={() => navigation.navigate('TaskForm', { prefilledGoalId: goal.id })}
                    style={{ marginTop: Theme.spacing.sm }}
                />

                <MyButton
                    title="Remove Destination"
                    type="secondary"
                    onPress={handleDelete}
                    style={{ marginTop: Theme.spacing.sm, borderColor: Theme.colors.error, marginBottom: 40 }}
                />
            </ScrollView>

            <CelebrationModal
                visible={showCelebration}
                title={goal.title}
                message="You've reached your destination. Take a moment to appreciate how far you've come."
                onClose={() => {
                    setShowCelebration(false);
                    showNotification('success', `🎉 Destination reached: ${goal.title}`, 4);
                    navigation.goBack();
                }}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
    },
    editText: {
        fontSize: 16,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
    },
    content: {
        padding: Theme.spacing.lg,
        paddingTop: 0,
    },
    notFound: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notFoundText: {
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
    },
    heroBanner: {
        borderRadius: Theme.radii.lg,
        padding: 24,
        marginBottom: 24,
        ...Theme.shadows.hero,
    },
    heroLabel: {
        fontSize: 11,
        fontFamily: Theme.typography.subHeader,
        color: 'rgba(255,255,255,0.75)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    heroTitle: {
        fontSize: 24,
        fontFamily: Theme.typography.header,
        color: '#fff',
        marginBottom: 12,
    },
    heroProgress: {
        fontSize: 13,
        fontFamily: Theme.typography.subHeader,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 8,
    },
    heroDeadline: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 16,
    },
    timeline: {
        position: 'relative',
        paddingLeft: 4,
    },
    routeLine: {
        position: 'absolute',
        left: 27,
        top: 20,
        bottom: 40,
        width: 3,
        backgroundColor: Theme.colors.primaryBorder,
        borderRadius: 2,
    },
    stopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    markerCol: {
        width: 48,
        alignItems: 'center',
    },
    marker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Theme.colors.border,
    },
    markerDone: {
        borderColor: Theme.colors.success,
        backgroundColor: Theme.colors.successLight,
    },
    markerCurrent: {
        borderColor: Theme.colors.primary,
        backgroundColor: Theme.colors.primaryLight,
    },
    markerFuture: {
        borderColor: Theme.colors.border,
    },
    markerFinish: {
        borderColor: Theme.colors.secondary,
        backgroundColor: Theme.colors.primaryLight,
    },
    stopCard: {
        flex: 1,
        backgroundColor: Theme.colors.surface,
        padding: 16,
        borderRadius: Theme.radii.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    stopCardCurrent: {
        borderColor: Theme.colors.primary,
        backgroundColor: Theme.colors.primaryLightAlt,
    },
    stopCardDone: {
        opacity: 0.85,
    },
    stopLabel: {
        fontSize: 11,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    stopTitle: {
        fontSize: 16,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
    },
    stopTitleDone: {
        textDecorationLine: 'line-through',
        color: Theme.colors.textSecondary,
    },
    finishLabel: {
        marginTop: 10,
        fontSize: 16,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
    },
});
