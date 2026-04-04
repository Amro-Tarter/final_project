import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { ArrowLeft, Zap, TrendingUp, AlertTriangle, Book, Sparkles, RefreshCw } from 'lucide-react-native';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getAIInsights } from '../../services/aiService';

const TYPE_CONFIG = {
    positive: { icon: Zap, color: '#F59E0B' },
    info: { icon: TrendingUp, color: Theme.colors.success },
    warning: { icon: AlertTriangle, color: Theme.colors.error },
};

export default function AIInsights({ navigation }) {
    const { profile, loading: profileLoading, refreshProfile } = useUserProfile();
    const [insights, setInsights] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchInsights = async (currentProfile) => {
        if (!currentProfile) return;
        setAiLoading(true);
        try {
            const data = await getAIInsights(currentProfile);
            setInsights(data);
        } catch (e) {
            console.error('Failed to get insights:', e);
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        if (profile) {
            fetchInsights(profile);
        }
    }, [profile]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshProfile();
        setRefreshing(false);
    };

    const isLoading = profileLoading || aiLoading;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Insights</Text>
                <TouchableOpacity onPress={() => fetchInsights(profile)} style={{ padding: 8 }} disabled={isLoading}>
                    <RefreshCw size={20} color={isLoading ? Theme.colors.border : Theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <Sparkles size={32} color={Theme.colors.primary} />
                        <Text style={styles.loadingText}>Analyzing your journey...</Text>
                        <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 16 }} />
                    </View>
                ) : !insights ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Could not load insights. Pull to refresh.</Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.subtitle}>
                            Here is what I noticed about your patterns, {profile?.userName}.
                        </Text>

                        {/* Insight Cards */}
                        {insights.insights?.map((item, index) => {
                            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
                            const IconComponent = config.icon;
                            return (
                                <View key={index} style={styles.card}>
                                    <View style={[styles.iconContainer, { backgroundColor: config.color + '20' }]}>
                                        <IconComponent size={24} color={config.color} />
                                    </View>
                                    <View style={styles.cardText}>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        <Text style={styles.cardDesc}>{item.desc}</Text>
                                    </View>
                                </View>
                            );
                        })}

                        {/* Daily Topic */}
                        {insights.dailyTopic && (
                            <View style={styles.topicBox}>
                                <View style={styles.topicHeader}>
                                    <Book size={20} color={Theme.colors.primary} />
                                    <Text style={styles.topicLabel}>Today's Growth Topic</Text>
                                </View>
                                <Text style={styles.topicTitle}>{insights.dailyTopic.title}</Text>
                                <Text style={styles.topicDesc}>{insights.dailyTopic.desc}</Text>
                                <Text style={styles.topicWhy}>
                                    <Text style={{ fontFamily: Theme.typography.subHeader }}>Why it matters: </Text>
                                    {insights.dailyTopic.why}
                                </Text>
                            </View>
                        )}

                        {/* Daily Advice */}
                        {insights.dailyAdvice && (
                            <View style={styles.suggestionBox}>
                                <Text style={styles.suggestionTitle}>Today's Advice for You</Text>
                                <Text style={styles.suggestionText}>"{insights.dailyAdvice}"</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
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
    content: { padding: Theme.spacing.lg, paddingBottom: 40 },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        gap: 12,
    },
    loadingText: {
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        fontSize: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginBottom: 24,
        lineHeight: 24,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.surface,
        padding: 16,
        borderRadius: Theme.radius,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardText: { flex: 1 },
    cardTitle: {
        fontSize: 16,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        lineHeight: 20,
    },
    topicBox: {
        marginTop: 8,
        marginBottom: 16,
        backgroundColor: '#FFF7ED',
        padding: 20,
        borderRadius: Theme.radius,
        borderWidth: 1,
        borderColor: '#FED7AA',
    },
    topicHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    topicLabel: {
        fontSize: 12,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    topicTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 8,
    },
    topicDesc: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    topicWhy: {
        fontSize: 13,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        lineHeight: 18,
        fontStyle: 'italic',
    },
    suggestionBox: {
        marginTop: 8,
        backgroundColor: '#EEF2FF',
        padding: 24,
        borderRadius: Theme.radius,
        alignItems: 'center',
    },
    suggestionTitle: {
        fontSize: 12,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    suggestionText: {
        fontSize: 17,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 26,
    },
});
