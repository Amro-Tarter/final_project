import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../components';
import { useAppTheme } from '../../context/ThemeContext';

export function SegmentTabs({ tabs, activeTab, onTabChange }) {
    const { colors } = useAppTheme();
    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {tabs.map(tab => {
                const isActive = activeTab === tab;
                return (
                    <TouchableOpacity
                        key={tab}
                        style={isActive ? styles.tabWrapper : styles.tab}
                        onPress={() => onTabChange(tab)}
                        activeOpacity={0.8}
                    >
                        {isActive ? (
                            <LinearGradient
                                colors={Theme.gradients.hero}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.tabActiveGradient}
                            >
                                <Text style={styles.tabTextActive}>{tab}</Text>
                            </LinearGradient>
                        ) : (
                            <Text style={[styles.tabText, { color: colors.textSecondary }]}>{tab}</Text>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

export function SectionHeader({ title, action, onAction }) {
    const { colors } = useAppTheme();
    return (
        <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textMain }]}>{title}</Text>
            {action && (
                <TouchableOpacity onPress={onAction}>
                    <Text style={[styles.action, { color: colors.primary }]}>{action}</Text>
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
    tabWrapper: {
        flex: 1,
        borderRadius: Theme.radii.md,
        ...Theme.shadows.sm,
    },
    tabActiveGradient: {
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: Theme.radii.md,
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
