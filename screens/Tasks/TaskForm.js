import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton, MyInput, MyCheckbox } from '../../components/components';
import { ArrowLeft, Calendar } from 'lucide-react-native';

export default function TaskForm({ navigation, route }) {
    const isEditing = !!route.params?.taskId;

    const [title, setTitle] = useState(isEditing ? 'Complete Project Proposal' : '');
    const [desc, setDesc] = useState(isEditing ? 'Draft the initial proposal...' : '');
    const [dueDate, setDueDate] = useState(isEditing ? '2025-10-25' : '');
    const [isHighPriority, setIsHighPriority] = useState(false);

    const handleSave = () => {
        if (!title) {
            Alert.alert('Missing Info', 'Please add a task title.');
            return;
        }
        // Logic to save would go here
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isEditing ? 'Edit Task' : 'New Task'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <MyInput
                    label="Task Title"
                    placeholder="What needs to be done?"
                    value={title}
                    onChangeText={setTitle}
                />

                <MyInput
                    label="Description"
                    placeholder="Add details, links, or notes..."
                    value={desc}
                    onChangeText={setDesc}
                    multiline
                    numberOfLines={4}
                    style={{ height: 100, textAlignVertical: 'top' }}
                />

                <MyInput
                    label="Due Date"
                    placeholder="YYYY-MM-DD"
                    value={dueDate}
                    onChangeText={setDueDate}
                    icon={Calendar}
                />

                <View style={{ marginVertical: Theme.spacing.md }}>
                    <MyCheckbox
                        label="High Priority"
                        checked={isHighPriority}
                        onPress={() => setIsHighPriority(!isHighPriority)}
                    />
                </View>

                <MyButton
                    title={isEditing ? "Save Changes" : "Create Task"}
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
