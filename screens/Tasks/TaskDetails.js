import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton, MyConfirmAlert } from '../../components/components';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Bell, Calendar, Flag, RotateCw, Target } from 'lucide-react-native';
import { useTasks } from '../../hooks/useTasks';
import { useGoals } from '../../hooks/useGoals';
import { useNotifications } from '../../context/NotificationContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function TaskDetails({ navigation, route }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const { taskId } = route.params;
    const { tasks, deleteTask, toggleTaskStatus } = useTasks();
    const { goals } = useGoals();
    const { showNotification } = useNotifications();

    const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);

    const item = tasks.find(t => t.id === taskId);
    const parentGoal = item?.goalId ? goals.find(g => g.id === item.goalId) : null;

    const isCompleted = item?.status === 'completed';

    let isOverdue = false;
    if (item && !isCompleted && item.due) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(item.due);
        dueDate.setHours(0, 0, 0, 0);
        if (today > dueDate) {
            isOverdue = true;
        }
    }

    if (!item) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.textMain} />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontFamily: Theme.typography.body, color: colors.textSecondary }}>
                        {t('stepNotFound')}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleEdit = () => {
        navigation.navigate('TaskForm', { task: item });
    };

    const handleDelete = () => {
        setDeleteAlertVisible(true);
    };

    const handleToggle = async () => {
        try {
            await toggleTaskStatus(item);
            if (item.status === 'pending') {
                showNotification('success', t('taskCompleted'), 3);
            } else {
                showNotification('warning', t('taskPending'), 1);
            }
        } catch (error) {
            console.error("Toggle error:", error);
            showNotification('error', t('updateError'));
        }
    };

    const getReminderText = () => {
        if (!item.reminder || item.reminder.type === 'none') {
            return t('noReminder');
        }

        const duePrefix = item.due ? `${t('on')} ${item.due}` : t('reminder');

        if (item.reminder.type === 'time' && item.reminder.value) {
            return `${duePrefix} ${t('at')} ${item.reminder.value}`;
        }

        if (item.reminder.type === 'period') {
            if (item.reminder.value === 'morning') {
                return `${duePrefix} ${t('morning')}`;
            }
            if (item.reminder.value === 'evening') {
                return `${duePrefix} ${t('evening')}`;
            }
        }

        return t('noReminder');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textMain }]}>{t('stepDetails')}</Text>
                <View style={styles.headerRight}>
                    {!isCompleted && !isOverdue && (
                        <TouchableOpacity onPress={handleEdit} style={styles.editBtn}>
                            <Text style={[styles.editText, { color: colors.primary }]}>{t('editLabel')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500 }}
                >
                    <LinearGradient
                        colors={isCompleted ? [colors.successLight, colors.successLight] : Theme.gradients.hero}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroBanner}
                    >
                        <View style={styles.heroHeader}>
                            <View style={styles.heroTextContainer}>
                                <Text style={styles.heroLabel}>{t('taskLabel')}</Text>
                                <Text style={[styles.heroTitle, isCompleted && { color: colors.success }]}>
                                    {item.title}
                                </Text>
                                <View style={[
                                    styles.statusBadge,
                                    isOverdue && { backgroundColor: colors.errorLight },
                                    isCompleted && { backgroundColor: 'rgba(255,255,255,0.2)' }
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        isOverdue && { color: colors.error },
                                        isCompleted && { color: colors.success }
                                    ]}>
                                        {isOverdue ? t('overdueStatus') : (isCompleted ? t('done').toUpperCase() : t('pending').toUpperCase())}
                                    </Text>
                                </View>
                                {item.priority === 'Focus' && (
                                    <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 8 }]}>
                                        <Text style={styles.statusText}>🔥 {t('focus').toUpperCase()}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                </MotiView>

                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 100 }}
                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                    {item.desc ? (
                        <View style={[styles.section, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('descLabel')}</Text>
                            <Text style={[styles.description, { color: colors.textMain }]}>{item.desc}</Text>
                        </View>
                    ) : null}

                    {parentGoal ? (
                        <View style={styles.row}>
                            <Target size={20} color={colors.primary} />
                            <View style={styles.infoRow}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('relatedGoal')}</Text>
                                <Text style={[styles.value, { color: colors.textMain }]}>{parentGoal.title}</Text>
                            </View>
                        </View>
                    ) : null}

                    {item.due ? (
                        <View style={styles.row}>
                            <Calendar size={20} color={isOverdue ? colors.error : colors.primary} />
                            <View style={styles.infoRow}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('dueDateLabel')}</Text>
                                <Text style={[
                                    styles.value,
                                    { color: colors.textMain },
                                    isOverdue && { color: colors.error, fontFamily: Theme.typography.subHeader }
                                ]}>{item.due}</Text>
                            </View>
                        </View>
                    ) : null}

                    {isCompleted && item.completedLate && (
                        <View style={styles.row}>
                            <Calendar size={20} color={colors.warning} />
                            <View style={styles.infoRow}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('completedInfo')}</Text>
                                <Text style={[styles.value, { color: colors.warning }]}>
                                    {item.lateByDays === 1 ? t('oneDayLate') : `${item.lateByDays} ${t('daysLate')}`}
                                </Text>
                            </View>
                        </View>
                    )}



                    <View style={styles.row}>
                        <Bell size={20} color={item.reminder && item.reminder.type !== 'none' ? colors.primary : colors.textSecondary} />
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('reminderLabel')}</Text>
                            <Text style={[styles.value, { color: colors.textMain }]}>{getReminderText()}</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <Flag size={20} color={item.priority === 'Focus' ? colors.warning : colors.textSecondary} />
                        <View style={styles.infoRow}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('priorityLabel')}</Text>
                            <Text style={[styles.value, { color: colors.textMain }]}>
                                {item.priority === 'Focus' ? `🔥 ${t('focus')}` : t('normal')}
                            </Text>
                        </View>
                    </View>
                </MotiView>

                <View style={{ flex: 1 }} />

                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 200 }}
                >
                    <MyButton
                        title={item.status === 'completed' ? t('markPending') : t('markCompleted')}
                        onPress={handleToggle}
                        style={{ marginTop: Theme.spacing.xl }}
                    />

                    <MyButton
                        title={t('deleteStep')}
                        onPress={handleDelete}
                        type="secondary"
                        style={{ marginTop: Theme.spacing.md, borderColor: colors.error }}
                        textStyle={{ color: colors.error }}
                    />
                </MotiView>
            </ScrollView>
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
        marginBottom: 16,
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
    title: {
        fontSize: 24,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontFamily: Theme.typography.subHeader,
        letterSpacing: 1,
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textSecondary,
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
        lineHeight: 24,
        marginBottom: Theme.spacing.lg,
    },
    divider: {
        height: 1,
        backgroundColor: Theme.colors.border,
        marginVertical: Theme.spacing.lg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.spacing.lg,
    },
    rowText: {
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
