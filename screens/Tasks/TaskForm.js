import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme, NovaButton, MyButton, MyInput, MyCheckbox, MyDatePicker, MyTimePicker } from '../../components/components';
import { MotiView } from 'moti';
import { ArrowLeft, Calendar, Sparkles } from 'lucide-react-native';
import { useTasks } from '../../hooks/useTasks';
import { useGoals } from '../../hooks/useGoals';
import { useNotifications } from '../../context/NotificationContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function TaskForm({ navigation, route }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    // If editing, we passed the full task object
    const taskToEdit = route.params?.task;
    const isEditing = !!taskToEdit;
    const { addTask, updateTask, canAddFocusForDate, MAX_FOCUS_PER_DAY } = useTasks();
    const { goals } = useGoals();
    const { showNotification } = useNotifications();
    const [submitting, setSubmitting] = useState(false);

    const [title, setTitle] = useState(taskToEdit?.title || '');
    const [desc, setDesc] = useState(taskToEdit?.desc || '');
    const [dueDate, setDueDate] = useState(taskToEdit?.due || route.params?.prefilledDate || '');
    const [isFocus, setIsFocus] = useState(taskToEdit?.priority === 'Focus');

    // Reminder State
    const [reminderType, setReminderType] = useState(taskToEdit?.reminder?.type || 'none');
    const [reminderValue, setReminderValue] = useState(taskToEdit?.reminder?.value || '');

    // Goal Link State
    const [selectedGoalId, setSelectedGoalId] = useState(taskToEdit?.goalId || route.params?.prefilledGoalId || null);

    const activeGoals = goals.filter(g => g.status !== 'completed' || g.id === selectedGoalId);

    const handleSave = async () => {
        if (!title.trim()) {
            showNotification('warning', t('taskTitleRequired'));
            return;
        }

        if (!dueDate) {
            showNotification('warning', t('taskDateRequired'));
            return;
        }

        if (dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const [year, month, day] = dueDate.split('-').map(Number);
            const selectedDate = new Date(year, month - 1, day);
            selectedDate.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                showNotification('error', t('taskFutureDateRequired'));
                return;
            }
        }

        if (reminderType !== 'none' && !reminderValue) {
            showNotification('warning', t('taskReminderInvalid'));
            return;
        }

        // Focus limit check
        if (isFocus && dueDate && !isEditing) {
            if (!canAddFocusForDate(dueDate)) {
                showNotification('warning', t('focusLimitReached'));
                return;
            }
        }

        setSubmitting(true);
        try {
            const reminder = reminderType === 'none' ? null : {
                type: reminderType,
                value: reminderValue
            };

            const taskData = {
                title: title.trim(),
                desc: desc.trim(),
                due: dueDate,
                priority: isFocus ? 'Focus' : 'Normal',
                status: taskToEdit?.status || 'pending',
                reminder,
                goalId: selectedGoalId
            };

            if (isEditing) {
                // Pass the old goalId to updateTask so it can recalculate both old and new goal progress
                await updateTask(taskToEdit.id, taskData, taskToEdit.goalId);
            } else {
                await addTask(taskData);
            }
            navigation.goBack();
        } catch (error) {
            showNotification('error', t('taskSaveError'));
            console.error('Error saving task:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const OptionChip = ({ label, selected, onPress }) => (
        <TouchableOpacity
            style={selected ? styles.chipWrapper : [styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onPress}
        >
            {selected ? (
                <LinearGradient
                    colors={Theme.gradients.hero}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.chipSelectedGradient}
                >
                    <Text style={styles.chipTextSelected}>{label}</Text>
                </LinearGradient>
            ) : (
                <Text style={[styles.chipText, { color: colors.textSecondary }]}>{label}</Text>
            )}
        </TouchableOpacity>
    );

    const handleNovaTask = () => {

        const intentText =
            title?.trim()
                ? `I want help planning a step called "${title}".`
                : `I want help planning a new step.`;

        const hiddenContext =
            "The user is starting a brand-new step planning session. Ignore previous step conversations. DO NOT create any step yet. Help them define the step, due date, recurrence and reminder. Ask any missing questions naturally. Only use create_task after the user explicitly agrees.";

        navigation.push('AIChat', {
            freshChat: true,
            planningType: 'task',

        });
    };
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textMain }]}>
                    {isEditing ? t('editTask') : t('addTask')}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500 }}
                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                <MyInput
                    label={t('taskTitle')}
                    placeholder={t('taskTitlePlaceholder')}
                    value={title}
                    onChangeText={setTitle}
                />

                <MyInput
                    label={t('taskDesc')}
                    placeholder={t('taskDescPlaceholder')}
                    value={desc}
                    onChangeText={setDesc}
                    multiline
                    numberOfLines={3}

                />

                <MyDatePicker
                    label={t('dueDate')}
                    value={dueDate}
                    onChange={setDueDate}
                    icon={Calendar}
                    minimumDate={new Date()}
                />

                {/* Priority: Focus / Normal */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('priority')}</Text>
                <View style={styles.chipRow}>
                    <OptionChip label={t('normal')} selected={!isFocus} onPress={() => setIsFocus(false)} />
                    <OptionChip label={`🔥 ${t('focus')}`} selected={isFocus} onPress={() => setIsFocus(true)} />
                </View>
                {isFocus && (
                    <Text style={[styles.focusHint, { color: colors.textSecondary }]}>
                        {t('focusHint')}
                    </Text>
                )}

                {/* Reminder Section */}
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('reminder')}</Text>
                <View style={styles.chipRow}>
                    <OptionChip label={t('none')} selected={reminderType === 'none'} onPress={() => {
                        setReminderType('none');
                        setReminderValue('');
                    }} />
                    <OptionChip label={t('period')} selected={reminderType === 'period'} onPress={() => {
                        setReminderType('period');
                        if (reminderValue.includes(':')) setReminderValue('');
                    }} />
                    <OptionChip label={t('time')} selected={reminderType === 'time'} onPress={() => {
                        setReminderType('time');
                        if (reminderValue === 'morning' || reminderValue === 'evening') setReminderValue('');
                    }} />
                </View>

                {reminderType === 'period' && (
                    <View style={styles.chipRow}>
                        <OptionChip label={t('morning')} selected={reminderValue === 'morning'} onPress={() => setReminderValue('morning')} />
                        <OptionChip label={t('evening')} selected={reminderValue === 'evening'} onPress={() => setReminderValue('evening')} />
                    </View>
                )}
                {reminderType === 'time' && (
                    <MyTimePicker
                        label={t('time')}
                        value={reminderValue}
                        onChange={setReminderValue}
                    />
                )}

                {/* Link to Goal Section */}
                {activeGoals.length > 0 && (
                    <>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('linkToGoal')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            <View style={[styles.chipRow, { flexWrap: 'nowrap' }]}>
                                <OptionChip
                                    label={t('none')}
                                    selected={selectedGoalId === null}
                                    onPress={() => setSelectedGoalId(null)}
                                />
                                {activeGoals.map(g => (
                                    <OptionChip
                                        key={g.id}
                                        label={g.title}
                                        selected={selectedGoalId === g.id}
                                        onPress={() => setSelectedGoalId(g.id)}
                                    />
                                ))}
                            </View>
                        </ScrollView>
                    </>
                )}

                </MotiView>

                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 100 }}
                >
                    <MyButton
                        title={submitting ? "..." : (isEditing ? t('saveTask') : t('addTask'))}
                        onPress={handleSave}
                        disabled={submitting}
                        style={{ marginTop: Theme.spacing.xl }}
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
    content: {
        padding: Theme.spacing.lg,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        padding: 24,
        borderRadius: Theme.radii.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.colors.primary,
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
    },
    aiButtonText: {
        color: '#fff',
        fontFamily: Theme.typography.subHeader,
        fontSize: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textSecondary,
        marginTop: 16,
        marginBottom: 8,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Theme.colors.surface,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    chipWrapper: {
        borderRadius: 20,
        ...Theme.shadows.sm,
    },
    chipSelectedGradient: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    chipText: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
    },
    chipTextSelected: {
        color: '#fff',
        fontFamily: Theme.typography.subHeader,
    }
});
