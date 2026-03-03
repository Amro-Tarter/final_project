import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton } from '../../components/components';
import { ArrowLeft, MapPin, CheckCircle2, Circle } from 'lucide-react-native';
import { useGoals } from '../../hooks/useGoals';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../context/NotificationContext';

export default function GoalDetails({ navigation, route }) {
    const goalId = route?.params?.goalId;

    const { goals, updateGoal, deleteGoal } = useGoals();
    const { tasks } = useTasks();
    const { showNotification } = useNotifications();

    
    // Get tasks associated with this goal
    const goalTasks = tasks.filter(t => t.goalId === goalId);

    const hasTasks = goalTasks.length > 0;
    const allTasksCompleted =hasTasks && goalTasks.every(t => t.status === 'completed');
    const goal = goals.find(g => g.id === goalId);

    if (!goal) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={Theme.colors.textMain} />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontFamily: Theme.typography.body, color: Theme.colors.textSecondary }}>
                        Goal not found or deleted.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleComplete = async () => {
        Alert.alert(
            "Complete Goal",
            " Congratulations on finishing your goal this is a great step forward!",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Complete Goal",
                    onPress: async () => {
                        await updateGoal(goal.id, { status: 'completed', progress: 1 });
                        showNotification('success', `🎉 Amazing job! You completed: ${goal.title}`, 4);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Goal",
            "Are you sure you want to delete this goal? Tasks attached to it will not be deleted, but they will be unlinked from this goal.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteGoal(goal.id);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Goal Roadmap</Text>
                <TouchableOpacity onPress={() => navigation.navigate('GoalForm', { goal })}>
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{goal.title}</Text>
                <Text style={styles.subtitle}>Your journey so far</Text>

                <View style={styles.timeline}>
                    {/* Vertical Line */}
                    <View style={styles.line} />

                    {goalTasks.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.milestoneRow}
                            onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
                        >
                            <View style={styles.markerContainer}>
                                {item.status === 'completed' ? (
                                    <CheckCircle2 size={24} color={Theme.colors.success} />
                                ) : (
                                    <Circle size={24} color={Theme.colors.border} />
                                )}
                            </View>
                            <View style={styles.milestoneCard}>
                                <Text style={[
                                    styles.milestoneTitle,
                                    item.status === 'completed' && styles.completedText
                                ]}>
                                    {item.title}
                                </Text>
                                <Text style={styles.milestoneStatus}>
                                    {item.status === 'completed' ? 'Done' : 'Pending'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}

                    <View style={styles.milestoneRow}>
                        <View style={styles.markerContainer}>
                            <MapPin size={24} color={Theme.colors.secondary} />
                        </View>
                        <Text style={styles.finishText}>Finish Line</Text>
                    </View>
                </View>

                <MyButton
                    title={
                        goal.status === 'completed'
                            ? "Completed 🎉"
                            : "Complete Goal"
                    }
                    disabled={
                        goal.status === 'completed' ||
                        !allTasksCompleted
                    }
                    style={{
                        marginTop: Theme.spacing.xl,
                        backgroundColor:
                            goal.status === 'completed'
                                ? Theme.colors.success
                                : Theme.colors.primary,
                        opacity: !allTasksCompleted && goal.status !== 'completed' ? 0.5 : 1
                    }}
                    onPress={handleComplete}
                />

                <MyButton
                    title="Delete Goal"
                    onPress={handleDelete}
                    type="secondary"
                    style={{ marginTop: Theme.spacing.md, borderColor: Theme.colors.error }}
                    textStyle={{ color: Theme.colors.error }}
                />

                <View style={{ height: 20 }} />

                <MyButton
                    title="Add Milestone"
                    type="secondary"
                    onPress={() => navigation.navigate('TaskForm', { prefilledGoalId: goal.id })}
                />

                <View style={{ height: 40 }} />
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
    },
    title: {
        fontSize: 24,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginBottom: Theme.spacing.xl,
    },
    timeline: {
        position: 'relative',
        paddingLeft: 12,
    },
    line: {
        position: 'absolute',
        left: 23,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: Theme.colors.border,
        zIndex: -1,
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    markerContainer: {
        backgroundColor: Theme.colors.background,
        paddingVertical: 4,
        marginRight: 16,
    },
    milestoneCard: {
        flex: 1,
        backgroundColor: Theme.colors.surface,
        padding: 16,
        borderRadius: Theme.radius,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    milestoneTitle: {
        fontSize: 16,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
        marginBottom: 4,
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: Theme.colors.textSecondary,
    },
    milestoneStatus: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
    },
    finishText: {
        marginTop: 8,
        fontSize: 16,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain
    }
});
