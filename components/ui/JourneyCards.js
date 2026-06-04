import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, MapPin } from 'lucide-react-native';
import { Theme, MyButton } from '../components';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export function CelebrationModal({ visible, title, message, onClose }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
                <MotiView
                    from={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 14 }}
                    style={[styles.card, { backgroundColor: colors.surface }]}
                >
                    <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                        <Sparkles size={36} color={colors.primary} />
                    </View>
                    <Text style={[styles.badge, { color: colors.primary }]}>{t('journeyCompleted')}</Text>
                    <Text style={[styles.title, { color: colors.textMain }]}>{title}</Text>
                    <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
                    <MyButton title={t('continueJourney')} onPress={onClose} style={{ marginTop: 8 }} />
                </MotiView>
            </View>
        </Modal>
    );
}

export function GoalCard({ goal, currentTask, remainingTasks, habitCount, onPress }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const pct = Math.round((goal.progress || 0) * 100);

    return (
        <TouchableOpacity style={[styles.destCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.92}>
            <View style={styles.destHeader}>
                <Text style={[styles.destName, { color: colors.textMain }]} numberOfLines={2}>
                    {goal.emoji ? `${goal.emoji} ` : ''}{goal.title}
                </Text>
                <Text style={[styles.destPct, { color: colors.primary }]}>{pct}%</Text>
            </View>
            {goal.deadline && (
                <Text style={[styles.destDate, { color: colors.textSecondary }]}>{t('target')}: {goal.deadline}</Text>
            )}
            {currentTask && (
                <Text style={[styles.destPitStop, { color: colors.textMain }]} numberOfLines={1}>
                    {t('currentTask')}: {currentTask}
                </Text>
            )}
            <Text style={[styles.destRemaining, { color: colors.textSecondary }]}>
                {remainingTasks > 0 ? `${remainingTasks} ${t('tasksRemaining')}` : ''}{remainingTasks > 0 && habitCount > 0 ? ' · ' : ''}{habitCount > 0 ? `${habitCount} ${t('habitsTab') || 'Habits'}` : ''}
                {remainingTasks === 0 && habitCount === 0 ? t('noItemsYet') || 'No tasks or habits yet' : ''}
            </Text>
            <View style={[styles.destProgressTrack, { backgroundColor: colors.border }]}>
                <LinearGradient
                    colors={Theme.gradients.hero}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.destProgressFill, { width: `${pct}%` }]}
                />
            </View>
            <Text style={[styles.destCta, { color: colors.primary }]}>{t('openJourney')} →</Text>
        </TouchableOpacity>
    );
}

export function InsightCard({ title, desc, type = 'info' }) {
    const { colors: appColors } = useAppTheme();
    const colors = {
        positive: '#F59E0B',
        warning: appColors.error,
        info: appColors.success,
    };
    const color = colors[type] || colors.info;

    return (
        <View style={[styles.insightCard, { backgroundColor: appColors.surface, borderColor: appColors.border }]}>
            <View style={[styles.insightDot, { backgroundColor: color + '25' }]}>
                <View style={[styles.insightDotInner, { backgroundColor: color }]} />
            </View>
            <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: appColors.textMain }]}>{title}</Text>
                <Text style={[styles.insightDesc, { color: appColors.textSecondary }]}>{desc}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: Theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.xl,
        padding: 32,
        alignItems: 'center',
        ...Theme.shadows.hero,
    },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    badge: {
        fontSize: 12,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    destCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 22,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
    },
    destHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    destName: {
        flex: 1,
        fontSize: 20,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginRight: 12,
    },
    destPct: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
        color: Theme.colors.primary,
    },
    destDate: {
        fontSize: 13,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginBottom: 8,
    },
    destPitStop: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
        marginBottom: 4,
    },
    destRemaining: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginBottom: 12,
    },
    destProgressTrack: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 14,
    },
    destProgressFill: {
        height: '100%',
        borderRadius: 3,
    },
    destCta: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
    },
    insightCard: {
        flexDirection: 'row',
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    insightDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    insightDotInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    insightContent: {
        flex: 1,
    },
    insightTitle: {
        fontSize: 15,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
        marginBottom: 4,
    },
    insightDesc: {
        fontSize: 13,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        lineHeight: 19,
    },
});
