import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton, MyInput, MyCheckbox, MyDatePicker } from '../../components/components';

import { ArrowLeft, Calendar } from 'lucide-react-native';
import { useNotifications } from '../../context/NotificationContext';

export default function GoalForm({ navigation, route }) {
    const isEditing = !!route.params?.goalId;

    const [title, setTitle] = useState(isEditing ? 'Run a Marathon' : '');
    const [motivation, setMotivation] = useState(isEditing ? 'To prove to myself I can do it.' : '');
    const [deadline, setDeadline] = useState(isEditing ? '2026-12-31' : '');

    const { showNotification } = useNotifications();

    const handleSave = () => {
        if (!title.trim()) {
            showNotification('warning', "Please add a goal title 🎯");
            return;
        }
        // Logic to save would go here

        showNotification('success', "Goal saved! Let's do this 🚀", 1);
        navigation.goBack();
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
                    numberOfLines={3}
                    style={{ height: 80, textAlignVertical: 'top' }}
                />

                <MyDatePicker
                    label="Target Deadline"
                    value={deadline}
                    onChange={setDeadline}
                    icon={Calendar}
                />

                <MyButton
                    title={isEditing ? "Save Changes" : "Start Journey"}
                    onPress={handleSave}
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
});
