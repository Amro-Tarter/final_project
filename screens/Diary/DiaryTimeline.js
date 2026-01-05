import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { Plus, Smile, Meh, Frown } from 'lucide-react-native';

const MOCK_ENTRIES = [
    { id: '1', title: 'Great start to the week', date: 'Oct 25, 2025', mood: 'good', preview: 'Felt really energetic today...' },
    { id: '2', title: 'Feeling a bit stuck', date: 'Oct 24, 2025', mood: 'bad', preview: 'Had trouble focusing on the report...' },
    { id: '3', title: 'Neutral day', date: 'Oct 23, 2025', mood: 'neutral', preview: 'Nothing special happened.' },
];

export default function DiaryTimeline({ navigation }) {
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
                <Text style={styles.date}>{item.date}</Text>
                {getMoodIcon(item.mood)}
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.preview} numberOfLines={2}>{item.preview}</Text>
        </TouchableOpacity>
    );

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

            <FlatList
                data={MOCK_ENTRIES}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
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
