import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton } from '../../components/components';
import { ArrowLeft, Smile, Meh, Frown, Trash2, Edit2 } from 'lucide-react-native';
import { useDiary } from '../../hooks/useDiary';
import { useNotifications } from '../../context/NotificationContext';

export default function DiaryEntry({ navigation, route }) {
    const { entryId, entry: passedEntry } = route.params;
    const { getEntryById, deleteEntry } = useDiary();
    const { showNotification } = useNotifications();
    const [entry, setEntry] = useState(passedEntry || null);
    const [loading, setLoading] = useState(!passedEntry);

    useEffect(() => {
        if (passedEntry) return; // Already have it, no need to fetch

        const fetchEntry = async () => {
            try {
                const data = await getEntryById(entryId);
                setEntry(data);
            } catch (error) {
                showNotification('error', 'Failed to load entry');
            } finally {
                setLoading(false);
            }
        };
        fetchEntry();
    }, [entryId, passedEntry]);

    const handleDelete = () => {
        Alert.alert(
            "Delete Entry",
            "Are you sure you want to delete this diary entry?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteEntry(entryId);
                            showNotification('success', 'Entry deleted');
                            navigation.goBack();
                        } catch (error) {
                            showNotification('error', 'Failed to delete');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 100 }} />
            </SafeAreaView>
        );
    }

    if (!entry) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{ textAlign: 'center', marginTop: 100, fontFamily: Theme.typography.body, color: Theme.colors.textSecondary }}>Entry not found.</Text>
                <MyButton title="Go Back" onPress={() => navigation.goBack()} style={{ margin: 20 }} />
            </SafeAreaView>
        );
    }

    const moodLabel = entry.mood === 'good' ? 'Feeling Good'
        : entry.mood === 'bad' ? 'Feeling Bad'
            : 'Feeling Neutral';

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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {canEdit && (
                        <TouchableOpacity onPress={() => navigation.navigate('DiaryForm', { entryToEdit: entry })} style={{ padding: 8 }}>
                            <Edit2 size={24} color={Theme.colors.primary} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleDelete} style={{ padding: 8, marginRight: -8 }}>
                        <Trash2 size={24} color={Theme.colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.moodBadge, { backgroundColor: entry.mood === 'bad' ? '#FEF2F2' : entry.mood === 'good' ? '#F0FDF4' : '#F1F5F9' }]}>
                    {entry.mood === 'good' && <Smile size={20} color={Theme.colors.success} />}
                    {entry.mood === 'neutral' && <Meh size={20} color={Theme.colors.textSecondary} />}
                    {entry.mood === 'bad' && <Frown size={20} color={Theme.colors.error} />}

                    <Text style={[styles.moodText, { color: entry.mood === 'bad' ? Theme.colors.error : entry.mood === 'good' ? Theme.colors.success : Theme.colors.textSecondary }]}>
                        {moodLabel}
                    </Text>
                </View>

                <Text style={styles.date}>
                    {entry.createdAt?.toDate ?
                        entry.createdAt.toDate().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                        : 'Just now'}
                </Text>
                <Text style={styles.title}>{entry.title}</Text>
                <Text style={styles.body}>{entry.content}</Text>
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
    content: {
        padding: Theme.spacing.lg,
    },
    moodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4', // Light green
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
