import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { Calendar } from 'react-native-calendars';
import { useTasks } from '../../hooks/useTasks';
import { useGoals } from '../../hooks/useGoals';
import { useDiary } from '../../hooks/useDiary';
import { CheckCircle2, Circle, Target, BookOpen, Plus } from 'lucide-react-native';

export default function CalendarScreen({ navigation }) {
    const { tasks } = useTasks();
    const { goals } = useGoals();
    const { entries: diaries } = useDiary();

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const todayStr = new Date().toISOString().split('T')[0];
    const isPastDate = selectedDate < todayStr;
    const isFutureDate = selectedDate > todayStr;

    // Format data for react-native-calendars
    const markedDates = useMemo(() => {
        const marks = {};

        // Helper to add marks
        const addMark = (dateStr, dot) => {
            if (!marks[dateStr]) {
                marks[dateStr] = { dots: [] };
            }
            // Avoid duplicate colors on the same day if desired, or just push
            if (!marks[dateStr].dots.find(d => d.key === dot.key)) {
                marks[dateStr].dots.push(dot);
            }
        };

        // 1. Tasks
        tasks.forEach(task => {
            if (task.due) {
                const isCompleted = task.status === 'completed';
                addMark(task.due, {
                    key: isCompleted ? `task-done-${task.id}` : `task-pending-${task.id}`,
                    color: isCompleted ? Theme.colors.success : Theme.colors.warning
                });
            }
        });

        // 2. Goals (Deadlines)
        goals.forEach(goal => {
            if (goal.deadline) {
                addMark(goal.deadline, {
                    key: `goal-${goal.id}`,
                    color: Theme.colors.primary
                });
            }
        });

        // 3. Diaries
        diaries.forEach(diary => {
            let dDate = null;
            if (diary.createdAt) {
                // Determine date string from Firestore timestamp or regular date
                if (diary.createdAt.toDate) {
                    dDate = diary.createdAt.toDate().toISOString().split('T')[0];
                } else if (typeof diary.createdAt === 'string') {
                    dDate = diary.createdAt.split('T')[0];
                } else if (typeof diary.createdAt === 'number') {
                    dDate = new Date(diary.createdAt).toISOString().split('T')[0];
                }
            } else if (diary.date) {
                dDate = diary.date; // fallback if you added a str date field
            }

            if (dDate) {
                addMark(dDate, {
                    key: `diary-${diary.id}`,
                    color: Theme.colors.secondary
                });
            }
        });

        // Mark the selected date
        if (marks[selectedDate]) {
            marks[selectedDate].selected = true;
            marks[selectedDate].selectedColor = Theme.colors.surface;
            marks[selectedDate].selectedTextColor = Theme.colors.primary;
        } else {
            marks[selectedDate] = {
                selected: true,
                selectedColor: Theme.colors.surface,
                selectedTextColor: Theme.colors.primary
            };
        }

        return marks;
    }, [tasks, goals, diaries, selectedDate]);

    // Filter items for the selected agenda view
    const agendaItems = useMemo(() => {
        const items = [];

        // Tasks
        tasks.forEach(task => {
            if (task.due === selectedDate) {
                items.push({ type: 'task', data: task });
            }
        });

        // Goals
        goals.forEach(goal => {
            if (goal.deadline === selectedDate) {
                items.push({ type: 'goal', data: goal });
            }
        });

        // Diaries
        diaries.forEach(diary => {
            let dDate = null;
            if (diary.createdAt) {
                if (diary.createdAt.toDate) {
                    dDate = diary.createdAt.toDate().toISOString().split('T')[0];
                } else if (typeof diary.createdAt === 'string') {
                    dDate = diary.createdAt.split('T')[0];
                } else if (typeof diary.createdAt === 'number') {
                    dDate = new Date(diary.createdAt).toISOString().split('T')[0];
                }
            }
            if (dDate === selectedDate) {
                items.push({ type: 'diary', data: diary });
            }
        });

        return items;
    }, [tasks, goals, diaries, selectedDate]);

    const renderAgendaItem = (item, index) => {
        if (item.type === 'task') {
            const isCompleted = item.data.status === 'completed';
            return (
                <TouchableOpacity
                    key={`agenda-task-${index}`}
                    style={styles.agendaCard}
                    onPress={() => navigation.navigate('TaskDetails', { taskId: item.data.id })}
                >
                    <View style={[styles.typeStrip, { backgroundColor: Theme.colors.warning }]} />
                    <View style={styles.agendaContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {isCompleted ? (
                                <CheckCircle2 size={16} color={Theme.colors.success} style={{ marginRight: 8 }} />
                            ) : (
                                <Circle size={16} color={Theme.colors.warning} style={{ marginRight: 8 }} />
                            )}
                            <Text style={styles.agendaTitle}>{item.data.title}</Text>
                        </View>
                        <Text style={styles.agendaSubtitle}>Task {isCompleted ? '(Completed)' : '(Pending)'}</Text>
                    </View>
                </TouchableOpacity>
            );
        }

        if (item.type === 'goal') {
            return (
                <TouchableOpacity
                    key={`agenda-goal-${index}`}
                    style={styles.agendaCard}
                    onPress={() => navigation.navigate('GoalDetails', { goalId: item.data.id })}
                >
                    <View style={[styles.typeStrip, { backgroundColor: Theme.colors.primary }]} />
                    <View style={styles.agendaContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Target size={16} color={Theme.colors.primary} style={{ marginRight: 8 }} />
                            <Text style={styles.agendaTitle}>{item.data.title}</Text>
                        </View>
                        <Text style={styles.agendaSubtitle}>Goal Deadline</Text>
                    </View>
                </TouchableOpacity>
            );
        }

        if (item.type === 'diary') {
            return (
                <TouchableOpacity
                    key={`agenda-diary-${index}`}
                    style={styles.agendaCard}
                    onPress={() => navigation.navigate('DiaryEntry', { entry: item.data })}
                >
                    <View style={[styles.typeStrip, { backgroundColor: Theme.colors.secondary }]} />
                    <View style={styles.agendaContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <BookOpen size={16} color={Theme.colors.secondary} style={{ marginRight: 8 }} />
                            <Text style={styles.agendaTitle}>{item.data.title || 'Diary Entry'}</Text>
                        </View>
                        <Text style={styles.agendaSubtitle}>Mood: {item.data.mood}</Text>
                    </View>
                </TouchableOpacity>
            );
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Calendar</Text>
            </View>

            <Calendar
                current={selectedDate}
                onDayPress={day => {
                    setSelectedDate(day.dateString);
                }}
                enableSwipeMonths={true}
                markingType={'multi-dot'}
                markedDates={markedDates}
                theme={{
                    backgroundColor: Theme.colors.background,
                    calendarBackground: Theme.colors.background,
                    textSectionTitleColor: Theme.colors.textSecondary,
                    selectedDayBackgroundColor: Theme.colors.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: Theme.colors.primary,
                    dayTextColor: Theme.colors.textMain,
                    textDisabledColor: Theme.colors.border,
                    dotColor: Theme.colors.primary,
                    selectedDotColor: '#ffffff',
                    arrowColor: Theme.colors.primary,
                    monthTextColor: Theme.colors.textMain,
                    textMonthFontFamily: Theme.typography.header,
                    textDayFontFamily: Theme.typography.body,
                    textDayHeaderFontFamily: Theme.typography.subHeader,
                }}
            />

            <View style={styles.agendaHeader}>
                <Text style={styles.agendaHeaderText}>Schedule for {selectedDate}</Text>

                <View style={styles.quickAddRow}>
                    {!isPastDate && (
                        <TouchableOpacity
                            style={styles.quickAddBtn}
                            onPress={() => navigation.navigate('TaskForm', { prefilledDate: selectedDate })}
                        >
                            <CheckCircle2 size={16} color={Theme.colors.primary} />
                            <Text style={styles.quickAddText}>Task</Text>
                        </TouchableOpacity>
                    )}

                    {!isPastDate && (
                        <TouchableOpacity
                            style={styles.quickAddBtn}
                            onPress={() => navigation.navigate('GoalForm', { prefilledDate: selectedDate })}
                        >
                            <Target size={16} color={Theme.colors.primary} />
                            <Text style={styles.quickAddText}>Goal</Text>
                        </TouchableOpacity>
                    )}

                    {!isFutureDate && (
                        <TouchableOpacity
                            style={styles.quickAddBtn}
                            onPress={() => navigation.navigate('DiaryForm', { prefilledDate: selectedDate })}
                        >
                            <BookOpen size={16} color={Theme.colors.primary} />
                            <Text style={styles.quickAddText}>Diary</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.agendaList} showsVerticalScrollIndicator={false}>
                {agendaItems.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>Nothing scheduled for this day.</Text>
                    </View>
                ) : (
                    agendaItems.map((item, index) => renderAgendaItem(item, index))
                )}
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
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
        backgroundColor: Theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
    },
    agendaHeader: {
        paddingHorizontal: Theme.spacing.lg,
        paddingTop: Theme.spacing.lg,
        paddingBottom: Theme.spacing.sm,
        backgroundColor: Theme.colors.background,
    },
    agendaHeaderText: {
        fontSize: 16,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textSecondary,
        marginBottom: 16,
    },
    quickAddRow: {
        flexDirection: 'row',
        gap: 8,
    },
    quickAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    quickAddText: {
        marginLeft: 6,
        fontSize: 12,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
    },
    agendaList: {
        padding: Theme.spacing.lg,
        paddingBottom: 100,
    },
    agendaCard: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    typeStrip: {
        width: 6,
    },
    agendaContent: {
        flex: 1,
        padding: 16,
    },
    agendaTitle: {
        fontSize: 16,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
    },
    agendaSubtitle: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginTop: 4,
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
    }
});
