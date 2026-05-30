import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { MotiView } from 'moti';
import { Sparkles } from 'lucide-react-native';
import { Theme, MyButton } from '../components';

export function CelebrationModal({ visible, title, message, onClose }) {
    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <MotiView
                    from={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 14 }}
                    style={styles.card}
                >
                    <View style={styles.iconWrap}>
                        <Sparkles size={36} color={Theme.colors.primary} />
                    </View>
                    <Text style={styles.badge}>Journey Completed</Text>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <MyButton title="Continue Journey" onPress={onClose} style={{ marginTop: 8 }} />
                </MotiView>
            </View>
        </Modal>
    );
}

export function DestinationCard({ goal, pitStop, remainingStops, onPress }) {
    const pct = Math.round((goal.progress || 0) * 100);

    return (
        <TouchableOpacity style={styles.destCard} onPress={onPress} activeOpacity={0.92}>
            <View style={styles.destHeader}>
                <Text style={styles.destName} numberOfLines={2}>{goal.title}</Text>
                <Text style={styles.destPct}>{pct}%</Text>
            </View>
            {goal.deadline && (
                <Text style={styles.destDate}>Target: {goal.deadline}</Text>
            )}
            {pitStop && (
                <Text style={styles.destPitStop} numberOfLines={1}>
                    Current Pit Stop: {pitStop}
                </Text>
            )}
            <Text style={styles.destRemaining}>
                {remainingStops} stop{remainingStops !== 1 ? 's' : ''} remaining
            </Text>
            <View style={styles.destProgressTrack}>
                <View style={[styles.destProgressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={styles.destCta}>Open Journey →</Text>
        </TouchableOpacity>
    );
}

export function InsightCard({ title, desc, type = 'info' }) {
    const colors = {
        positive: '#F59E0B',
        warning: Theme.colors.error,
        info: Theme.colors.success,
    };
    const color = colors[type] || colors.info;

    return (
        <View style={styles.insightCard}>
            <View style={[styles.insightDot, { backgroundColor: color + '25' }]}>
                <View style={[styles.insightDotInner, { backgroundColor: color }]} />
            </View>
            <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{title}</Text>
                <Text style={styles.insightDesc}>{desc}</Text>
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
        backgroundColor: Theme.colors.primary,
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
