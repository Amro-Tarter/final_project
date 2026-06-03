import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { SegmentTabs } from '../../components/ui/SegmentTabs';
import { MoodRiver } from '../../components/ui/MoodRiver';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import DiaryTimeline from '../Diary/DiaryTimeline';
import { useDiary } from '../../hooks/useDiary';
import { useTasks } from '../../hooks/useTasks';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getAIInsights } from '../../services/aiService';
import { getLast7Moods, getWeeklyCompletionData, calculateMomentum } from '../../utils/journeyHelpers';
import { InsightCard } from '../../components/ui/JourneyCards';
import { SectionHeader } from '../../components/ui/SegmentTabs';
import { Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Sparkles } from 'lucide-react-native';

const ChartBar = ({ height, day, color }) => (
    <View style={styles.chartBarContainer}>
        {color === Theme.colors.primary ? (
            <LinearGradient
                colors={Theme.gradients.hero}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={[styles.chartBar, { height: Math.max(height, 8) }]}
            />
        ) : (
            <View style={[styles.chartBar, { height: Math.max(height, 8), backgroundColor: color }]} />
        )}
        <Text style={[styles.chartLabel, { color: Theme.colors.textSecondary }]}>{day}</Text>
    </View>
);

function InsightsPanel({ profile, weeklyData, momentum, burnoutSignal }) {
    const { colors } = useAppTheme();
    const { t, language } = useLanguage();
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;
        getAIInsights(profile, language)
            .then((data) => {
                if (typeof data === 'string') {
                    try {
                        setInsights(JSON.parse(data));
                    } catch {
                        setInsights(null);
                    }
                } else {
                    setInsights(data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [profile, language]);

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('Gathering diaries...')}</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.insightsContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('weeklyMomentum')}</Text>
            <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>{t('stepsByDay')}</Text>
                <View style={styles.chartRow}>
                    {weeklyData.map((d, i) => (
                        <ChartBar key={i} day={d.day} height={d.height} color={colors.primary} />
                    ))}
                </View>
            </View>

            <View style={[styles.momentumCard, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
                <View style={styles.momentumHeader}>
                    <Sparkles size={20} color={colors.primary} />
                    <Text style={[styles.momentumTitle, { color: colors.primary }]}>{t('momentumLevel')}</Text>
                </View>
                <Text style={[styles.momentumValue, { color: colors.textMain }]}>{momentum}%</Text>
                <View style={styles.momentumTrack}>
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

            <SectionHeader title={t('diaryInsights')} />
            {insights?.insights?.map((item, i) => (
                <InsightCard key={i} title={item.title} desc={item.desc} type={item.type} />
            ))}
            {insights?.dailyAdvice && (
                <View style={[styles.adviceBox, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
                    <Text style={[styles.adviceLabel, { color: colors.primary }]}>{t('dailyGuidance')}</Text>
                    <Text style={[styles.adviceText, { color: colors.textMain }]}>{insights.dailyAdvice}</Text>
                </View>
            )}
        </ScrollView>
    );
}

export default function ReflectScreen({ navigation }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const [tabIndex, setTabIndex] = useState(0);
    const tabs = [t('diary'), t('insights')];
    const { entries } = useDiary();
    const { tasks } = useTasks();
    const { profile } = useUserProfile();
    const moods = getLast7Moods(entries);

    const weeklyData = getWeeklyCompletionData(tasks);
    const momentum = calculateMomentum(tasks);
    const burnoutSignal = profile?.tasks?.overdue > 2 && profile?.diary?.emotionalTone === 'struggling';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.screenHeader}>
                <View>
                    <Text style={[styles.screenTitle, { color: colors.textMain }]}>{t('diary')}</Text>
                    <Text style={[styles.screenSub, { color: colors.textSecondary }]}>{t('diarySub')}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('DiaryForm')} style={styles.addButton}>
                    <Plus size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>
            <SegmentTabs tabs={tabs} activeTab={tabs[tabIndex]} onTabChange={(selected) => setTabIndex(tabs.indexOf(selected))} />
            {tabIndex === 0 ? (
                <View style={styles.flex}>
                    <DiaryTimeline 
                        navigation={navigation} 
                        embedded 
                        customHeader={
                            <View style={styles.moodSection}>
                                <MoodRiver moods={moods} />
                            </View>
                        }
                    />
                </View>
            ) : (
                <InsightsPanel profile={profile} weeklyData={weeklyData} momentum={momentum} burnoutSignal={burnoutSignal} />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    screenHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Theme.spacing.lg,
        paddingTop: Theme.spacing.md,
        paddingBottom: 4,
    },
    addButton: {
        padding: 8,
        marginRight: -8,
    },
    screenTitle: {
        fontSize: 26,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
    },
    screenSub: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginTop: 4,
    },
    flex: {
        flex: 1,
    },
    moodSection: {
        paddingHorizontal: Theme.spacing.lg,
        paddingTop: Theme.spacing.sm,
    },
    insightsContent: {
        padding: Theme.spacing.lg,
        paddingBottom: 40,
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
    },
    adviceBox: {
        backgroundColor: '#EEF2FF',
        borderRadius: Theme.radii.lg,
        padding: 20,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    adviceLabel: {
        fontSize: 12,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    adviceText: {
        fontSize: 15,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 12,
        marginTop: 16,
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
});
