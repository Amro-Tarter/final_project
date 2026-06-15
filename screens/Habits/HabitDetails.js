import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton, MyConfirmAlert, MyCheckbox } from '../../components/components';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Target, Repeat, Flame, Trophy, CalendarDays, Bell, CheckCircle2 } from 'lucide-react-native';
import { useHabits } from '../../hooks/useHabits';
import { useGoals } from '../../hooks/useGoals';
import { useNotifications } from '../../context/NotificationContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function HabitDetails({ navigation, route }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const { habitId } = route.params;

    const { habits, deleteHabit, checkInHabit, uncheckHabit, isHabitCompletedForDate } = useHabits();
    const { goals } = useGoals();
    const { showNotification } = useNotifications();

    const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
    const [isCompletedToday, setIsCompletedToday] = useState(false);

    const habit = habits.find(h => h.id === habitId);
    const parentGoal = habit?.goalId ? goals.find(g => g.id === habit.goalId) : null;
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (habit) {
            isHabitCompletedForDate(habit.id, today).then(setIsCompletedToday);
        }
    }, [habit, today, isHabitCompletedForDate]);

    if (!habit) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.textMain} />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontFamily: Theme.typography.body, color: colors.textSecondary }}>
                        {t('habitNotFound') || 'Habit not found.'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleEdit = () => {
        navigation.navigate('HabitForm', { habit });
    };

    const handleDelete = async () => {
        setDeleteAlertVisible(true);
    };

    const confirmDelete = async () => {
        setDeleteAlertVisible(false);
        try {
            await deleteHabit(habit.id);
            showNotification('warning', t('habitDeleted') || 'Habit deleted', 2);
            navigation.goBack();
        } catch (error) {
            showNotification('error', t('deleteError') || 'Failed to delete habit');
        }
    };

    const toggleTodayCheckIn = async () => {
        const nextState = !isCompletedToday;
        setIsCompletedToday(nextState);
        try {
            if (nextState) {
                await checkInHabit(habit.id, today);
                showNotification('success', t('habitCheckedIn') || 'Habit checked in! 🔥', 2);
            } else {
                await uncheckHabit(habit.id, today);
            }
        } catch (e) {
            setIsCompletedToday(!nextState); // Revert on failure
            showNotification('error', t('updateError') || 'Error updating check-in');
        }
    };

    const getReminderText = () => {
        if (!habit.reminder || habit.reminder.type === 'none') {
            return t('noReminder') || 'No Reminder';
        }

        const duePrefix = t('reminder') || 'Reminder';

        if (habit.reminder.type === 'time' && habit.reminder.value) {
            return `${duePrefix} ${t('at') || 'at'} ${habit.reminder.value}`;
        }

        if (habit.reminder.type === 'period') {
            if (habit.reminder.value === 'morning') {
                return `${duePrefix} ${t('morning') || 'Morning'}`;
            }
            if (habit.reminder.value === 'evening') {
                return `${duePrefix} ${t('evening') || 'Evening'}`;
            }
        }

        return t('noReminder') || 'No Reminder';
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textMain }]}>{t('habitDetails') || 'Habit Details'}</Text>
                <TouchableOpacity onPress={handleEdit} style={styles.editBtn}>
                    <Text style={[styles.editText, { color: colors.primary }]}>{t('editLabel')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500 }}
                >
                    <LinearGradient
                        colors={colors.heroGradient || Theme.gradients.hero}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroBanner}
                    >
                        <View style={styles.heroHeader}>
                            <View style={styles.heroTextContainer}>
                                <Text style={styles.heroLabel}>{t('habitLabel') || 'Habit'}</Text>
                                <Text style={styles.heroTitle}>
                                    {habit.title}
                                </Text>

                                <TouchableOpacity
                                    style={[styles.checkInBtn, isCompletedToday ? styles.checkInBtnCompleted : styles.checkInBtnPending]}
                                    onPress={toggleTodayCheckIn}
                                    activeOpacity={0.85}
                                >
                                    <CheckCircle2 size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={[styles.checkInBtnText, isCompletedToday && { color: '#fff' }]}>
                                        {isCompletedToday
                                            ? (t('completedToday') || "Completed Today!")
                                            : (t('markAsDone') || "Mark as Done Today")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </LinearGradient>
                </MotiView>

                {/* Stats Grid */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 100 }}
                    style={styles.statsGrid}
                >
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Flame size={24} color={colors.warning} style={{ marginBottom: 8 }} />
                        <Text style={[styles.statValue, { color: colors.textMain }]}>{habit.currentStreak || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('currentStreak') || 'Current Streak'}</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Trophy size={24} color={colors.primary} style={{ marginBottom: 8 }} />
                        <Text style={[styles.statValue, { color: colors.textMain }]}>{habit.bestStreak || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('bestStreak') || 'Best Streak'}</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Target size={24} color={colors.success} style={{ marginBottom: 8 }} />
                        <Text style={[styles.statValue, { color: colors.textMain }]}>{habit.consistencyRate || 0}%</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('consistency') || 'Consistency'}</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <CalendarDays size={24} color={colors.secondary} style={{ marginBottom: 8 }} />
                        <Text style={[styles.statValue, { color: colors.textMain }]}>{habit.completedOccurrences || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('totalDays') || 'Total Days'}</Text>
                    </View>
                </MotiView>

                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 200 }}
                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                    {habit.desc ? (
                        <View style={[styles.section, { borderBottomColor: colors.border, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1 }]}>
                            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('descLabel') || 'Description'}</Text>
                            <Text style={[styles.description, { color: colors.textMain, marginTop: 4 }]}>{habit.desc}</Text>
                        </View>
                    ) : null}

                    {parentGoal && (
                        <View style={styles.row}>
                            <Target size={20} color={colors.primary} />
                            <View style={styles.infoRow}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('relatedGoal')}</Text>
                                <Text style={[styles.value, { color: colors.textMain }]}>{parentGoal.title}</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.row}>
                        <Repeat size={20} color={colors.secondary} />
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('frequency') || 'Frequency'}</Text>
                            <Text style={[styles.value, { color: colors.textMain }]}>
                                {habit.frequency === 'daily' ? t('daily') :
                                    habit.frequency === 'weekly' ? t('weekly') :
                                        `${t('every')} ${habit.interval} ${t('days')}`}
                            </Text>
                        </View>
                    </View>

                    {habit.endDate && (
                        <View style={styles.row}>
                            <CalendarDays size={20} color={colors.primary} />
                            <View style={styles.infoRow}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('endDate') || 'End Date'}</Text>
                                <Text style={[styles.value, { color: colors.textMain }]}>{habit.endDate}</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.row}>
                        <Bell size={20} color={habit.reminder && habit.reminder.type !== 'none' ? colors.primary : colors.textSecondary} />
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('reminderLabel') || 'Reminder'}</Text>
                            <Text style={[styles.value, { color: colors.textMain }]}>{getReminderText()}</Text>
                        </View>
                    </View>
                </MotiView>

                <View style={{ flex: 1 }} />

                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 300 }}
                >
                    <MyButton
                        title={t('deleteHabit') || 'Delete Habit'}
                        onPress={handleDelete}
                        type="secondary"
                        style={{ marginTop: Theme.spacing.xl, borderColor: colors.error }}
                        textStyle={{ color: colors.error }}
                    />
                </MotiView>
            </ScrollView>

            <MyConfirmAlert
                visible={deleteAlertVisible}
                title={t('deleteHabitTitle') || 'Delete Habit'}
                message={t('deleteHabitConfirm') || 'Are you sure you want to delete this habit and all its check-ins?'}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteAlertVisible(false)}
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
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
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
        flexGrow: 1,
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
        marginBottom: 24,
    },
    checkInBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 30, // pill shape
        marginTop: 12,
    },
    checkInBtnPending: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    checkInBtnCompleted: {
        backgroundColor: Theme.colors.primary,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        ...Theme.shadows.float,
    },
    checkInBtnText: {
        color: '#fff',
        fontFamily: Theme.typography.subHeader,
        fontSize: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: (width - 32 - 12) / 2, // 2 columns
        backgroundColor: Theme.colors.surface,
        padding: 16,
        borderRadius: Theme.radii.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
    },
    statValue: {
        fontSize: 24,
        fontFamily: Theme.typography.header,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        padding: 24,
        borderRadius: Theme.radii.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.spacing.md,
    },
    infoRow: {
        marginLeft: 16,
    },
    label: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
        fontFamily: Theme.typography.body,
    },
    value: {
        fontSize: 16,
        color: Theme.colors.textMain,
        fontFamily: Theme.typography.subHeader,
    },
});
