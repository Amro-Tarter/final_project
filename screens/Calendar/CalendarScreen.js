import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { MotiView } from 'moti';
import { Calendar } from 'react-native-calendars';
import { useTasks } from '../../hooks/useTasks';
import { useGoals } from '../../hooks/useGoals';
import { useDiary } from '../../hooks/useDiary';
import { useHabits } from '../../hooks/useHabits';
import { CheckCircle2, Circle, Target, BookOpen, Plus, Repeat } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function CalendarScreen({ navigation, embedded = false }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const { tasks } = useTasks();
    const { goals } = useGoals();
    const { entries: diaries } = useDiary();
    const { habits } = useHabits();

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
            if (!marks[dateStr].dots.find(d => d.type === dot.type)) {
                marks[dateStr].dots.push(dot);
            }
        };

        // 1. Tasks
        tasks.forEach(task => {
            if (task.due) {
                addMark(task.due, {
                    key: 'task',
                    type: 'task',
                    color: colors.success
                });
            }
        });

        // 2. Goals (Deadlines)
        goals.forEach(goal => {
            if (goal.deadline) {
                addMark(goal.deadline, {
                    key: 'goal',
                    type: 'goal',
                    color: colors.primary
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
                    color: colors.secondary
                });
            }
        });

        // Mark the selected date
        if (marks[selectedDate]) {
            marks[selectedDate].selected = true;
            marks[selectedDate].selectedColor = colors.surface;
            marks[selectedDate].selectedTextColor = colors.primary;
        } else {
            marks[selectedDate] = {
                selected: true,
                selectedColor: colors.surface,
                selectedTextColor: colors.primary
            };
        }

        return marks;
    }, [tasks, goals, diaries, selectedDate, colors]);

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

        // Habits
        (habits || []).forEach(habit => {
            if (habit.status === 'active') {
                items.push({ type: 'habit', data: habit });
            }
        });

        return items;
    }, [tasks, goals, diaries, habits, selectedDate]);

    const renderAgendaItem = (item, index) => {
        if (item.type === 'task') {
            const isCompleted = item.data.status === 'completed';
            return (
                <MotiView
                    key={`agenda-task-${index}`}
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: index * 50 }}
                >
                    <TouchableOpacity
                        style={[styles.agendaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => navigation.navigate('TaskDetails', { taskId: item.data.id })}
                    >
                        <View style={[styles.typeStrip, { backgroundColor: colors.success }]} />
                        <View style={styles.agendaContent}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {isCompleted ? (
                                    <CheckCircle2 size={16} color={colors.success} style={{ marginRight: 8 }} />
                                ) : (
                                    <Circle size={16} color={colors.success} style={{ marginRight: 8 }} />
                                )}
                                <Text style={[styles.agendaTitle, { color: colors.textMain }]}>{item.data.title}</Text>
                            </View>
                            <Text style={[styles.agendaSubtitle, { color: colors.textSecondary }]}>{t('stepLabel')} {isCompleted ? `(${t('done')})` : `(${t('pending')})`}</Text>
                        </View>
                    </TouchableOpacity>
                </MotiView>
            );
        }

        if (item.type === 'goal') {
            return (
                <MotiView
                    key={`agenda-goal-${index}`}
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: index * 50 }}
                >
                    <TouchableOpacity
                        style={[styles.agendaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => navigation.navigate('GoalDetails', { goalId: item.data.id })}
                    >
                        <View style={[styles.typeStrip, { backgroundColor: colors.primary }]} />
                        <View style={styles.agendaContent}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Target size={16} color={colors.primary} style={{ marginRight: 8 }} />
                                <Text style={[styles.agendaTitle, { color: colors.textMain }]}>{item.data.title}</Text>
                            </View>
                            <Text style={[styles.agendaSubtitle, { color: colors.textSecondary }]}>{t('goalDeadline')}</Text>
                        </View>
                    </TouchableOpacity>
                </MotiView>
            );
        }

        if (item.type === 'diary') {
            return (
                <MotiView
                    key={`agenda-diary-${index}`}
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: index * 50 }}
                >
                    <TouchableOpacity
                        style={[styles.agendaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => navigation.navigate('DiaryEntry', { entry: item.data })}
                    >
                        <View style={[styles.typeStrip, { backgroundColor: colors.secondary }]} />
                        <View style={styles.agendaContent}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <BookOpen size={16} color={colors.secondary} style={{ marginRight: 8 }} />
                                <Text style={[styles.agendaTitle, { color: colors.textMain }]}>{item.data.title || t('diariesTitle')}</Text>
                            </View>
                            <Text style={[styles.agendaSubtitle, { color: colors.textSecondary }]}>{t('diariesTitle')} · {item.data.mood}</Text>
                        </View>
                    </TouchableOpacity>
                </MotiView>
            );
        }

        if (item.type === 'habit') {
            return (
                <MotiView
                    key={`agenda-habit-${index}`}
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: index * 50 }}
                >
                    <TouchableOpacity
                        style={[styles.agendaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onPress={() => navigation.navigate('HabitForm', { habit: item.data })}
                    >
                        <View style={[styles.typeStrip, { backgroundColor: colors.warning }]} />
                        <View style={styles.agendaContent}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Repeat size={16} color={colors.warning} style={{ marginRight: 8 }} />
                                <Text style={[styles.agendaTitle, { color: colors.textMain }]}>{item.data.title}</Text>
                            </View>
                            <Text style={[styles.agendaSubtitle, { color: colors.textSecondary }]}>{t('habitsTab') || 'Habits'} · {item.data.frequency || 'Daily'}</Text>
                        </View>
                    </TouchableOpacity>
                </MotiView>
            );
        }
    };

    const body = (
        <ScrollView showsVerticalScrollIndicator={false}>
            {!embedded && (
                <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <Text style={[styles.headerTitle, { color: colors.textMain }]}>{t('calendar')}</Text>
                </View>
            )}

            <View style={[styles.legendContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('steps')}</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('goals')}</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('diariesTitle')}</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('habitsTab') || 'Habits'}</Text>
                </View>
            </View>

            <Calendar
                key={colors.background}
                current={selectedDate}
                onDayPress={day => {
                    setSelectedDate(day.dateString);
                }}
                enableSwipeMonths={true}
                markingType={'multi-dot'}
                markedDates={markedDates}
                theme={{
                    backgroundColor: colors.background,
                    calendarBackground: colors.background,
                    textSectionTitleColor: colors.textSecondary,
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: colors.primary,
                    dayTextColor: colors.textMain,
                    textDisabledColor: colors.border,
                    dotColor: colors.primary,
                    selectedDotColor: '#ffffff',
                    arrowColor: colors.primary,
                    monthTextColor: colors.textMain,
                    textMonthFontFamily: Theme.typography.header,
                    textDayFontFamily: Theme.typography.body,
                    textDayHeaderFontFamily: Theme.typography.subHeader,
                }}
            />

            <View style={[styles.agendaHeader, { backgroundColor: colors.background }]}>
                <Text style={[styles.agendaHeaderText, { color: colors.textSecondary }]}>{t('on')} {selectedDate}</Text>

                <View style={styles.quickAddRow}>
                    {!isPastDate && (
                        <TouchableOpacity
                            style={[styles.quickAddBtn, { backgroundColor: colors.primaryLight }]}
                            onPress={() => navigation.navigate('TaskForm', { prefilledDate: selectedDate })}
                        >
                            <CheckCircle2 size={16} color={colors.primary} />
                            <Text style={[styles.quickAddText, { color: colors.primary }]}>{t('addTask')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.agendaList}>
                {agendaItems.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('roadClear')}</Text>
                    </View>
                ) : (
                    agendaItems.map((item, index) => renderAgendaItem(item, index))
                )}
            </View>
        </ScrollView>
    );

    if (embedded) {
        return <View style={[styles.container, { backgroundColor: colors.background }]}>{body}</View>;
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {body}
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
        backgroundColor: Theme.colors.primaryLight,
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
        borderRadius: Theme.radii.lg,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
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
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
        backgroundColor: Theme.colors.surface,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
    }
});
