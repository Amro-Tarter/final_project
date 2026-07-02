import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard } from './GlassCard';
import { Theme } from '../components';
import { Sun } from 'lucide-react-native';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export function DailyJourneySnapshot({ destination, nextStep, focusTime, onPress }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    if (!nextStep && !destination) return null;

    return (
        <GlassCard 
            style={[styles.card, { borderColor: colors.border }]} 
            contentStyle={{ flexDirection: 'row' }}
            onPress={onPress} 
            activeOpacity={onPress ? 0.9 : 1}
        >
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                <Sun size={20} color={colors.primary} />
            </View>
            <View style={styles.content}>
                <Text style={[styles.label, { color: colors.primary }]}>{t('todayJourneySnapshot')}</Text>
                {destination && (
                    <Text style={[styles.line, { color: colors.textSecondary }]} numberOfLines={1}>
                        {t('goalPrefix')} <Text style={[styles.bold, { color: colors.textMain }]}>{destination}</Text>
                    </Text>
                )}
                {nextStep && (
                    <Text style={[styles.line, { color: colors.textSecondary }]} numberOfLines={1}>
                        {t('nextTaskPrefix')} <Text style={[styles.bold, { color: colors.textMain }]}>{nextStep}</Text>
                    </Text>
                )}
                {focusTime && (
                    <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('suggestedFocus')} {focusTime}</Text>
                )}
            </View>
        </GlassCard>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Theme.radii.lg,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    content: { flex: 1 },
    label: {
        fontSize: 11,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 8,
    },
    line: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginBottom: 4,
    },
    bold: {
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
    },
    hint: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginTop: 4,
    },
});
