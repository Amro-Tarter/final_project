import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../components';
import { BookHeart } from 'lucide-react-native';

export function ReflectionPromptCard({ prompt, onPress }) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            <View style={styles.iconWrap}>
                <BookHeart size={20} color={Theme.colors.secondary} />
            </View>
            <View style={styles.content}>
                <Text style={styles.label}>Reflection</Text>
                <Text style={styles.prompt}>{prompt}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 18,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
        marginBottom: 24,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F5F3FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    content: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    prompt: {
        fontSize: 15,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
        lineHeight: 21,
    },
});
