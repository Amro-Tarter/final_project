import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { Brain, Sparkles, PlusCircle, BookOpen } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Theme } from '../components/components';
import { useAppTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTasks } from '../hooks/useTasks';
import { useGoals } from '../hooks/useGoals';
import { useHabits } from '../hooks/useHabits';
import { useDiary } from '../hooks/useDiary';
import { useUserProfile } from '../hooks/useUserProfile';
import { useNotifications } from '../context/NotificationContext';
import { HeroJourneyCard } from '../components/ui/HeroJourneyCard';
import { TaskStepCard } from '../components/ui/TaskStepCard';
import { MomentumMeter } from '../components/ui/MomentumMeter';
import { ReflectionPromptCard } from '../components/ui/ReflectionPromptCard';
import { InsightCard } from '../components/ui/JourneyCards';
import { SectionHeader } from '../components/ui/SegmentTabs';
import { EmptyState } from '../components/ui/EmptyState';
import { JourneyCopy } from '../constants/JourneyCopy';
import { getAIInsights } from '../services/aiService';
import {
    getTimeGreeting,
    getUserDisplayName,
    getPrimaryGoal,
    getCurrentTask,
    getNextSteps,
    calculateMomentum,
    getCoPilotMessage,
} from '../utils/journeyHelpers';
import { Plus, Map, Target, Repeat, Flame } from 'lucide-react-native';
import { DailyJourneySnapshot } from '../components/ui/DailyJourneySnapshot';

const ActionButton = ({ icon: Icon, label, onPress, color, bgColor, textColor, borderColor }) => (
    <TouchableOpacity 
        style={[styles.actionCard, { backgroundColor: bgColor || Theme.colors.surface, borderColor: borderColor || Theme.colors.border }]}
        onPress={onPress}
    >
        <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
            <Icon size={24} color={color} />
        </View>
        <Text style={[styles.actionTitle, { color: textColor || Theme.colors.textMain }]}>{label}</Text>
    </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const { colors } = useAppTheme();
    const { tasks, loading, toggleTaskStatus } = useTasks();
    const { goals } = useGoals();
    const { habits } = useHabits();
    const { entries } = useDiary();
    const { profile } = useUserProfile();
    const { showNotification } = useNotifications();

    const [insight, setInsight] = useState(null);

    useEffect(() => {
        let mounted = true;
        const fetchInsights = async () => {
            if (!profile) return;
            const res = await getAIInsights(profile, language);
            if (mounted && res?.insights?.length > 0) {
                setInsight(res.insights[0]);
            }
        };
        fetchInsights();
        return () => { mounted = false; };
    }, [profile, language]);

    const displayName = getUserDisplayName(user);
    const greeting = `${getTimeGreeting(t)}, ${displayName}`;
    const destination = useMemo(() => getPrimaryGoal(goals), [goals]);
    const pitStop = destination ? getCurrentTask(tasks, destination.id) : null;
    const nextSteps = destination ? getNextSteps(tasks, destination.id) : [];
    
    const todayStr = new Date().toISOString().split('T')[0];
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    
    const focusTasks = useMemo(() => 
        pendingTasks.filter(t => t.priority === 'Focus' && (t.due === todayStr || t.isOverdue)), 
    [pendingTasks, todayStr]);
    
    const overdueTasks = useMemo(() => 
        pendingTasks.filter(t => t.isOverdue && t.priority !== 'Focus'), 
    [pendingTasks]);

    const todayTasks = useMemo(() => 
        pendingTasks.filter(t => t.due === todayStr && t.priority !== 'Focus' && !t.isOverdue), 
    [pendingTasks, todayStr]);

    const activeHabits = useMemo(() => 
        habits.sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0)).slice(0, 3), 
    [habits]);

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
            showNotification('success', t('taskCompleted'), 3);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <MotiView 
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    style={styles.header}
                >
                    <View>
                        <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t('homeGreeting')}</Text>
                        <Text style={[styles.name, { color: colors.textMain }]}>
                            {user?.displayName || t('traveler')}
                        </Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.profileBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => navigation.navigate("ProfileTab")}
                    >
                        <Sparkles size={20} color={colors.primary} />
                    </TouchableOpacity>
                </MotiView>

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

                <MotiView
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 100 }}
                    style={[styles.aiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                    <View style={[styles.aiIconBadge, { backgroundColor: colors.primaryLight }]}>
                        <Brain size={24} color={colors.primary} />
                    </View>
                    <View style={styles.aiTextContent}>
                        <Text style={[styles.aiTitle, { color: colors.textMain }]}>{t('aiGuideTitle')}</Text>
                        <Text style={[styles.aiSubtitle, { color: colors.textSecondary }]}>{t('aiGuideSubtitle')}</Text>
                    </View>
                    <TouchableOpacity 
                        style={[styles.aiActionBtn, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate("AIChat")}
                    >
                        <Text style={styles.aiActionText}>{t('chat')}</Text>
                    </TouchableOpacity>
                </MotiView>

                {insight && (
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 200 }}
                        style={{ marginBottom: 24 }}
                    >
                        <InsightCard title={insight.title} desc={insight.desc} type={insight.type} />
                    </MotiView>
                )}

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsContainer}>
                    <ActionButton icon={PlusCircle} label={t('addTask')} onPress={() => navigation.navigate("TaskForm")} color={colors.secondary} bgColor={colors.surface} textColor={colors.textMain} borderColor={colors.border} />
                    <ActionButton icon={Repeat} label={t('addHabit') || 'Add Habit'} onPress={() => navigation.navigate("HabitForm")} color={colors.primary} bgColor={colors.surface} textColor={colors.textMain} borderColor={colors.border} />
                    <ActionButton icon={Target} label={t('addGoal')} onPress={() => navigation.navigate("GoalForm")} color={colors.success} bgColor={colors.surface} textColor={colors.textMain} borderColor={colors.border} />
                    <ActionButton icon={BookOpen} label={t('addDiary')} onPress={() => navigation.navigate("DiaryForm")} color={colors.warning || '#F59E0B'} bgColor={colors.surface} textColor={colors.textMain} borderColor={colors.border} />
                </ScrollView>

                {/* TODAY'S FOCUS */}
                {focusTasks.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('focusTasks') || "Today's Focus"} 🔥</Text>
                            <TouchableOpacity onPress={() => navigation.navigate("TaskList")}>
                                <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('seeAll')}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.section}>
                            {focusTasks.map(task => (
                                <TaskStepCard
                                    key={task.id}
                                    task={task}
                                    onToggle={() => handleToggle(task)}
                                    onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })}
                                />
                            ))}
                        </View>
                    </>
                )}



                {/* TODAY'S TASKS */}
                {/* TODAY'S TASKS */}
                <>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('todayTasks')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate("TaskList")}>
                            <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('seeAll')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.section}>
                        {todayTasks.length > 0 ? (
                            todayTasks.map(task => (
                                <TaskStepCard
                                    key={task.id}
                                    task={task}
                                    onToggle={() => handleToggle(task)}
                                    onPress={() => navigation.navigate('TaskDetails', { taskId: task.id })}
                                />
                            ))
                        ) : loading ? (
                            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your path...</Text>
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
                </>

                {/* HABIT STREAKS */}
                <>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('yourHabits') || "Habit Streaks"}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate("TasksTab", { initialTab: 1 })}>
                            <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('seeAll')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.section}>
                        {activeHabits.length > 0 ? (
                            activeHabits.map((habit) => (
                                <TouchableOpacity
                                    key={habit.id}
                                    style={[styles.habitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                    onPress={() => navigation.navigate('TasksTab', { initialTab: 1 })}
                                >
                                    <Text style={[styles.habitTitle, { color: colors.textMain }]}>{habit.title}</Text>
                                    <Text style={[styles.habitStats, { color: colors.textSecondary }]}>
                                        🔥 {habit.currentStreak || 0} {t('streak') || 'streak'}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <EmptyState
                                title={t('noHabitsTitle') || 'No Habits Yet'}
                                subtitle={t('noHabitsSub') || 'Build consistency by creating a recurring habit.'}
                                cta={t('addHabit') || 'Add Habit'}
                                onPress={() => navigation.navigate('HabitForm')}
                                icon={Repeat}
                            />
                        )}
                    </View>
                </>

                <MomentumMeter
                    level={momentum}
                    message={
                        momentum >= 60
                            ? t('momentumSubtitle')
                            : t('momentumDefault')
                    }
                />
                
                <View style={{ height: 24 }} />

                <ReflectionPromptCard
                    prompt={t('reflectionPrompt')}
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginBottom: 4,
    },
    name: {
        fontSize: 24,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
    },
    profileBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Theme.colors.surface,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        ...Theme.shadows.sm,
    },
    aiCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
    },
    aiIconBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    aiTextContent: {
        flex: 1,
        marginRight: 12,
    },
    aiTitle: {
        fontSize: 17,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 4,
    },
    aiSubtitle: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        lineHeight: 20,
    },
    aiActionBtn: {
        backgroundColor: Theme.colors.primary,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 24,
        ...Theme.shadows.sm,
    },
    aiActionText: {
        color: '#FFF',
        fontFamily: Theme.typography.subHeader,
        fontSize: 15,
    },
    quickActionsContainer: {
        paddingRight: Theme.spacing.lg,
        paddingBottom: 24,
        gap: 12,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingRight: 16,
        borderRadius: Theme.radii.lg,
        borderWidth: 1,
        ...Theme.shadows.sm,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actionTitle: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
    },
    habitCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: Theme.radii.md,
        borderWidth: 1,
        marginBottom: 8,
        ...Theme.shadows.sm,
    },
    habitTitle: {
        fontSize: 15,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
    },
    habitStats: {
        fontSize: 13,
        fontFamily: Theme.typography.body,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
    },
    seeAllText: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
    },
});
