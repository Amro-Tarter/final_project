import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyInput } from '../../components/components';
import { Plus, CheckCircle2, Circle, Search, Filter } from 'lucide-react-native';

// Mock data for UI development
const MOCK_TASKS = [
    { id: '1', title: 'Complete Project Proposal', due: 'Today', status: 'pending' },
    { id: '2', title: 'Review Design Assets', due: 'Tomorrow', status: 'pending' },
    { id: '3', title: 'Email Marketing Team', due: 'Yesterday', status: 'completed' },
    { id: '4', title: 'Update Portfolio', due: 'Next Week', status: 'pending' },
];

export default function TaskList({ navigation }) {
    const [filter, setFilter] = useState('All'); // All, Pending, Completed
    const [searchQuery, setSearchQuery] = useState('');

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.card,
                item.status === 'completed' && styles.cardCompleted
            ]}
            onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
        >
            <TouchableOpacity style={styles.checkButton}>
                {item.status === 'completed' ? (
                    <CheckCircle2 size={24} color={Theme.colors.success} />
                ) : (
                    <Circle size={24} color={Theme.colors.textSecondary} />
                )}
            </TouchableOpacity>

            <View style={styles.cardContent}>
                <Text style={[
                    styles.taskTitle,
                    item.status === 'completed' && styles.textCompleted
                ]}>
                    {item.title}
                </Text>
                <Text style={styles.taskDue}>{item.due}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Tasks</Text>
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
                    style={{ marginBottom: 0 }} // Override default margin
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
                data={MOCK_TASKS}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
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
