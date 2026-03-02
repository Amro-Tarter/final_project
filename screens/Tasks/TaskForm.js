import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton, MyInput, MyCheckbox, MyDatePicker, MyTimePicker } from '../../components/components';

import { ArrowLeft, Calendar } from 'lucide-react-native';
import { useTasks } from '../../hooks/useTasks';
import { useGoals } from '../../hooks/useGoals';

export default function TaskForm({ navigation, route }) {
    // If editing, we passed the full task object
    const taskToEdit = route.params?.task;
    const isEditing = !!taskToEdit;
    const { addTask, updateTask } = useTasks();
    const { goals } = useGoals();
    const [submitting, setSubmitting] = useState(false);

    const [title, setTitle] = useState(taskToEdit?.title || '');
    const [desc, setDesc] = useState(taskToEdit?.desc || '');
    const [dueDate, setDueDate] = useState(taskToEdit?.due || '');
    const [isHighPriority, setIsHighPriority] = useState(taskToEdit?.priority === 'High');

    // Recurrence State
    const [recurrenceType, setRecurrenceType] = useState(taskToEdit?.recurrence?.type || 'none'); // none, daily, weekly, custom
    const [customInterval, setCustomInterval] = useState(taskToEdit?.recurrence?.interval?.toString() || '1');

    // Reminder State
    const [reminderType, setReminderType] = useState(taskToEdit?.reminder?.type || 'none'); // none, time, period
    const [reminderValue, setReminderValue] = useState(taskToEdit?.reminder?.value || ''); // "09:00" or "morning"

    // Goal Link State
    const [selectedGoalId, setSelectedGoalId] = useState(taskToEdit?.goalId || route.params?.prefilledGoalId || null);

    const activeGoals = goals.filter(g => g.status !== 'completed' || g.id === selectedGoalId);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Missing Info', 'Please add a task title.');
            return;
        }

        setSubmitting(true);
        try {
            const recurrence = recurrenceType === 'none' ? null : {
                type: recurrenceType,
                interval: recurrenceType === 'custom' ? parseInt(customInterval) : 1,
            };

            const reminder = reminderType === 'none' ? null : {
                type: reminderType,
                value: reminderValue
            };

            const taskData = {
                title,
                desc,
                due: dueDate,
                priority: isHighPriority ? 'High' : 'Normal',
                status: taskToEdit?.status || 'pending',
                recurrence,
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
            Alert.alert("Error", "Could not save task. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const OptionChip = ({ label, selected, onPress }) => (
        <TouchableOpacity
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={onPress}
        >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isEditing ? 'Edit Task' : 'New Task'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <MyInput
                    label="Task Title"
                    placeholder="What needs to be done?"
                    value={title}
                    onChangeText={setTitle}
                />

                <MyInput
                    label="Description"
                    placeholder="Add details..."
                    value={desc}
                    onChangeText={setDesc}
                    multiline
                    numberOfLines={3}
                    style={{ height: 80, textAlignVertical: 'top' }}
                />

                <MyDatePicker
                    label="Due Date"
                    value={dueDate}
                    onChange={setDueDate}
                    icon={Calendar}
                />

                {/* Recurrence Section */}
                <Text style={styles.sectionLabel}>Repetition</Text>
                <View style={styles.chipRow}>
                    <OptionChip label="None" selected={recurrenceType === 'none'} onPress={() => setRecurrenceType('none')} />
                    <OptionChip label="Daily" selected={recurrenceType === 'daily'} onPress={() => setRecurrenceType('daily')} />
                    <OptionChip label="Weekly" selected={recurrenceType === 'weekly'} onPress={() => setRecurrenceType('weekly')} />
                    <OptionChip label="Custom" selected={recurrenceType === 'custom'} onPress={() => setRecurrenceType('custom')} />
                </View>
                {recurrenceType === 'custom' && (
                    <MyInput
                        label="Every X Days"
                        placeholder="e.g. 3"
                        value={customInterval}
                        onChangeText={setCustomInterval}
                        keyboardType="numeric"
                    />
                )}

                {/* Reminder Section */}
                <Text style={styles.sectionLabel}>Reminder</Text>
                <View style={styles.chipRow}>
                    <OptionChip label="None" selected={reminderType === 'none'} onPress={() => setReminderType('none')} />
                    <OptionChip label="Period" selected={reminderType === 'period'} onPress={() => setReminderType('period')} />
                    <OptionChip label="Time" selected={reminderType === 'time'} onPress={() => setReminderType('time')} />
                </View>

                {reminderType === 'period' && (
                    <View style={styles.chipRow}>
                        <OptionChip label="Morning" selected={reminderValue === 'morning'} onPress={() => setReminderValue('morning')} />
                        <OptionChip label="Evening" selected={reminderValue === 'evening'} onPress={() => setReminderValue('evening')} />
                    </View>
                )}
                {reminderType === 'time' && (
                    <MyTimePicker
                        label="At Time"
                        value={reminderValue}
                        onChange={setReminderValue}
                    />
                )}

                {/* Link to Goal Section */}
                {activeGoals.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>Link to Goal (Optional)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            <View style={[styles.chipRow, { flexWrap: 'nowrap' }]}>
                                <OptionChip
                                    label="None"
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

                <View style={{ marginVertical: Theme.spacing.md }}>
                    <MyCheckbox
                        label="High Priority"
                        checked={isHighPriority}
                        onPress={() => setIsHighPriority(!isHighPriority)}
                    />
                </View>

                <MyButton
                    title={submitting ? "Saving..." : (isEditing ? "Save Changes" : "Create Task")}
                    onPress={handleSave}
                    disabled={submitting}
                    style={{ marginTop: Theme.spacing.xl }}
                />
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
    chipSelected: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
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
