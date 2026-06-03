import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import { Theme } from '../components';
import { useAppTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export function CoPilotCard({ message, onPress }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.92}>
            <MotiView
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 100 }}
                style={styles.outer}
            >
                <MotiView
                    from={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ type: 'timing', duration: 3000, loop: true }}
                    style={styles.glow}
                >
                    <LinearGradient
                        colors={Theme.gradients.hero}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.glowFill}
                    />
                </MotiView>
                <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.primaryBorder }]}>
                    <View style={styles.iconRow}>
                        <View style={[styles.iconBadge, { backgroundColor: colors.primaryLight }]}>
                            <Sparkles size={18} color={colors.primary} />
                        </View>
                        <Text style={[styles.badge, { color: colors.primary }]}>{t('coPilotBadge')}</Text>
                    </View>
                    <Text style={[styles.message, { color: colors.textMain }]}>{message}</Text>
                    <View style={styles.footer}>
                        <Text style={[styles.cta, { color: colors.primary }]}>{t('talkToNova')}</Text>
                        <ChevronRight size={18} color={colors.primary} />
                    </View>
                </View>
            </MotiView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    outer: {
        position: 'relative',
        marginBottom: 20,
    },
    glow: {
        position: 'absolute',
        top: -4,
        left: -4,
        right: -4,
        bottom: -4,
        borderRadius: Theme.radii.lg + 4,
        overflow: 'hidden',
    },
    glowFill: {
        flex: 1,
        borderRadius: Theme.radii.lg + 4,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E0E7FF',
        ...Theme.shadows.float,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    badge: {
        fontSize: 12,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
        letterSpacing: 0.5,
    },
    message: {
        fontSize: 16,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
        lineHeight: 24,
        marginBottom: 14,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cta: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
        marginRight: 4,
    },
});
