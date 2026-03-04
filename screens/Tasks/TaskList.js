import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyInput } from '../../components/components';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../context/NotificationContext';
import { Plus, CheckCircle2, Circle, Search, Filter } from 'lucide-react-native';

// Mock data for UI development
const MOCK_TASKS = [
    { id: '1', title: 'Complete Project Proposal', due: 'Today', status: 'pending' },
    { id: '2', title: 'Review Design Assets', due: 'Tomorrow', status: 'pending' },
    { id: '3', title: 'Email Marketing Team', due: 'Yesterday', status: 'completed' },
    { id: '4', title: 'Update Portfolio', due: 'Next Week', status: 'pending' },
];

export default function TaskList({ navigation }) {
    const { tasks, loading, toggleTaskStatus } = useTasks();
    const { showNotification } = useNotifications();
    const [filter, setFilter] = useState('All'); // All, Pending, Completed
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTasks = tasks.filter(task => {
        const matchesFilter = filter === 'All'
            ? true
            : task.status === filter.toLowerCase();

        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const renderItem = ({ item }) => {
        const isCompleted = item.status === 'completed';

        let isOverdue = false;
        if (!isCompleted && item.due) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(item.due);
            dueDate.setHours(0, 0, 0, 0);
            if (today > dueDate) {
                isOverdue = true;
            }
        }

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    isCompleted && styles.cardCompleted,
                    isOverdue && { borderColor: Theme.colors.error, borderWidth: 1 }
                ]}
                onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
            >
                <TouchableOpacity
                    style={styles.checkButton}
                    onPress={async () => {
                        await toggleTaskStatus(item);
                        if (!isCompleted) {
                            if (item.recurrence?.type && item.recurrence.type !== 'none') {
                                showNotification('success', "Task completed! Next occurrence scheduled 🗓️", 2);
                            } else {
                                showNotification('success', "Task completed! 🎉", 3);
                            }
                        } else {
                            showNotification('warning', "Task marked as pending 📝", 1);
                        }
                    }}
                >
                    {isCompleted ? (
                        <CheckCircle2 size={24} color={Theme.colors.success} />
                    ) : (
                        <Circle size={24} color={isOverdue ? Theme.colors.error : Theme.colors.textSecondary} />
                    )}
                </TouchableOpacity>

                <View style={styles.cardContent}>
                    <Text style={[
                        styles.taskTitle,
                        isCompleted && styles.textCompleted,
                        isOverdue && { color: Theme.colors.error }
                    ]}>
                        {item.title}
                    </Text>
                    {item.due && (
                        <Text style={[
                            styles.taskDue,
                            isOverdue && { color: Theme.colors.error, fontFamily: Theme.typography.subHeader }
                        ]}>
                            {isOverdue ? `Overdue: ${item.due}` : `Due: ${item.due}`}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Tasks</Text>
                {/* Placeholder for future sort/filter modal */}
                <TouchableOpacity>
                    <Filter size={24} color={Theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchSection}>
                <MyInput
                    placeholder="Search tasks..."
                    icon={Search}
                    value={searchQuery}
                    onChangeText={setSearchQuery}

                />
            </View>

            <View style={styles.tabs}>
                {['All', 'Pending', 'Completed'].map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, filter === tab && styles.tabActive]}
                        onPress={() => setFilter(tab)}
                    >
                        <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredTasks}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                            {loading ? "Loading tasks..." : "No tasks found. Add one!"}
                        </Text>
                    </View>
                }
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('TaskForm')}
            >
                <Plus size={32} color="#fff" />
            </TouchableOpacity>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
    },
    searchSection: {
        paddingHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.md,
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.md,
    },
    tab: {
        marginRight: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: Theme.colors.surface,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    tabActive: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
    },
    tabText: {
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textSecondary,
        fontSize: 14,
    },
    tabTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: Theme.spacing.lg,
        paddingBottom: 100, // For FAB
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.surface,
        padding: 16,
        borderRadius: Theme.radius,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    cardCompleted: {
        opacity: 0.7,
        backgroundColor: '#F8FAFC',
    },
    checkButton: {
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
        marginBottom: 4,
    },
    textCompleted: {
        textDecorationLine: 'line-through',
        color: Theme.colors.textSecondary,
    },
    taskDue: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.shadows.glow,
    },
});
