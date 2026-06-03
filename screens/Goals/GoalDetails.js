import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Theme, MyButton, NovaButton, MyConfirmAlert } from '../../components/components';
import { ArrowLeft, MapPin, Circle, Check, Target } from 'lucide-react-native';
import { useGoals } from '../../hooks/useGoals';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../context/NotificationContext';
import { CelebrationModal } from '../../components/ui/JourneyCards';
import { ProgressBar } from '../../components/ui/ProgressRing';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function GoalDetails({ navigation, route }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const goalId = route?.params?.goalId;
    const [showCelebration, setShowCelebration] = useState(false);
    const [completeAlertVisible, setCompleteAlertVisible] = useState(false);
    const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);

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
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.textMain} />
                    </TouchableOpacity>
                </View>
                <View style={styles.notFound}>
                    <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>{t('goalNotFound')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const pct = Math.round((goal.progress || 0) * 100);

    const handleComplete = async () => {
        setCompleteAlertVisible(true);
    };

    const handleDelete = () => {
        setDeleteAlertVisible(true);
    };

    const getStopState = (index, task) => {
        if (task.status === 'completed') return 'completed';
        if (index === currentIndex) return 'current';
        return 'future';
    };

    return (
        <>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.textMain} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.textMain }]}>{t('journeyRoadmap')}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('GoalForm', { goal })}>
                        <Text style={[styles.editText, { color: colors.primary }]}>{t('editLabel')}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 600 }}
                    >
                        <LinearGradient
                            colors={Theme.gradients.hero}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroBanner}
                        >
                            <Text style={styles.heroLabel}>{t('goalLabel')}</Text>
                            <Text style={styles.heroTitle}>{goal.title}</Text>
                            <Text style={styles.heroProgress}>{pct}% {t('ofTheJourney')}</Text>
                            <ProgressBar progress={pct} height={6} color="rgba(255,255,255,0.85)" />
                            {goal.deadline && (
                                <Text style={styles.heroDeadline}>{t('targetDate')} {goal.deadline}</Text>
                            )}
                        </LinearGradient>
                    </MotiView>

                    <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('yourRoute')}</Text>

                    <View style={styles.timeline}>
                        <View style={[styles.routeLine, { backgroundColor: colors.primaryBorder }]} />

                        {goalTasks.map((item, index) => {
                            const state = getStopState(index, item);
                            const isDone = state === 'completed';
                            const isCurrent = state === 'current';
                            return (
                                <MotiView
                                    key={item.id}
                                    from={{ opacity: 0, translateX: -10 }}
                                    animate={{ opacity: 1, translateX: 0 }}
                                    transition={{ type: 'timing', duration: 400, delay: index * 100 + 300 }}
                                >
                                    <TouchableOpacity
                                        style={styles.stopRow}
                                        onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
                                        activeOpacity={0.85}
                                    >
                                        <View style={styles.markerCol}>
                                            {isDone ? (
                                                <MotiView
                                                    from={{ scale: 0.8 }}
                                                    animate={{ scale: 1 }}
                                                    style={[styles.marker, styles.markerDone, { borderColor: colors.success, backgroundColor: colors.successLight }]}
                                                >
                                                    <Check size={18} color={colors.success} />
                                                </MotiView>
                                            ) : isCurrent ? (
                                                <MotiView
                                                    from={{ scale: 1 }}
                                                    animate={{ scale: [1, 1.08, 1] }}
                                                    transition={{ loop: true, type: 'timing', duration: 2000 }}
                                                >
                                                    <LinearGradient
                                                        colors={Theme.gradients.hero}
                                                        start={{ x: 0, y: 0 }}
                                                        end={{ x: 1, y: 1 }}
                                                        style={styles.markerGradient}
                                                    >
                                                        <MapPin size={18} color="#fff" />
                                                    </LinearGradient>
                                                </MotiView>
                                            ) : (
                                                <View style={[styles.marker, styles.markerFuture, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                                                    <Circle size={20} color={colors.border} />
                                                </View>
                                            )}
                                        </View>

                                    <View style={[
                                    styles.stopCard,
                                    { backgroundColor: colors.surface, borderColor: colors.border },
                                    state === 'current' && [styles.stopCardCurrent, { borderColor: colors.primary, backgroundColor: colors.primaryLightAlt }],
                                    state === 'completed' && styles.stopCardDone,
                                ]}>
                                    <Text style={[styles.stopLabel, { color: colors.textSecondary }]}>
                                        {state === 'completed' ? t('taskDone') : state === 'current' ? t('currentTask') : t('upcomingTask')}
                                    </Text>
                                    <Text style={[
                                        styles.stopTitle,
                                        { color: colors.textMain },
                                        state === 'completed' && [styles.stopTitleDone, { color: colors.textSecondary }],
                                    ]}>
                                        {item.title}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </MotiView>
                        );
                    })}

                    <View style={styles.stopRow}>
                        <View style={styles.markerCol}>
                            <View style={[styles.marker, styles.markerFinish, { borderColor: pct === 100 ? colors.success : colors.border, backgroundColor: pct === 100 ? colors.successLight : colors.surface }]}>
                                <Target size={20} color={pct === 100 ? colors.success : colors.textSecondary} />
                            </View>
                        </View>
                        <Text style={[styles.finishLabel, { color: colors.textMain }]}>{t('finishLine')}</Text>
                    </View>
                </View>

                <MyButton
                    title={goal.status === 'completed' ? t('journeyCompleted') : t('markGoalComplete')}
                    disabled={goal.status === 'completed' || !allTasksCompleted}
                    style={{
                        marginTop: Theme.spacing.lg,
                        backgroundColor: goal.status === 'completed' ? colors.success : colors.primary,
                    }}
                    onPress={handleComplete}
                />

                <NovaButton
                    title={t('planWithNova')}
                    onPress={() => {
                        const intentText = `I want to plan the roadmap for my goal: "${goal.title}". Can we break it down into tasks?`;
                        const hiddenContext = `The user wants to expand the roadmap for their existing goal "${goal.title}". DO NOT execute any tools yet. Analyze their progress and discuss adding structured tasks to help them finish. MUST FOLLOW ROADMAP GENERATION RULES based on their Main Struggle. ONLY use the create_roadmap tool after they explicitly agree. When you use the create_roadmap tool, use the goal name "${goal.title}".`;
                        navigation.navigate('AIChat', {
                            initialIntentText: intentText,
                            hiddenContext,
                            isSilent: true,
                        });
                    }}
                    style={{ marginTop: Theme.spacing.md }}
                />

                <MyButton
                    title={t('addTaskManually')}
                    type="secondary"
                    onPress={() => navigation.navigate('TaskForm', { prefilledGoalId: goal.id })}
                    style={{ marginTop: Theme.spacing.sm }}
                />

                <MyButton
                    title={t('removeGoal')}
                    type="secondary"
                    onPress={handleDelete}
                    style={{ marginTop: Theme.spacing.sm, borderColor: colors.error, marginBottom: 40 }}
                />
            </ScrollView>

            <CelebrationModal
                visible={showCelebration}
                title={goal.title}
                message="You've reached your goal. Take a moment to appreciate how far you've come."
                onClose={() => {
                    setShowCelebration(false);
                    showNotification('success', `🎉 Goal reached: ${goal.title}`, 4);
                    navigation.goBack();
                }}
            />
        </SafeAreaView>

        <MyConfirmAlert 
            visible={completeAlertVisible}
            title={t('goalReached')}
            message={t('congratsMessage')}
            onConfirm={async () => {
                setCompleteAlertVisible(false);
                await updateGoal(goal.id, { status: 'completed', progress: 1 });
                try {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (_) {}
                setShowCelebration(true);
            }}
            onCancel={() => setCompleteAlertVisible(false)}
        />

        <MyConfirmAlert 
            visible={deleteAlertVisible}
            title={t('removeGoal')}
            message={t('removeGoalConfirm')}
            onConfirm={async () => {
                setDeleteAlertVisible(false);
                try {
                    await Promise.all(goalTasks.map(task => deleteTask(task.id)));
                    await deleteGoal(goal.id);
                    showNotification('warning', t('goalRemoved', { title: goal.title }));
                    navigation.goBack();
                } catch (e) {
                    showNotification('error', t('errorRemovingGoal'));
                }
            }}
            onCancel={() => setDeleteAlertVisible(false)}
        />
        </>
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
    markerGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
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
