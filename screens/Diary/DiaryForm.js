import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton, MyInput } from '../../components/components';
import { ArrowLeft, Smile, Meh, Frown } from 'lucide-react-native';

export default function DiaryForm({ navigation }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mood, setMood] = useState('good'); // good, neutral, bad

    const handleSave = () => {
        if (!title || !content) {
            Alert.alert('Missing content', 'Please write something before saving.');
            return;
        }
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Entry</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

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

                <MyInput
                    label="Dear Diary..."
                    placeholder="What's on your mind?"
                    value={content}
                    onChangeText={setContent}
                    multiline
                    numberOfLines={10}
                    style={styles.textArea}
                />

                <MyButton
                    title="Save Entry"
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
    textArea: {
        height: 200,
        textAlignVertical: 'top',
    },
});
