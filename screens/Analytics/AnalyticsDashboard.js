import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../components/components';
import { ArrowLeft, TrendingUp, Target, Flag, BookOpen, Sparkles } from 'lucide-react-native';
import { useTasks } from '../../hooks/useTasks';
import { useGoals } from '../../hooks/useGoals';
import { useDiary } from '../../hooks/useDiary';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getWeeklyCompletionData, getJourneyStats, calculateMomentum } from '../../utils/journeyHelpers';

const ChartBar = ({ height, day, color, isPrimary }) => {
    const { colors } = useAppTheme();
    return (
        <View style={styles.chartBarContainer}>
            {isPrimary ? (
                <LinearGradient
                    colors={Theme.gradients.hero}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[styles.chartBar, { height: Math.max(height, 8) }]}
                />
            ) : (
                <View style={[styles.chartBar, { height: Math.max(height, 8), backgroundColor: color || colors.surface }]} />
            )}
            <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>{day}</Text>
        </View>
    );
};

export default function AnalyticsDashboard({ navigation }) {
    const { tasks } = useTasks();
    const { goals } = useGoals();
    const { entries } = useDiary();
    const { profile } = useUserProfile();
    const { colors } = useAppTheme();
    const { t } = useLanguage();

    const stats = useMemo(() => getJourneyStats(tasks, goals, entries), [tasks, goals, entries]);
    const weeklyData = useMemo(() => getWeeklyCompletionData(tasks), [tasks]);
    const momentum = calculateMomentum(tasks);

    const burnoutSignal = profile?.tasks?.overdue > 2 && profile?.diary?.emotionalTone === 'struggling';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textMain }]}>{t('journeyInsights')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.intro, { color: colors.textSecondary }]}>
                    {t('journeyInsightsSub')}
                </Text>

                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Flag size={20} color={colors.primary} />
                        <Text style={[styles.statValue, { color: colors.textMain }]}>{stats.tasksCompleted}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('stepsDone')}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Target size={20} color={colors.success} />
                        <Text style={[styles.statValue, { color: colors.textMain }]}>{stats.milestonesReached}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('tasks')}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <TrendingUp size={20} color={colors.secondary} />
                        <Text style={[styles.statValue, { color: colors.textMain }]}>{stats.goalsCompleted}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('goals')}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <BookOpen size={20} color={colors.warning} />
                        <Text style={[styles.statValue, { color: colors.textMain }]}>{stats.reflectionsWritten}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('reflectionsWritten')}</Text>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('weeklyMomentum')}</Text>
                <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>{t('stepsByDay')}</Text>
                    <View style={styles.chartRow}>
                        {weeklyData.map((d, i) => (
                            <ChartBar key={i} day={d.day} height={d.height} isPrimary={true} />
                        ))}
                    </View>
                </View>

                <View style={[styles.momentumCard, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
                    <View style={styles.momentumHeader}>
                        <Sparkles size={20} color={colors.primary} />
                        <Text style={[styles.momentumTitle, { color: colors.primary }]}>{t('momentumLevel')}</Text>
                    </View>
                    <Text style={[styles.momentumValue, { color: colors.textMain }]}>{momentum}%</Text>
                    <View style={[styles.momentumTrack, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
                        <LinearGradient
                            colors={Theme.gradients.hero}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.momentumFill, { width: `${momentum}%` }]}
                        />
                    </View>
                    <Text style={[styles.momentumSub, { color: colors.textSecondary }]}>
                        {momentum >= 50 ? t('momentumHigh') : t('momentumLow')}
                    </Text>
                </View>

                {burnoutSignal && (
                    <View style={[styles.burnoutCard, { backgroundColor: colors.warningLight, borderColor: colors.warningBorder }]}>
                        <Text style={[styles.burnoutTitle, { color: colors.warningText }]}>{t('gentleCheckIn')}</Text>
                        <Text style={[styles.burnoutText, { color: colors.warningText }]}>
                            {t('burnoutText')}
                        </Text>
                    </View>
                )}

                {profile?.psychology?.dailyExecutionTime && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('peakFocusTime')}</Text>
                        <View style={[styles.peakCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.peakText, { color: colors.textMain }]}>{profile.psychology.dailyExecutionTime}</Text>
                        </View>
                    </>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
    },
    content: {
        padding: Theme.spacing.lg,
        paddingBottom: 40,
    },
    intro: {
        fontSize: 15,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        lineHeight: 22,
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    statCard: {
        width: '47%',
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    statValue: {
        fontSize: 28,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 12,
    },
    chartCard: {
        backgroundColor: Theme.colors.surface,
        padding: 20,
        borderRadius: Theme.radii.lg,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
    },
    chartSubtitle: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginBottom: 16,
    },
    chartRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
    },
    chartBarContainer: {
        alignItems: 'center',
        flex: 1,
    },
    chartBar: {
        width: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    chartLabel: {
        fontSize: 10,
        color: Theme.colors.textSecondary,
        fontFamily: Theme.typography.body,
    },
    momentumCard: {
        backgroundColor: Theme.colors.primaryLight,
        borderRadius: Theme.radii.lg,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Theme.colors.primaryBorder,
    },
    momentumHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    momentumTitle: {
        fontSize: 15,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
    },
    momentumValue: {
        fontSize: 32,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 10,
    },
    momentumTrack: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    momentumFill: {
        height: '100%',
        borderRadius: 4,
    },
    momentumSub: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        lineHeight: 20,
    },
    burnoutCard: {
        backgroundColor: Theme.colors.warningLight,
        borderRadius: Theme.radii.lg,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Theme.colors.warningBorder,
    },
    burnoutTitle: {
        fontSize: 15,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.warningText,
        marginBottom: 6,
    },
    burnoutText: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: '#9A3412',
        lineHeight: 20,
    },
    peakCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 18,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    peakText: {
        fontSize: 15,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
    },
});
