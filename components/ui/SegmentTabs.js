import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Theme } from '../components';

export function SegmentTabs({ tabs, activeTab, onTabChange }) {
    return (
        <View style={styles.container}>
            {tabs.map(tab => {
                const isActive = activeTab === tab;
                return (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, isActive && styles.tabActive]}
                        onPress={() => onTabChange(tab)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export function SectionHeader({ title, action, onAction }) {
    return (
        <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {action && (
                <TouchableOpacity onPress={onAction}>
                    <Text style={styles.action}>{action}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 4,
        marginHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: Theme.radii.md,
    },
    tabActive: {
        backgroundColor: Theme.colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textSecondary,
    },
    tabTextActive: {
        color: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    title: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
    },
    action: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
    },
});
