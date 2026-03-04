import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton } from '../../components/components';
import { ArrowLeft, Calendar, Flag, RotateCw } from 'lucide-react-native';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../context/NotificationContext';

export default function TaskDetails({ navigation, route }) {
    const { taskId } = route.params;
    const { tasks, deleteTask, toggleTaskStatus } = useTasks();
    const { showNotification } = useNotifications();

    // Find the live task from the hook
    const item = tasks.find(t => t.id === taskId);

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
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={Theme.colors.textMain} />
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontFamily: Theme.typography.body, color: Theme.colors.textSecondary }}>
                        Task not found or deleted.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleDelete = () => {
        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteTask(item.id);
                        navigation.goBack();
                    }
                }
            ]
        );
    };

    const handleToggle = async () => {
        try {
            await toggleTaskStatus(item);

            // Logic to determine what notification to show
            if (item.status === 'pending') {
                // We just marked it as done (pending -> completed)
                // EXCEPT toggleTaskStatus runs before this check, but local 'item' is stale until re-render.
                // Actually wait, 'item' is const item = tasks.find... 
                // We need to check the NEW status or infer it.
                // If it WAS pending, and we toggled, it IS NOW completed (unless recurring).

                if (item.recurrence?.type && item.recurrence.type !== 'none') {
                    showNotification('success', "Task completed! Next occurrence scheduled 🗓️", 2);
                } else {
                    // Standard completion
                    showNotification('success', "Task completed! 🎉", 3);
                }
            } else {
                // It WAS completed, now pending
                showNotification('warning', "Task marked as pending 📝", 1);
            }
        } catch (error) {
            console.error("Toggle error:", error);
            showNotification('error', "Could not update task status 🛑");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Task Details</Text>
                {!isCompleted && !isOverdue && (
                    <TouchableOpacity onPress={() => navigation.navigate('TaskForm', { task: item })}>
                        <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{item.title}</Text>

                <View style={[
                    styles.statusBadge,
                    isOverdue && { backgroundColor: '#FEE2E2' },
                    isCompleted && { backgroundColor: '#DEF7EC' }
                ]}>
                    <Text style={[
                        styles.statusText,
                        isOverdue && { color: Theme.colors.error },
                        isCompleted && { color: Theme.colors.success }
                    ]}>
                        {isOverdue ? "OVERDUE" : item.status.toUpperCase()}
                    </Text>
                </View>

                {item.desc ? (
                    <>
                        <Text style={styles.sectionLabel}>Description</Text>
                        <Text style={styles.description}>{item.desc}</Text>
                    </>
                ) : null}

                <View style={styles.divider} />

                {item.due ? (
                    <View style={styles.row}>
                        <Calendar size={20} color={isOverdue ? Theme.colors.error : Theme.colors.primary} />
                        <View style={styles.rowText}>
                            <Text style={styles.label}>Due Date</Text>
                            <Text style={[
                                styles.value,
                                isOverdue && { color: Theme.colors.error, fontFamily: Theme.typography.subHeader }
                            ]}>{item.due}</Text>
                        </View>
                    </View>
                ) : null}

                {isCompleted && item.completedLate && (
                    <View style={styles.row}>
                        <Calendar size={20} color={Theme.colors.warning} />
                        <View style={styles.rowText}>
                            <Text style={styles.label}>Completed Info</Text>
                            <Text style={[styles.value, { color: Theme.colors.warning }]}>
                                {item.lateByDays === 1 ? '1 day late' : `${item.lateByDays} days late`}
                            </Text>
                        </View>
                    </View>
                )}

                {item.recurrence && item.recurrence.type !== 'none' && (
                    <View style={styles.row}>
                        <RotateCw size={20} color={Theme.colors.secondary} />
                        <View style={styles.rowText}>
                            <Text style={styles.label}>Repeats</Text>
                            <Text style={styles.value}>
                                {item.recurrence.type === 'daily' ? 'Daily' :
                                    item.recurrence.type === 'weekly' ? 'Weekly' :
                                        item.recurrence.type === 'custom' ? `Every ${item.recurrence.interval} Days` : ''}
                            </Text>
                        </View>
                    </View>
                )}

                <View style={styles.row}>
                    <Flag size={20} color={item.priority === 'High' ? Theme.colors.error : Theme.colors.textSecondary} />
                    <View style={styles.rowText}>
                        <Text style={styles.label}>Priority</Text>
                        <Text style={styles.value}>{item.priority || 'Normal'}</Text>
                    </View>
                </View>

                <View style={{ flex: 1 }} />

                <MyButton
                    title={item.status === 'completed' ? "Mark as Pending" : "Mark as Completed"}
                    onPress={handleToggle}
                    style={{ marginTop: Theme.spacing.xl }}
                />

                <MyButton
                    title="Delete Task"
                    onPress={handleDelete}
                    type="secondary"
                    style={{ marginTop: Theme.spacing.md, borderColor: Theme.colors.error }}
                    textStyle={{ color: Theme.colors.error }}
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
    editText: {
        fontSize: 16,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
    },
    content: {
        padding: Theme.spacing.lg,
        flexGrow: 1,
    },
    title: {
        fontSize: 24,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: Theme.spacing.xl,
    },
    statusText: {
        color: Theme.colors.primary,
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
