import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton } from '../../components/components';
import { ArrowLeft, MapPin, CheckCircle2, Circle } from 'lucide-react-native';

const MILESTONES = [
    { id: '1', title: 'Buy running shoes', status: 'completed' },
    { id: '2', title: 'Run 5k without stopping', status: 'completed' },
    { id: '3', title: 'Run 10k', status: 'pending' },
    { id: '4', title: 'Half-Marathon', status: 'pending' },
];

export default function GoalDetails({ navigation, route }) {
    // Mock data
    const goal = { title: 'Run a Marathon', progress: 0.5 };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Goal Roadmap</Text>
                <TouchableOpacity onPress={() => navigation.navigate('GoalForm', { goalId: '1' })}>
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{goal.title}</Text>
                <Text style={styles.subtitle}>Your journey so far</Text>

                <View style={styles.timeline}>
                    {/* Vertical Line */}
                    <View style={styles.line} />

                    {MILESTONES.map((item, index) => (
                        <View key={item.id} style={styles.milestoneRow}>
                            <View style={styles.markerContainer}>
                                {item.status === 'completed' ? (
                                    <CheckCircle2 size={24} color={Theme.colors.success} />
                                ) : (
                                    <Circle size={24} color={Theme.colors.border} />
                                )}
                            </View>
                            <View style={styles.milestoneCard}>
                                <Text style={[
                                    styles.milestoneTitle,
                                    item.status === 'completed' && styles.completedText
                                ]}>
                                    {item.title}
                                </Text>
                                <Text style={styles.milestoneStatus}>
                                    {item.status === 'completed' ? 'Reached' : 'Next Stop'}
                                </Text>
                            </View>
                        </View>
                    ))}

                    <View style={styles.milestoneRow}>
                        <View style={styles.markerContainer}>
                            <MapPin size={24} color={Theme.colors.secondary} />
                        </View>
                        <Text style={styles.finishText}>Finish Line</Text>
                    </View>
                </View>

                <MyButton
                    title="Add Milestone"
                    type="secondary"
                    style={{ marginTop: Theme.spacing.xl }}
                />

                <View style={{ height: 40 }} />
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
    editText: {
        fontSize: 16,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
    },
    content: {
        padding: Theme.spacing.lg,
    },
    title: {
        fontSize: 24,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginBottom: Theme.spacing.xl,
    },
    timeline: {
        position: 'relative',
        paddingLeft: 12,
    },
    line: {
        position: 'absolute',
        left: 23,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: Theme.colors.border,
        zIndex: -1,
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    markerContainer: {
        backgroundColor: Theme.colors.background,
        paddingVertical: 4,
        marginRight: 16,
    },
    milestoneCard: {
        flex: 1,
        backgroundColor: Theme.colors.surface,
        padding: 16,
        borderRadius: Theme.radius,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    milestoneTitle: {
        fontSize: 16,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
        marginBottom: 4,
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: Theme.colors.textSecondary,
    },
    milestoneStatus: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
    },
    finishText: {
        marginTop: 8,
        fontSize: 16,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain
    }
});
