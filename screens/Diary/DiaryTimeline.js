import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { Plus, Smile, Meh, Frown } from 'lucide-react-native';
import { useDiary } from '../../hooks/useDiary';

export default function DiaryTimeline({ navigation }) {
    const { entries, loading } = useDiary();

    const getMoodIcon = (mood) => {
        switch (mood) {
            case 'good': return <Smile size={24} color={Theme.colors.success} />;
            case 'bad': return <Frown size={24} color={Theme.colors.error} />;
            default: return <Meh size={24} color={Theme.colors.textSecondary} />;
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('DiaryEntry', { entryId: item.id })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.date}>
                    {item.createdAt?.toDate ?
                        item.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Just now'}
                </Text>
                {getMoodIcon(item.mood)}
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.preview} numberOfLines={2}>{item.content}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 100 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Diary</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('DiaryForm')}
                >
                    <Plus size={24} color={Theme.colors.primary} />
                </TouchableOpacity>
            </View>

            {entries.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ fontSize: 16, color: Theme.colors.textSecondary, fontFamily: Theme.typography.body, textAlign: 'center' }}>
                        Your diary is empty. Tap the + button to start journaling! 📔
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={entries}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        paddingVertical: Theme.spacing.md,
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
    },
    listContent: {
        padding: Theme.spacing.lg,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        padding: 20,
        borderRadius: Theme.radius,
        marginBottom: Theme.spacing.lg,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    date: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 18,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
        marginBottom: 8,
    },
    preview: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        lineHeight: 20,
    },
});
