import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { SegmentTabs } from '../../components/ui/SegmentTabs';
import { MoodRiver } from '../../components/ui/MoodRiver';
import DiaryTimeline from '../Diary/DiaryTimeline';
import { useDiary } from '../../hooks/useDiary';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getAIInsights } from '../../services/aiService';
import { getLast7Moods } from '../../utils/journeyHelpers';
import { InsightCard } from '../../components/ui/JourneyCards';
import { SectionHeader } from '../../components/ui/SegmentTabs';
import { Text } from 'react-native';

function InsightsPanel({ profile }) {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile) return;
        getAIInsights(profile)
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
    }, [profile]);

    if (loading) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>Gathering reflections...</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.insightsContent} showsVerticalScrollIndicator={false}>
            <SectionHeader title="Reflection Insights" />
            {insights?.insights?.map((item, i) => (
                <InsightCard key={i} title={item.title} desc={item.desc} type={item.type} />
            ))}
            {insights?.dailyAdvice && (
                <View style={styles.adviceBox}>
                    <Text style={styles.adviceLabel}>Daily Guidance</Text>
                    <Text style={styles.adviceText}>{insights.dailyAdvice}</Text>
                </View>
            )}
        </ScrollView>
    );
}

export default function ReflectScreen({ navigation }) {
    const [tab, setTab] = useState('Journal');
    const { entries } = useDiary();
    const { profile } = useUserProfile();
    const moods = getLast7Moods(entries);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.screenHeader}>
                <Text style={styles.screenTitle}>Reflect</Text>
                <Text style={styles.screenSub}>Your emotional center</Text>
            </View>
            <SegmentTabs tabs={['Journal', 'Insights']} activeTab={tab} onTabChange={setTab} />
            {tab === 'Journal' ? (
                <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
                    <View style={styles.moodSection}>
                        <MoodRiver moods={moods} />
                    </View>
                    <DiaryTimeline navigation={navigation} embedded />
                </ScrollView>
            ) : (
                <InsightsPanel profile={profile} />
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
        paddingHorizontal: Theme.spacing.lg,
        paddingTop: Theme.spacing.md,
        paddingBottom: 4,
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
});
