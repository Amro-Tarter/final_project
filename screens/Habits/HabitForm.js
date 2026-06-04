import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton, MyInput, MyDatePicker, MyTimePicker } from '../../components/components';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { useHabits } from '../../hooks/useHabits';
import { useGoals } from '../../hooks/useGoals';
import { useNotifications } from '../../context/NotificationContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function HabitForm({ navigation, route }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    
    const habitToEdit = route.params?.habit;
    const isEditing = !!habitToEdit;
    
    const { addHabit, updateHabit } = useHabits();
    const { goals } = useGoals();
    const { showNotification } = useNotifications();
    const [submitting, setSubmitting] = useState(false);

    const [title, setTitle] = useState(habitToEdit?.title || '');
    const [desc, setDesc] = useState(habitToEdit?.desc || '');
    const [frequency, setFrequency] = useState(habitToEdit?.frequency || 'daily');
    const [interval, setInterval] = useState(habitToEdit?.interval?.toString() || '1');
    const [selectedGoalId, setSelectedGoalId] = useState(habitToEdit?.goalId || route.params?.prefilledGoalId || null);
    const [endDate, setEndDate] = useState(habitToEdit?.endDate || '');

    // Reminder State
    const [reminderType, setReminderType] = useState(habitToEdit?.reminder?.type || 'none');
    const [reminderValue, setReminderValue] = useState(habitToEdit?.reminder?.value || '');

    const activeGoals = goals.filter(g => g.status !== 'completed' || g.id === selectedGoalId);

    const handleSave = async () => {
        if (!title.trim()) {
            showNotification('warning', t('habitTitleRequired') || 'Habit title is required');
            return;
        }

        if (frequency === 'custom' && (!interval || Number(interval) < 1)) {
            showNotification('warning', t('habitRepeatInvalid') || 'Invalid interval');
            return;
        }

        if (reminderType !== 'none' && !reminderValue) {
            showNotification('warning', t('taskReminderInvalid') || 'Please select a reminder time');
            return;
        }

        setSubmitting(true);
        try {
            const reminder = reminderType === 'none' ? null : {
                type: reminderType,
                value: reminderValue
            };

            const habitData = {
                title: title.trim(),
                desc: desc.trim(),
                frequency,
                interval: frequency === 'custom' ? parseInt(interval) : 1,
                goalId: selectedGoalId,
                endDate: endDate || null,
                reminder,
            };

            if (isEditing) {
                await updateHabit(habitToEdit.id, habitData);
            } else {
                await addHabit(habitData);
            }
            navigation.goBack();
        } catch (error) {
            showNotification('error', t('habitSaveError') || 'Failed to save habit');
            console.error('Error saving habit:', error);
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textMain }]}>
                    {isEditing ? t('editHabit') || 'Edit Habit' : t('addHabit') || 'Add Habit'}
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
                        label={t('habitTitle') || 'Habit Name'}
                        placeholder={t('habitTitlePlaceholder') || 'e.g., Read 10 pages'}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <MyInput
                        label={t('description') || 'Description'}
                        placeholder={t('habitDescPlaceholder') || 'Why is this habit important? (optional)'}
                        value={desc}
                        onChangeText={setDesc}
                        multiline
                        numberOfLines={3}
                    />

                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('frequency') || 'Frequency'}</Text>
                    <View style={styles.chipRow}>
                        <OptionChip label={t('daily') || 'Daily'} selected={frequency === 'daily'} onPress={() => setFrequency('daily')} />
                        <OptionChip label={t('weekly') || 'Weekly'} selected={frequency === 'weekly'} onPress={() => setFrequency('weekly')} />
                        <OptionChip label={t('custom') || 'Custom'} selected={frequency === 'custom'} onPress={() => setFrequency('custom')} />
                    </View>

                    {frequency === 'custom' && (
                        <MyInput
                            label={t('everyXDays') || 'Every X Days'}
                            placeholder="e.g. 3"
                            value={interval}
                            onChangeText={setInterval}
                            keyboardType="numeric"
                        />
                    )}

                    <MyDatePicker
                        label={t('endDate') || 'End Date (Optional)'}
                        value={endDate}
                        onChange={setEndDate}
                        icon={Calendar}
                        minimumDate={new Date()}
                    />

                    {/* Reminder Section */}
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('reminder') || 'Reminder'}</Text>
                    <View style={styles.chipRow}>
                        <OptionChip label={t('none') || 'None'} selected={reminderType === 'none'} onPress={() => {
                            setReminderType('none');
                            setReminderValue('');
                        }} />
                        <OptionChip label={t('period') || 'Period'} selected={reminderType === 'period'} onPress={() => {
                            setReminderType('period');
                            if (reminderValue.includes(':')) setReminderValue('');
                        }} />
                        <OptionChip label={t('time') || 'Time'} selected={reminderType === 'time'} onPress={() => {
                            setReminderType('time');
                            if (reminderValue === 'morning' || reminderValue === 'evening') setReminderValue('');
                        }} />
                    </View>

                    {reminderType === 'period' && (
                        <View style={styles.chipRow}>
                            <OptionChip label={t('morning') || 'Morning'} selected={reminderValue === 'morning'} onPress={() => setReminderValue('morning')} />
                            <OptionChip label={t('evening') || 'Evening'} selected={reminderValue === 'evening'} onPress={() => setReminderValue('evening')} />
                        </View>
                    )}
                    {reminderType === 'time' && (
                        <MyTimePicker
                            label={t('time') || 'Time'}
                            value={reminderValue}
                            onChange={setReminderValue}
                        />
                    )}

                    {activeGoals.length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('linkToGoal') || 'Link to Goal'}</Text>
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
                        title={submitting ? "..." : (isEditing ? t('saveHabit') || 'Save Habit' : t('addHabit') || 'Add Habit')}
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
