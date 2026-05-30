import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { Plus, BookOpen } from 'lucide-react-native';
import { useDiary } from '../../hooks/useDiary';
import { EmptyState } from '../../components/ui/EmptyState';
import { JourneyCopy } from '../../constants/JourneyCopy';
import { getMoodEmoji } from '../../utils/journeyHelpers';

export default function DiaryTimeline({ navigation, embedded = false }) {
    const { entries, loading } = useDiary();

    const renderItem = ({ item }) => {
        const wordCount = (item.content || '').split(/\s+/).filter(Boolean).length;
        const dateStr = item.createdAt?.toDate
            ? item.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Just now';

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('DiaryEntry', { entryId: item.id })}
                activeOpacity={0.85}
            >
                <View style={styles.cardTop}>
                    <Text style={styles.emoji}>{getMoodEmoji(item.mood)}</Text>
                    <View style={styles.cardMeta}>
                        <Text style={styles.date}>{dateStr}</Text>
                        <Text style={styles.length}>{wordCount} words</Text>
                    </View>
                </View>
                <Text style={styles.title}>{item.title || 'Reflection'}</Text>
                <Text style={styles.preview} numberOfLines={3}>{item.content}</Text>
            </TouchableOpacity>
        );
    };

    const listHeader = embedded ? null : (
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>Travel Log</Text>
                <Text style={styles.headerSub}>Your reflections along the way</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('DiaryForm')}>
                <Plus size={24} color={Theme.colors.primary} />
            </TouchableOpacity>
        </View>
    );

    if (loading && entries.length === 0) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
            </View>
        );
    }

    const content = (
        <FlatList
            data={entries}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
                <EmptyState
                    title={JourneyCopy.empty.diary.title}
                    subtitle={JourneyCopy.empty.diary.subtitle}
                    cta={JourneyCopy.empty.diary.cta}
                    onPress={() => navigation.navigate('DiaryForm')}
                    icon={BookOpen}
                />
            }
        />
    );

    if (embedded) {
        return content;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {content}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: Theme.spacing.lg,
        paddingBottom: Theme.spacing.md,
    },
    headerTitle: {
        fontSize: 26,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
    },
    headerSub: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginTop: 4,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: Theme.spacing.lg,
        flexGrow: 1,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        padding: 20,
        borderRadius: Theme.radii.lg,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
    },
    cardTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    emoji: {
        fontSize: 28,
        marginRight: 12,
    },
    cardMeta: {
        flex: 1,
    },
    date: {
        fontSize: 12,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    length: {
        fontSize: 11,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginTop: 2,
    },
    title: {
        fontSize: 17,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
        marginBottom: 8,
    },
    preview: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        lineHeight: 21,
    },
});
