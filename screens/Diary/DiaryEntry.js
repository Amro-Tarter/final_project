import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton } from '../../components/components';
import { ArrowLeft, Smile, MoreHorizontal } from 'lucide-react-native';

export default function DiaryEntry({ navigation, route }) {
    // Mock data
    const entry = { date: 'Oct 25, 2025', title: 'Great start to the week', content: 'Felt really energetic today. I managed to finish the proposal and even had time for a quick run...', mood: 'good' };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <MoreHorizontal size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.moodBadge}>
                    <Smile size={20} color={Theme.colors.success} />
                    <Text style={styles.moodText}>Feeling Good</Text>
                </View>

                <Text style={styles.date}>{entry.date}</Text>
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
