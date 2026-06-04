import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Theme, MyInput } from '../../components/components';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../context/NotificationContext';
import { Plus, CheckCircle2, Circle, Search, ArrowLeft } from 'lucide-react-native';
import { EmptyState } from '../../components/ui/EmptyState';
import { JourneyCopy } from '../../constants/JourneyCopy';
import { filterTasksByPlanTab } from '../../utils/journeyHelpers';
import { useLanguage } from '../../context/LanguageContext';
import { TaskStepCard } from '../../components/ui/TaskStepCard';
import { useAppTheme } from '../../context/ThemeContext';

export default function TaskList({ navigation, embedded = false }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const { tasks, loading, toggleTaskStatus } = useTasks();
    const { showNotification } = useNotifications();
    const [filter, setFilter] = useState('Today');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTasks = filterTasksByPlanTab(tasks, filter)
        .filter(task => task.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (a.priority === 'High' && b.priority !== 'High') return -1;
            if (a.priority !== 'High' && b.priority === 'High') return 1;
            return 0;
        });

    const renderItem = ({ item }) => {
        const isCompleted = item.status === 'completed';

        return (
            <TaskStepCard
                task={item}
                onPress={() => navigation.navigate('TaskDetails', { taskId: item.id })}
                onToggle={async () => {
                    await toggleTaskStatus(item);
                    if (!isCompleted) {
                        try {
                            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch (_) {}
                        if (item.recurrence?.type && item.recurrence.type !== 'none') {
                            showNotification('success', t('taskCompletedRecurring'), 2);
                        } else {
                            showNotification('success', t('taskCompleted'), 3);
                        }
                    } else {
                        showNotification('warning', t('taskPending'), 1);
                    }
                }}
            />
        );
    };

    const content = (
        <>
            {!embedded && (
                <View style={[styles.header, { flexDirection: 'row', alignItems: 'center' }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <ArrowLeft size={24} color={colors.textMain} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.textMain }]}>{t('planTitle')}</Text>
                        <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{t('planSub')}</Text>
                    </View>
                </View>
            )}

            <View style={styles.searchSection}>
                <MyInput
                    placeholder={t('searchSteps')}
                    icon={Search}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
                    {['Today', 'Overdue', 'Upcoming', 'Completed'].map(tab => {
                        const tabText = tab === 'Today' ? t('today') : 
                                        tab === 'Overdue' ? t('overdueStatus') || 'Overdue' :
                                        tab === 'Upcoming' ? t('upcoming') : t('done');
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={filter !== tab ? [styles.tab, { backgroundColor: colors.surface, borderColor: colors.border }] : undefined}
                                onPress={() => setFilter(tab)}
                            >
                                {filter === tab ? (
                                    <LinearGradient
                                        colors={Theme.gradients.hero}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.tabActiveGradient}
                                    >
                                        <Text style={styles.tabTextActive}>{tabText}</Text>
                                    </LinearGradient>
                                ) : (
                                    <Text style={[styles.tabText, { color: colors.textSecondary }]}>{tabText}</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
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
                style={styles.fabWrapper}
                onPress={() => navigation.navigate('TaskForm')}
            >
                <LinearGradient
                    colors={Theme.gradients.hero}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.fabGradient}
                >
                    <Plus size={28} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </>
    );

    if (embedded) {
        return <View style={styles.embedded}>{content}</View>;
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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
    tabsContainer: {
        marginBottom: Theme.spacing.md,
    },
    tabsContent: {
        flexDirection: 'row',
        paddingHorizontal: Theme.spacing.lg,
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
    tabActiveGradient: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
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
    fabWrapper: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        ...Theme.shadows.glow,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
