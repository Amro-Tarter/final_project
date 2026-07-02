import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme, NovaButton, MyButton, MyInput } from '../../components/components';
import { MotiView } from 'moti';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import { useNotifications } from '../../context/NotificationContext';
import { useDiary } from '../../hooks/useDiary';
import { getMoodEmoji } from '../../utils/journeyHelpers';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const DiaryInput = ({ label, placeholder, value, onChangeText }) => {
    const { colors } = useAppTheme();
    return (
        <View style={styles.inputWrapper}>
            {label && <Text style={[styles.inputLabel, { color: colors.textMain }]}>{label}</Text>}
            <View style={[styles.diaryInputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                    style={[styles.diaryInput, { color: colors.textMain }]}
                    placeholder={placeholder}
                    placeholderTextColor={Theme.colors.placeholder}
                    selectionColor={colors.primary}
                    value={value}
                    onChangeText={onChangeText}
                    multiline
                    textAlignVertical="top"
                />
            </View>
        </View>
    );
};


export default function DiaryForm({ navigation, route }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const entryToEdit = route?.params?.entryToEdit;

    const [title, setTitle] = useState(entryToEdit ? entryToEdit.title : '');
    const [content, setContent] = useState(entryToEdit ? entryToEdit.content : '');
    const [mood, setMood] = useState(entryToEdit ? entryToEdit.mood : 'okay');
    const [submitting, setSubmitting] = useState(false);

    const { showNotification } = useNotifications();
    const { addEntry, updateEntry } = useDiary();

    const handleSave = async () => {
        if (!title.trim()) {
            showNotification('warning', t('diaryTitleRequired'));
            return;
        }
        if (!content.trim()) {
            showNotification('warning', t('diaryContentRequired'));
            return;
        }

        const entryDate = route.params?.prefilledDate ? new Date(route.params.prefilledDate) : new Date();
        const today = new Date();
        // Normalize dates to compare only day, month, year
        const entryDateNormalized = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
        const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        if (entryDateNormalized > todayNormalized) {
            showNotification('error', t('diaryPastDateRequired'));
            return;
        }

        setSubmitting(true);
        try {
            if (entryToEdit) {
                await updateEntry(entryToEdit.id, { title, content, mood });
                showNotification('success', t('diaryUpdated'), 1);
            } else {
                const newEntry = { title, content, mood };
                if (route?.params?.prefilledDate) {
                    newEntry.date = route.params.prefilledDate;
                }
                await addEntry(newEntry);
                showNotification('success', t('diarySaved'), 1);
            }
            navigation.goBack();
        } catch (error) {
            showNotification('error', t('diarySaveError'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleNovaDiary = () => {

        const intentText =
            title?.trim()
                ? `I want help writing a diary entry called "${title}".`
                : `I want help writing a diary entry.`;

        const hiddenContext =
            "The user is starting a brand-new diary session. DO NOT save anything yet. Help them reflect naturally. Ask thoughtful questions about their day, emotions and experiences. Only create a diary entry after the user explicitly agrees.";

        navigation.navigate('AIChat', {
            freshChat: true,
            planningType: 'diary',

        });
    };
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textMain }]}>{entryToEdit ? t('editDiary') : t('newDiary')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500 }}
                >
                    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>


                    <Text style={[styles.label, { color: colors.textMain }]}>{t('howFeeling')}</Text>
                    <View style={styles.moodSelector}>
                        {[
                            { value: 'excellent', label: t('moodExcellent') },
                            { value: 'good', label: t('moodGood') },
                            { value: 'okay', label: t('moodOkay') },
                            { value: 'difficult', label: t('moodDifficult') },
                            { value: 'overwhelmed', label: t('moodHeavy') }
                        ].map((m) => (
                            <TouchableOpacity
                                key={m.value}
                                onPress={() => setMood(m.value)}
                                style={mood === m.value ? [styles.moodBtnWrapper, { shadowColor: colors.primary, elevation: 8 }] : [styles.moodBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                activeOpacity={0.9}
                            >
                                {mood === m.value ? (
                                    <LinearGradient
                                        colors={Theme.gradients.hero}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.moodBtnGradient}
                                    >
                                        <Text style={styles.emojiText}>{getMoodEmoji(m.value)}</Text>
                                        <Text style={[styles.moodText, styles.moodTextActive]}>
                                            {m.label}
                                        </Text>
                                    </LinearGradient>
                                ) : (
                                    <>
                                        <Text style={styles.emojiText}>{getMoodEmoji(m.value)}</Text>
                                        <Text style={[styles.moodText, { color: colors.textSecondary }]}>
                                            {m.label}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <MyInput
                        label={t('titleYourDay')}
                        placeholder={t('titleYourDay')}
                        value={title}
                        onChangeText={setTitle}
                    />

                    <DiaryInput
                        label={t('diary')}
                        placeholder={t('whatsOnMind')}
                        value={content}
                        onChangeText={setContent}
                    />
                    </View>
                </MotiView>

                <View style={{ flex: 2 }} />

                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 100 }}
                >
                    <MyButton
                        title={submitting ? "..." : t('saveDiary')}
                        onPress={handleSave}
                        disabled={submitting}
                        style={{ marginTop: 40, marginBottom: 40 }}
                    />
                </MotiView>
                </ScrollView>
            </KeyboardAvoidingView>
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
    card: {
        padding: 24,
        borderRadius: Theme.radii.lg,
        borderWidth: 1,
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
        paddingBottom: 4, // for shadow
    },
    moodBtn: {
        width: '18%',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 0,
        borderRadius: Theme.radius,
        backgroundColor: Theme.colors.surface,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    moodBtnWrapper: {
        width: '18%',
        borderRadius: Theme.radius,
        borderWidth: 1,
        borderColor: 'transparent',
        backgroundColor: Theme.colors.surface,
        ...Theme.shadows.glow,
    },
    moodBtnGradient: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 0,
        borderRadius: Theme.radius,
        justifyContent: 'center',
    },
    emojiText: {
        fontSize: 28,
        marginBottom: 4,
    },
    moodText: {
        fontSize: 10,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        textAlign: 'center',
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
