import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton } from '../../components/components';
import { ArrowLeft, Calendar, Flag, Clock } from 'lucide-react-native';

export default function TaskDetails({ navigation, route }) {
    // Mock data - normally would fetch by ID
    const item = {
        id: route.params?.taskId || '1',
        title: 'Complete Project Proposal',
        desc: 'Draft the initial proposal for the client meeting including timeline and budget estimates.',
        due: 'Today, 5:00 PM',
        priority: 'High',
        status: 'pending'
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Task Details</Text>
                <TouchableOpacity onPress={() => navigation.navigate('TaskForm', { taskId: item.id })}>
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{item.title}</Text>

                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>

                <Text style={styles.sectionLabel}>Description</Text>
                <Text style={styles.description}>{item.desc}</Text>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Calendar size={20} color={Theme.colors.primary} />
                    <View style={styles.rowText}>
                        <Text style={styles.label}>Due Date</Text>
                        <Text style={styles.value}>{item.due}</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <Flag size={20} color={Theme.colors.error} />
                    <View style={styles.rowText}>
                        <Text style={styles.label}>Priority</Text>
                        <Text style={styles.value}>{item.priority}</Text>
                    </View>
                </View>

                <View style={{ flex: 1 }} />

                <MyButton
                    title="Mark as Completed"
                    style={{ marginTop: Theme.spacing.xl }}
                />

                <MyButton
                    title="Delete Task"
                    type="secondary"
                    style={{ marginTop: Theme.spacing.md, borderColor: Theme.colors.error }}
                    textStyle={{ color: Theme.colors.error }}
                />
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
        flexGrow: 1,
    },
    title: {
        fontSize: 24,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 8,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: Theme.spacing.xl,
    },
    statusText: {
        color: Theme.colors.primary,
        fontSize: 12,
        fontFamily: Theme.typography.subHeader,
        letterSpacing: 1,
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textSecondary,
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
        lineHeight: 24,
        marginBottom: Theme.spacing.lg,
    },
    divider: {
        height: 1,
        backgroundColor: Theme.colors.border,
        marginVertical: Theme.spacing.lg,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Theme.spacing.lg,
    },
    rowText: {
        marginLeft: 16,
    },
    label: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
        fontFamily: Theme.typography.body,
    },
    value: {
        fontSize: 16,
        color: Theme.colors.textMain,
        fontFamily: Theme.typography.subHeader,
    },
});
