import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Theme } from '../components';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export function TaskStepCard({ task, onToggle, onPress }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const PRIORITY_COLORS = {
        High: colors.primary,
        Normal: colors.textSecondary,
        Low: '#94A3B8',
    };

    const isCompleted = task.status === 'completed';
    const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Normal;

    return (
        <MotiView
            from={{ opacity: 0, translateX: -8 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 350 }}
            style={[
                styles.card, 
                { backgroundColor: colors.surface, borderColor: colors.border },
                task.priority === 'High' && !isCompleted && { 
                    borderColor: colors.primary, 
                    borderWidth: 1.5,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 5
                }
            ]}
        >
            <TouchableOpacity style={styles.checkBtn} onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                {isCompleted ? (
                    <CheckCircle2 size={24} color={colors.success} />
                ) : (
                    <Circle size={24} color={priorityColor} />
                )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.content} onPress={onPress} activeOpacity={0.7}>
                <Text style={[styles.title, { color: colors.textMain }, isCompleted && { textDecorationLine: 'line-through', color: colors.textSecondary }]} numberOfLines={2}>
                    {task.title}
                </Text>
                <View style={styles.meta}>
                    {task.priority && (
                        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '18' }]}>
                            <Text style={[styles.priorityText, { color: priorityColor }]}>
                                {task.priority === 'High' ? t('focus') : t('normal')}
                            </Text>
                        </View>
                    )}
                    {task.due && (
                        <Text style={[styles.due, { color: colors.textSecondary }]}>{task.due}</Text>
                    )}
                </View>
            </TouchableOpacity>
        </MotiView>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.surface,
        padding: 16,
        borderRadius: Theme.radii.lg,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    checkBtn: {
        marginRight: 14,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
        marginBottom: 6,
    },
    titleDone: {
        textDecorationLine: 'line-through',
        color: Theme.colors.textSecondary,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 11,
        fontFamily: Theme.typography.subHeader,
    },
    due: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
    },
});
