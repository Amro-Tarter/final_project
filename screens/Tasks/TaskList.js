import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Theme, MyInput } from '../../components/components';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../context/NotificationContext';
import { Plus, CheckCircle2, Circle, Search } from 'lucide-react-native';
import { EmptyState } from '../../components/ui/EmptyState';
import { JourneyCopy } from '../../constants/JourneyCopy';
import { filterTasksByPlanTab } from '../../utils/journeyHelpers';

export default function TaskList({ navigation, embedded = false }) {
    const { tasks, loading, toggleTaskStatus } = useTasks();
    const { showNotification } = useNotifications();
    const [filter, setFilter] = useState('Today');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTasks = filterTasksByPlanTab(tasks, filter).filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = ({ item }) => {
        const isCompleted = item.status === 'completed';
        const passedDate = !isCompleted && item.due && item.due < new Date().toISOString().split('T')[0];

        return (
            <TouchableOpacity
                style={[styles.card, isCompleted && styles.cardCompleted]}
                onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
                activeOpacity={0.85}
            >
                <TouchableOpacity
                    style={styles.checkButton}
                    onPress={async () => {
                        await toggleTaskStatus(item);
                        if (!isCompleted) {
                            try {
                                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            } catch (_) {}
                            if (item.recurrence?.type && item.recurrence.type !== 'none') {
                                showNotification('success', 'Step done! Next one scheduled 🗓️', 2);
                            } else {
                                showNotification('success', 'Step completed! 🌟', 3);
                            }
                        } else {
                            showNotification('warning', 'Step marked as pending', 1);
                        }
                    }}
                >
                    {isCompleted ? (
                        <CheckCircle2 size={24} color={Theme.colors.success} />
                    ) : (
                        <Circle size={24} color={Theme.colors.primary} />
                    )}
                </TouchableOpacity>

                <View style={styles.cardContent}>
                    <Text style={[styles.taskTitle, isCompleted && styles.textCompleted]}>
                        {item.title}
                    </Text>
                    <View style={styles.metaRow}>
                        {item.due && (
                            <Text style={styles.taskDue}>
                                {passedDate ? `Passed: ${item.due}` : item.due}
                            </Text>
                        )}
                        {item.priority === 'High' && (
                            <View style={styles.focusBadge}>
                                <Text style={styles.focusText}>Focus</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const content = (
        <>
            {!embedded && (
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Plan</Text>
                        <Text style={styles.headerSub}>Your next steps</Text>
                    </View>
                </View>
            )}

            <View style={styles.searchSection}>
                <MyInput
                    placeholder="Search steps..."
                    icon={Search}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.tabs}>
                {['Today', 'Upcoming', 'Completed'].map(tab => (
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
                    <EmptyState
                        title={JourneyCopy.empty.tasks.title}
                        subtitle={loading ? 'Loading...' : JourneyCopy.empty.tasks.subtitle}
                        cta={!loading ? JourneyCopy.empty.tasks.cta : undefined}
                        onPress={() => navigation.navigate('TaskForm')}
                        icon={Plus}
                    />
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('TaskForm')}
            >
                <Plus size={28} color="#fff" />
            </TouchableOpacity>
        </>
    );

    if (embedded) {
        return <View style={styles.embedded}>{content}</View>;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {content}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    embedded: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
    },
    headerTitle: {
        fontSize: 26,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
    },
    headerSub: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginTop: 4,
    },
    searchSection: {
        paddingHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.sm,
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.md,
        gap: 8,
    },
    tab: {
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
        fontSize: 13,
    },
    tabTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: Theme.spacing.lg,
        paddingBottom: 100,
        flexGrow: 1,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.surface,
        padding: 16,
        borderRadius: Theme.radii.lg,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    cardCompleted: {
        opacity: 0.75,
        backgroundColor: Theme.colors.background,
    },
    checkButton: {
        marginRight: 14,
    },
    cardContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 15,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
        marginBottom: 4,
    },
    textCompleted: {
        textDecorationLine: 'line-through',
        color: Theme.colors.textSecondary,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    taskDue: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
    },
    focusBadge: {
        backgroundColor: Theme.colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    focusText: {
        fontSize: 10,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Theme.shadows.glow,
    },
});
