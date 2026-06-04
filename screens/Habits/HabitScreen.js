import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme, MyCheckbox } from '../../components/components';
import { Plus, Repeat } from 'lucide-react-native';
import { useHabits } from '../../hooks/useHabits';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function HabitScreen({ navigation, embedded = false }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const { habits, loading, checkInHabit, uncheckHabit, isHabitCompletedForDate } = useHabits();

    // Use today's date for check-ins on this screen
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    // A small local component to handle check-in state per item efficiently without re-rendering the whole list
    const HabitItem = ({ item }) => {
        const [isCompleted, setIsCompleted] = React.useState(false);

        React.useEffect(() => {
            isHabitCompletedForDate(item.id, today).then(setIsCompleted);
        }, [item.id, today]);

        const toggleHabit = async () => {
            const nextState = !isCompleted;
            setIsCompleted(nextState); // optimistic update
            if (nextState) {
                await checkInHabit(item.id, today);
            } else {
                await uncheckHabit(item.id, today);
            }
        };

        return (
            <TouchableOpacity
                style={[styles.habitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => navigation.navigate('HabitDetails', { habitId: item.id })}
            >
                <View style={styles.habitHeader}>
                    <View style={styles.habitTitleRow}>
                        <Repeat size={18} color={colors.primary} />
                        <Text style={[styles.habitTitle, { color: colors.textMain }]}>{item.title}</Text>
                    </View>
                    <MyCheckbox
                        checked={isCompleted}
                        onPress={toggleHabit}
                        size={24}
                    />
                </View>
                
                <View style={styles.habitStats}>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: colors.warning }]}>🔥 {item.currentStreak || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('streak')}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: colors.success }]}>{item.consistencyRate || 0}%</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('consistency')}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{item.completedOccurrences || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('total')}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }) => <HabitItem item={item} />;
    const content = (
        <>
                {!embedded && (
                    <View style={styles.header}>
                        <View>
                            <Text style={[styles.headerTitle, { color: colors.textMain }]}>{t('yourHabits')}</Text>
                            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{t('habitsSubtitle')}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.addButtonWrapper}
                            onPress={() => navigation.navigate('HabitForm')}
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
                )}
    
                <FlatList
                    data={habits}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        loading ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
                        ) : (
                            <EmptyState
                                title={t('noHabitsTitle') || 'No Habits Yet'}
                                subtitle={t('noHabitsSub') || 'Build consistency by creating a recurring habit.'}
                                cta={t('addHabit') || 'Add Habit'}
                                onPress={() => navigation.navigate('HabitForm')}
                                icon={Repeat}
                            />
                        )
                    }
                />

                {embedded && (
                    <TouchableOpacity
                        style={styles.fabWrapper}
                        onPress={() => navigation.navigate('HabitForm')}
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
                )}
            </>
        );

    if (embedded) {
        return <View style={{ flex: 1, backgroundColor: colors.background }}>{content}</View>;
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
    habitCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
    },
    habitHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    habitTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    habitTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginLeft: 8,
        marginRight: 12,
    },
    habitStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 12,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 16,
        fontFamily: Theme.typography.header,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textSecondary,
        textTransform: 'uppercase',
    },
    fabWrapper: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        borderRadius: 28,
        ...Theme.shadows.glow,
        zIndex: 100,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
