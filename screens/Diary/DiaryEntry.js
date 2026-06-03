import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton, MyConfirmAlert } from '../../components/components';
import { MotiView } from 'moti';
import { ArrowLeft, Trash2, Edit2 } from 'lucide-react-native';
import { useDiary } from '../../hooks/useDiary';
import { useNotifications } from '../../context/NotificationContext';
import { getMoodEmoji } from '../../utils/journeyHelpers';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function DiaryEntry({ navigation, route }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const { entryId, entry: passedEntry } = route.params;
    const { getEntryById, deleteEntry } = useDiary();
    const { showNotification } = useNotifications();
    const [entry, setEntry] = useState(passedEntry || null);
    const [loading, setLoading] = useState(!passedEntry);
    const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);

    useEffect(() => {
        if (passedEntry) return; // Already have it, no need to fetch

        const fetchEntry = async () => {
            try {
                const data = await getEntryById(entryId);
                setEntry(data);
            } catch (error) {
                showNotification('error', t('failedToLoadReflection'));
            } finally {
                setLoading(false);
            }
        };
        fetchEntry();
    }, [entryId, passedEntry]);

    const handleDelete = () => {
        setDeleteAlertVisible(true);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} />
            </SafeAreaView>
        );
    }

    if (!entry) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={{ textAlign: 'center', marginTop: 100, fontFamily: Theme.typography.body, color: colors.textSecondary }}>{t('reflectionNotFound')}</Text>
                <MyButton title={t('goBack')} onPress={() => navigation.goBack()} style={{ margin: 20 }} />
            </SafeAreaView>
        );
    }

    const getMoodLabel = (mood) => {
        switch (mood) {
            case 'excellent': return t('feelingExcellent');
            case 'good': return t('feelingGood');
            case 'okay': return t('feelingOkay');
            case 'difficult': return t('feelingDifficult');
            case 'overwhelmed': return t('feelingOverwhelmed');
            case 'neutral': return t('feelingNeutral');
            case 'bad': return t('feelingBad');
            default: return t('reflection');
        }
    };
    const moodLabel = getMoodLabel(entry.mood);

    const getMoodColor = (mood) => {
        if (['excellent', 'good'].includes(mood)) return { bg: colors.successLight, text: colors.success };
        if (['difficult', 'bad', 'overwhelmed'].includes(mood)) return { bg: colors.errorLight, text: colors.error };
        return { bg: colors.background, text: colors.textSecondary };
    };
    const moodColor = getMoodColor(entry.mood);

    const isToday = (date) => {
        if (!date) return true; // 'Just now' case
        const today = new Date();
        const entryDate = date.toDate ? date.toDate() : new Date(date);
        return entryDate.getDate() === today.getDate() &&
            entryDate.getMonth() === today.getMonth() &&
            entryDate.getFullYear() === today.getFullYear();
    };

    const canEdit = entry && isToday(entry.createdAt);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textMain} />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {canEdit && (
                        <TouchableOpacity onPress={() => navigation.navigate('DiaryForm', { entryToEdit: entry })} style={{ padding: 8 }}>
                            <Edit2 size={24} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleDelete} style={{ padding: 8, marginRight: -8 }}>
                        <Trash2 size={24} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500 }}
                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                    <View style={[styles.moodBadge, { backgroundColor: moodColor.bg }]}>
                        <Text style={{ fontSize: 20 }}>{getMoodEmoji(entry.mood)}</Text>
                        <Text style={[styles.moodText, { color: moodColor.text }]}>
                            {moodLabel}
                        </Text>
                    </View>

                    <Text style={[styles.date, { color: colors.textSecondary }]}>
                        {entry.createdAt?.toDate ?
                            entry.createdAt.toDate().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                            : 'Just now'}
                    </Text>
                    <Text style={[styles.title, { color: colors.textMain }]}>{entry.title}</Text>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <Text style={[styles.body, { color: colors.textMain }]}>{entry.content}</Text>
                </MotiView>
            </ScrollView>

            <MyConfirmAlert 
                visible={deleteAlertVisible}
                title={t('deleteReflectionTitle')}
                message={t('deleteReflectionConfirm')}
                onConfirm={async () => {
                    setDeleteAlertVisible(false);
                    try {
                        await deleteEntry(entryId);
                        showNotification('success', t('reflectionDeleted'));
                        navigation.goBack();
                    } catch (error) {
                        showNotification('error', t('failedToDelete'));
                    }
                }}
                onCancel={() => setDeleteAlertVisible(false)}
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
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
    divider: {
        height: 1,
        backgroundColor: Theme.colors.border,
        marginVertical: 16,
    },
    moodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.successLight,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    moodText: {
        marginLeft: 8,
        color: Theme.colors.success,
        fontFamily: Theme.typography.subHeader,
        fontSize: 14,
    },
    date: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 28,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 24,
    },
    body: {
        fontSize: 18,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
        lineHeight: 30,
    },
});
