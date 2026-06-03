import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, NovaButton, MyButton, MyInput, MyCheckbox, MyDatePicker } from '../../components/components';
import { MotiView } from 'moti';
import { ArrowLeft, Calendar, Sparkles } from 'lucide-react-native';
import { useNotifications } from '../../context/NotificationContext';
import { useGoals } from '../../hooks/useGoals';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function GoalForm({ navigation, route }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
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
            showNotification('warning', t('goalNameRequired'));
            return;
        }

        if (!deadline) {
            showNotification('warning', t('goalDateRequired'));
            return;
        }

        if (deadline) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(deadline);
            if (selectedDate < today) {
                showNotification('error', t('goalFutureDateRequired'));
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
                showNotification('success', t('goalUpdated'), 1);
            } else {
                const newGoal = await addGoal(goalData);
                showNotification('success', t('goalSaved'), 1);
                navigation.navigate('GoalDetails', {
                    goalId: newGoal.id,
                });

            }

        } catch (error) {
            showNotification('error', t('goalSaveError'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleNovaRoadmap = () => {

        const intentText =
            title?.trim()
                ? `I want help planning a roadmap for a goal called "${title}".`
                : `I want help planning a new goal and roadmap.`;

        const hiddenContext =
            "The user is starting a brand-new goal planning session. Ignore previous goal conversations. DO NOT create any roadmap or goal yet. Help them clarify what they want to achieve, why it matters, obstacles, timeline and milestones. Ask thoughtful planning questions. Only use create_goal or create_roadmap after the user explicitly agrees.";

        navigation.navigate('AIChat', {
            freshChat: true,
            planningType: 'roadmap',

        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textMain }]}>
                    {isEditing ? t('editGoal') : t('addGoal')}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500 }}
                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                    {!isEditing && (
                        <NovaButton
                            title={t('planWithNova')}
                            onPress={handleNovaRoadmap}
                        />
                    )}
                    <MyInput
                        label={t('goalTitle')}
                        placeholder={t('goalTitlePlaceholder')}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <MyInput
                        label={t('whyImportant')}
                        placeholder={t('motivation')}
                        value={motivation}
                        onChangeText={setMotivation}
                        multiline
                        numberOfLines={4}
                    />

                    <MyDatePicker
                        label={t('deadline')}
                        value={deadline}
                        onChange={setDeadline}
                        icon={Calendar}
                        minimumDate={new Date()}
                    />
                </MotiView>

                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 100 }}
                >
                    <MyButton
                        title={submitting ? "..." : t('saveGoal')}
                        onPress={handleSave}
                        disabled={submitting}
                        style={{ marginTop: Theme.spacing.xl }}
                    />
                </MotiView>
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
    card: {
        backgroundColor: Theme.colors.surface,
        padding: 24,
        borderRadius: Theme.radii.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
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
