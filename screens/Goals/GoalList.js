import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { Plus, Target, ChevronRight } from 'lucide-react-native';

const MOCK_GOALS = [
    { id: '1', title: 'Run a Marathon', progress: 0.6, deadline: 'Dec 2026' },
    { id: '2', title: 'Learn Spanish', progress: 0.2, deadline: 'June 2026' },
    { id: '3', title: 'Save $10k', progress: 0.85, deadline: 'Aug 2026' },
];

export default function GoalList({ navigation }) {
    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('GoalDetails', { goalId: item.id })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Target size={20} color={Theme.colors.primary} />
                </View>
                <ChevronRight size={20} color={Theme.colors.textSecondary} />
            </View>

            <Text style={styles.goalTitle}>{item.title}</Text>
            <Text style={styles.deadline}>By {item.deadline}</Text>

            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${item.progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(item.progress * 100)}% Complete</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Goals</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('GoalForm')}
                >
                    <Plus size={24} color={Theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={MOCK_GOALS}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
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
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
    },
    listContent: {
        padding: Theme.spacing.lg,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        padding: 20,
        borderRadius: Theme.radius,
        marginBottom: Theme.spacing.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    iconContainer: {
        backgroundColor: '#EEF2FF',
        padding: 8,
        borderRadius: 8,
    },
    goalTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
        marginBottom: 4,
    },
    deadline: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginBottom: 16,
    },
    progressContainer: {
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: Theme.colors.success,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        textAlign: 'right'
    }
});
