import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { ArrowLeft } from 'lucide-react-native';

const ChartBar = ({ height, day, color }) => (
    <View style={styles.chartBarContainer}>
        <View style={[styles.chartBar, { height, backgroundColor: color }]} />
        <Text style={styles.chartLabel}>{day}</Text>
    </View>
);

export default function AnalyticsDashboard({ navigation }) {
    const weeklyData = [
        { day: 'Mon', h: 60 }, { day: 'Tue', h: 80 }, { day: 'Wed', h: 50 },
        { day: 'Thu', h: 90 }, { day: 'Fri', h: 70 }, { day: 'Sat', h: 30 }, { day: 'Sun', h: 40 }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Analytics</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <Text style={styles.sectionTitle}>Task Completion</Text>
                <View style={styles.chartCard}>
                    <Text style={styles.chartSubtitle}>Tasks completed this week</Text>
                    <View style={styles.chartRow}>
                        {weeklyData.map((d, i) => (
                            <ChartBar key={i} day={d.day} height={d.h} color={Theme.colors.primary} />
                        ))}
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Focus Time</Text>
                <View style={styles.chartCard}>
                    <Text style={styles.chartSubtitle}>Hours spent in deep work</Text>
                    <View style={styles.chartRow}>
                        {weeklyData.map((d, i) => (
                            <ChartBar key={i} day={d.day} height={d.h * 0.8} color={Theme.colors.secondary} />
                        ))}
                    </View>
                </View>

                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>85%</Text>
                        <Text style={styles.summaryLabel}>Goal Progress</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryValue}>12</Text>
                        <Text style={styles.summaryLabel}>Streak Days</Text>
                    </View>
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
    sectionTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 12,
    },
    chartCard: {
        backgroundColor: Theme.colors.surface,
        padding: 20,
        borderRadius: Theme.radius,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
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
        height: 120,
    },
    chartBarContainer: {
        alignItems: 'center',
        width: 20,
    },
    chartBar: {
        width: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    chartLabel: {
        fontSize: 10,
        color: Theme.colors.textSecondary,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryCard: {
        flex: 0.48,
        backgroundColor: Theme.colors.surface,
        padding: 20,
        borderRadius: Theme.radius,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    summaryValue: {
        fontSize: 32,
        fontFamily: Theme.typography.header,
        color: Theme.colors.primary,
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
    }
});
