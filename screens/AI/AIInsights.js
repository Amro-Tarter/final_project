import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { ArrowLeft, Zap, Clock, AlertTriangle, TrendingUp } from 'lucide-react-native';

const MOCK_INSIGHTS = [
    {
        id: '1',
        type: 'positive',
        title: 'Peak Performance',
        desc: 'You complete 80% of your tasks between 9 AM and 11 AM.',
        icon: Zap,
        color: '#F59E0B' // Amber
    },
    {
        id: '2',
        type: 'info',
        title: 'Goal Velocity',
        desc: 'You are ahead of schedule on "Run a Marathon". Great pace!',
        icon: TrendingUp,
        color: Theme.colors.success
    },
    {
        id: '3',
        type: 'warning',
        title: 'Possible Burnout?',
        desc: 'You worked late 4 days this week. Consider a lighter load tomorrow.',
        icon: AlertTriangle,
        color: Theme.colors.error
    },
];

export default function AIInsights({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Insights</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>Here is what I noticed about your productivity patterns this week.</Text>

                {MOCK_INSIGHTS.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                            <item.icon size={24} color={item.color} />
                        </View>
                        <View style={styles.cardText}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardDesc}>{item.desc}</Text>
                        </View>
                    </View>
                ))}

                <View style={styles.suggestionBox}>
                    <Text style={styles.suggestionTitle}>Suggestion for Tomorrow</Text>
                    <Text style={styles.suggestionText}>
                        "Try tackling your creative tasks first thing in the morning when your energy is highest."
                    </Text>
                </View>

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
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
    },
    content: {
        padding: Theme.spacing.lg,
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
    cardText: {
        flex: 1,
    },
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
    suggestionBox: {
        marginTop: 24,
        backgroundColor: '#EEF2FF',
        padding: 24,
        borderRadius: Theme.radius,
        alignItems: 'center',
    },
    suggestionTitle: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    suggestionText: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
