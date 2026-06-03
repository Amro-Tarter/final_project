import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../components/components';
import { Plus, Map } from 'lucide-react-native';
import { useGoals } from '../../hooks/useGoals';
import { useTasks } from '../../hooks/useTasks';
import { GoalCard } from '../../components/ui/JourneyCards';
import { EmptyState } from '../../components/ui/EmptyState';
import { JourneyCopy } from '../../constants/JourneyCopy';
import { getCurrentTask, getGoalTasks } from '../../utils/journeyHelpers';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function GoalList({ navigation }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const { goals, loading } = useGoals();
    const { tasks } = useTasks();

    const activeGoals = useMemo(
        () => goals.filter(g => g.status !== 'completed'),
        [goals]
    );

    const renderItem = ({ item }) => {
        const currentTask = getCurrentTask(tasks, item.id);
        const remaining = getGoalTasks(tasks, item.id).filter(t => t.status === 'pending').length;

        return (
            <GoalCard
                goal={item}
                currentTask={currentTask?.title}
                remainingTasks={remaining}
                onPress={() => navigation.navigate('GoalDetails', { goalId: item.id })}
            />
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: colors.textMain }]}>{t('yourJourney')}</Text>
                    <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{t('goalsHeading')}</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButtonWrapper}
                    onPress={() => navigation.navigate('GoalForm')}
                >
                    <LinearGradient
                        colors={Theme.gradients.hero}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.addButtonGradient}
                    >
                        <Plus size={24} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <FlatList
                data={activeGoals}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    loading ? (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
                    ) : (
                        <EmptyState
                            title={JourneyCopy.empty.goals.title}
                            subtitle={JourneyCopy.empty.goals.subtitle}
                            cta={JourneyCopy.empty.goals.cta}
                            onPress={() => navigation.navigate('GoalForm')}
                            icon={Map}
                        />
                    )
                }
            />
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
        alignItems: 'flex-start',
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
    addButtonWrapper: {
        borderRadius: 22,
        ...Theme.shadows.glow,
    },
    addButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: Theme.spacing.lg,
        paddingTop: 0,
        flexGrow: 1,
    },
});
