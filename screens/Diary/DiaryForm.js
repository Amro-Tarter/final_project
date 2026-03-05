import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton, MyInput } from '../../components/components';
import { ArrowLeft, Smile, Meh, Frown } from 'lucide-react-native';
import { useNotifications } from '../../context/NotificationContext';
import { useDiary } from '../../hooks/useDiary';

const DiaryInput = ({ label, placeholder, value, onChangeText }) => (
    <View style={styles.inputWrapper}>
        {label && <Text style={styles.inputLabel}>{label}</Text>}
        <View style={styles.diaryInputContainer}>
            <TextInput
                style={styles.diaryInput}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                selectionColor={Theme.colors.primary}
                value={value}
                onChangeText={onChangeText}
                multiline
                textAlignVertical="top"
            />
        </View>
    </View>
);

export default function DiaryForm({ navigation, route }) {
    const entryToEdit = route?.params?.entryToEdit;

    const [title, setTitle] = useState(entryToEdit ? entryToEdit.title : '');
    const [content, setContent] = useState(entryToEdit ? entryToEdit.content : '');
    const [mood, setMood] = useState(entryToEdit ? entryToEdit.mood : 'good'); // good, neutral, bad
    const [submitting, setSubmitting] = useState(false);

    const { showNotification } = useNotifications();
    const { addEntry, updateEntry } = useDiary();

    const handleSave = async () => {
        if (!title.trim()) {
            showNotification('warning', "Please add a title to your entry 📝");
            return;
        }
        if (!content.trim()) {
            showNotification('warning', "Your thoughts are valuable! 💭 Please write something before saving.");
            return;
        }

        const entryDate = route.params?.prefilledDate ? new Date(route.params.prefilledDate) : new Date();
        const today = new Date();
        // Normalize dates to compare only day, month, year
        const entryDateNormalized = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
        const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (entryDateNormalized > todayNormalized) {
            showNotification('error', "The future hasn't happened yet! 🕊️ Please wait for today to pass before writing this entry.");
            return;
        }

        setSubmitting(true);
        try {
            if (entryToEdit) {
                await updateEntry(entryToEdit.id, { title, content, mood });
                showNotification('success', "Entry updated 📔", 1);
            } else {
                const newEntry = { title, content, mood };
                if (route?.params?.prefilledDate) {
                    newEntry.date = route.params.prefilledDate;
                }
                await addEntry(newEntry);
                showNotification('success', "Entry saved to your diary 📔", 1);
            }
            navigation.goBack();
        } catch (error) {
            showNotification('error', "Could not save entry. Please try again.");
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
                <Text style={styles.headerTitle}>{entryToEdit ? 'Edit Entry' : 'New Entry'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}>

                <Text style={styles.label}>How are you feeling?</Text>
                <View style={styles.moodSelector}>
                    {['good', 'neutral', 'bad'].map((m) => (
                        <TouchableOpacity
                            key={m}
                            onPress={() => setMood(m)}
                            style={[
                                styles.moodBtn,
                                mood === m && styles.moodBtnActive
                            ]}
                        >
                            {m === 'good' && <Smile size={32} color={mood === m ? '#fff' : Theme.colors.success} />}
                            {m === 'neutral' && <Meh size={32} color={mood === m ? '#fff' : Theme.colors.textSecondary} />}
                            {m === 'bad' && <Frown size={32} color={mood === m ? '#fff' : Theme.colors.error} />}
                            <Text style={[styles.moodText, mood === m && styles.moodTextActive]}>
                                {m.charAt(0).toUpperCase() + m.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <MyInput
                    label="Title"
                    placeholder="Title your day..."
                    value={title}
                    onChangeText={setTitle}
                />

                <DiaryInput
                    label="Dear Diary..."
                    placeholder="What's on your mind?"
                    value={content}
                    onChangeText={setContent}
                />

                <View style={{ flex: 2 }} />

                <MyButton
                    title={submitting ? "Saving..." : "Save Entry"}
                    onPress={handleSave}
                    disabled={submitting}
                    style={{ marginTop: 40, marginBottom: 40 }}
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
        flexGrow: 1,
    },
    label: {
        fontSize: 16,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
        marginBottom: 16,
    },
    moodSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    moodBtn: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: Theme.radius,
        backgroundColor: Theme.colors.surface,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginHorizontal: 4,
    },
    moodBtnActive: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
    },
    moodText: {
        marginTop: 8,
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
    },
    moodTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    inputWrapper: {
        marginBottom: Theme.spacing.lg,
        width: '100%'
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
        marginBottom: 8,
        marginLeft: 4,
        width: '100%'
    },
    diaryInputContainer: {
        width: '100%',
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        padding: 16,
        elevation: 2,
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    diaryInput: {
        width: '100%',
        height: 120,
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
        lineHeight: 22,
    },
});
