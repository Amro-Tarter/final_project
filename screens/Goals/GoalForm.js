import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton, MyInput, MyCheckbox, MyDatePicker } from '../../components/components';

import { ArrowLeft, Calendar, Sparkles } from 'lucide-react-native';
import { useNotifications } from '../../context/NotificationContext';
import { useGoals } from '../../hooks/useGoals';

export default function GoalForm({ navigation, route }) {
    const goalToEdit = route.params?.goal;
    const isEditing = !!goalToEdit;

    const [title, setTitle] = useState(goalToEdit?.title || '');
    const [motivation, setMotivation] = useState(goalToEdit?.motivation || '');
    const [deadline, setDeadline] = useState(goalToEdit?.deadline || route.params?.prefilledDate || '');

    const [submitting, setSubmitting] = useState(false);

    const { showNotification } = useNotifications();
    const { goals, addGoal, updateGoal } = useGoals();

    const handleSave = async () => {
        if (!title.trim()) {
            showNotification('warning', "Please add a goal title 🎯");
            return;
        }
        
        if (!deadline) {
            showNotification('warning', "Please set a target deadline 🎯");
            return;
        }

        if (deadline) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(deadline);
            if (selectedDate < today) {
                showNotification('error', "Your goals are ahead of you! 🎯 Please pick a current or future deadline.");
                return;
            }
        }

        setSubmitting(true);
        try {
            const goalData = {
                title,
                motivation,
                deadline
            };

            if (isEditing) {
                await updateGoal(goalToEdit.id, goalData);
                showNotification('success', "Goal updated! Keep it up 💪", 1);
            } else {
                const newGoal = await addGoal(goalData);
                showNotification('success', "Goal saved! Let's do this 🚀", 1);
                navigation.navigate('GoalDetails', {
                    goalId: newGoal.id,
                });

            }

        } catch (error) {
            showNotification('error', "Could not save goal. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isEditing ? 'Edit Goal' : 'New Goal'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {!isEditing && (
                    <TouchableOpacity 
                        style={styles.aiButton}
                        onPress={() => {
                            const intentText = `I want to plan a new goal called "${title || 'a new goal'}". Can we discuss it and build a roadmap?`;
                            const hiddenContext = "The user wants to build a new goal roadmap. Ask them a few questions to deeply understand their intent, then use the create_roadmap tool to generate a full roadmap with tasks, recurrences, and reminders.";
                            navigation.navigate('AIChat', { initialIntentText: intentText, hiddenContext: hiddenContext });
                        }}
                    >
                        <Sparkles size={20} color="#fff" />
                        <Text style={styles.aiButtonText}>Plan Roadmap with Nova</Text>
                    </TouchableOpacity>
                )}
                <MyInput
                    label="Goal Title"
                    placeholder="What do you want to achieve?"
                    value={title}
                    onChangeText={setTitle}
                />

                <MyInput
                    label="Why is this important?"
                    placeholder="What drives you? (Motivation)"
                    value={motivation}
                    onChangeText={setMotivation}
                    multiline
                    numberOfLines={4}

                />

                <MyDatePicker
                    label="Target Deadline"
                    value={deadline}
                    onChange={setDeadline}
                    icon={Calendar}
                    minimumDate={new Date()}
                />

                <MyButton
                    title={submitting ? "Saving..." : (isEditing ? "Save Changes" : "Start Journey")}
                    onPress={handleSave}
                    disabled={submitting}
                    style={{ marginTop: Theme.spacing.xl }}
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
    content: {
        padding: Theme.spacing.lg,
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.colors.primary,
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
    },
    aiButtonText: {
        color: '#fff',
        fontFamily: Theme.typography.subHeader,
        fontSize: 16,
    },
});
