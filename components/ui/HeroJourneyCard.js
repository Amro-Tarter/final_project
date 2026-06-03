import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { MapPin, ChevronRight } from 'lucide-react-native';
import { Theme } from '../components';
import { ProgressBar } from './ProgressRing';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export function HeroJourneyCard({
    greeting,
    destination,
    progress = 0,
    pitStop,
    nextStep,
    onContinue,
    empty = false,
    onSetDestination,
}) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();

    if (empty) {
        return (
            <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 600 }}
                style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
                <MapPin size={28} color={colors.primary} />
                <Text style={[styles.emptyTitle, { color: colors.textMain }]}>{t('noGoalSet')}</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t('chooseGoal')}</Text>
                <TouchableOpacity style={styles.emptyBtnWrapper} onPress={onSetDestination}>
                    <LinearGradient
                        colors={Theme.gradients.hero}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.emptyBtnGradient}
                    >
                        <Text style={styles.emptyBtnText}>{t('setGoal')}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </MotiView>
        );
    }

    const pct = Math.round((progress || 0) * 100);

    return (
        <TouchableOpacity onPress={onContinue} activeOpacity={0.95}>
            <MotiView
                from={{ opacity: 0, translateY: 24 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 650 }}
                style={styles.shadowWrap}
            >
                <LinearGradient
                    colors={['#4F46E5', '#6366F1', '#818CF8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.card}
                >
                    <Text style={styles.greeting}>{greeting}</Text>

                    <Text style={styles.destLabel}>{t('goalLabel')}</Text>
                    <Text style={styles.destination} numberOfLines={2}>{destination}</Text>

                    <View style={styles.progressSection}>
                        <Text style={styles.progressLabel}>{pct}% {t('completeLabel')}</Text>
                        <ProgressBar progress={pct} height={6} color="rgba(255,255,255,0.9)" />
                    </View>

                    {pitStop && (
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>{t('currentTask')}</Text>
                            <Text style={styles.rowValue} numberOfLines={1}>{pitStop}</Text>
                        </View>
                    )}

                    {nextStep && (
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>{t('nextTaskHero')}</Text>
                            <Text style={styles.rowValue} numberOfLines={1}>{nextStep}</Text>
                        </View>
                    )}

                    <View style={styles.continueRow}>
                        <Text style={styles.continueText}>{t('continueJourney')}</Text>
                        <ChevronRight size={20} color="#fff" />
                    </View>
                </LinearGradient>
            </MotiView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    shadowWrap: {
        marginBottom: 20,
        borderRadius: Theme.radii.lg,
        ...Theme.shadows.hero,
    },
    card: {
        borderRadius: Theme.radii.lg,
        padding: 24,
        overflow: 'hidden',
    },
    greeting: {
        fontSize: 15,
        fontFamily: Theme.typography.body,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 16,
    },
    destLabel: {
        fontSize: 11,
        fontFamily: Theme.typography.subHeader,
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    destination: {
        fontSize: 22,
        fontFamily: Theme.typography.header,
        color: '#fff',
        marginBottom: 20,
        lineHeight: 28,
    },
    progressSection: {
        marginBottom: 16,
    },
    progressLabel: {
        fontSize: 13,
        fontFamily: Theme.typography.subHeader,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 8,
    },
    row: {
        marginBottom: 10,
    },
    rowLabel: {
        fontSize: 11,
        fontFamily: Theme.typography.body,
        color: 'rgba(255,255,255,0.65)',
        marginBottom: 2,
    },
    rowValue: {
        fontSize: 15,
        fontFamily: Theme.typography.subHeader,
        color: '#fff',
    },
    continueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    continueText: {
        fontSize: 15,
        fontFamily: Theme.typography.subHeader,
        color: '#fff',
        marginRight: 4,
    },
    emptyCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 32,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        borderStyle: 'dashed',
        ...Theme.shadows.float,
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginTop: 12,
    },
    emptySub: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginTop: 6,
        textAlign: 'center',
    },
    emptyBtnWrapper: {
        marginTop: 20,
        borderRadius: Theme.radii.lg,
        ...Theme.shadows.glow,
    },
    emptyBtnGradient: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: Theme.radii.lg,
    },
    emptyBtnText: {
        color: '#fff',
        fontFamily: Theme.typography.subHeader,
        fontSize: 15,
    },
});
