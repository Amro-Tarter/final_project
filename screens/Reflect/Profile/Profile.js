import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../../components/components';
import { User, Settings, Trophy, LogOut } from 'lucide-react-native';
import { useAuth } from '../../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../../config/firebase';
import { useTasks } from '../../../hooks/useTasks';
import { useGoals } from '../../../hooks/useGoals';
import { useDiary } from '../../../hooks/useDiary';
import { getUserDisplayName, getJourneyStats } from '../../../utils/journeyHelpers';
import { useAppTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';

export default function Profile({ navigation }) {
    const { colors } = useAppTheme();
    const { t } = useLanguage();
    const { user } = useAuth();
    const { tasks } = useTasks();
    const { goals } = useGoals();
    const { entries } = useDiary();

    const stats = useMemo(() => getJourneyStats(tasks, goals, entries), [tasks, goals, entries]);
    const displayName = getUserDisplayName(user);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (e) {
            console.error(e);
        }
    };

    const menuItems = [
        { label: t('celebrationWall'), icon: Trophy, route: 'CelebrationWall' },
        { label: t('settings'), icon: Settings, route: 'Settings' },
    ];

    const summaryText = t('journeySummary').replace('{0}', stats.tasksCompleted).replace('{1}', stats.milestonesReached);
    const diariesWrittenText = t('diariesWrittenText').replace('{0}', stats.diariesWritten).replace('{1}', stats.momentum);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.textMain }]}>{t('me')}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Settings size={24} color={colors.textMain} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.avatar, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
                        <User size={40} color={colors.primary} />
                    </View>
                    <Text style={[styles.userName, { color: colors.textMain }]}>{displayName}</Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.goalsCompleted}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('goals')}</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.stat}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.milestonesReached}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('tasks')}</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.stat}>
                            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.tasksCompleted}</Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('steps')}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.summaryCard, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder }]}>
                    <Text style={[styles.summaryLabel, { color: colors.primary }]}>{t('personalJourney')}</Text>
                    <Text style={[styles.summaryText, { color: colors.textMain }]}>{summaryText}</Text>
                    <Text style={[styles.summarySub, { color: colors.textSecondary }]}>
                        {diariesWrittenText}
                    </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textMain }]}>{t('menu')}</Text>
                <View style={[styles.menuContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, { borderBottomColor: colors.border }, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}
                            onPress={() => item.route && navigation.navigate(item.route)}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
                                <item.icon size={20} color={colors.primary} />
                            </View>
                            <Text style={[styles.menuLabel, { color: colors.textMain }]}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                    <LogOut size={20} color={colors.error} style={{ marginRight: 12 }} />
                    <Text style={[styles.signOutText, { color: colors.error }]}>{t('signOut')}</Text>
                </TouchableOpacity>
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
    headerTitle: {
        fontSize: 26,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
    },
    content: {
        padding: Theme.spacing.lg,
        paddingBottom: 40,
    },
    profileCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Theme.colors.primaryBorder,
    },
    userName: {
        fontSize: 24,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 4,
        textTransform: 'capitalize',
    },
    userEmail: {
        fontSize: 14,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-around',
    },
    stat: { alignItems: 'center' },
    statValue: {
        fontSize: 22,
        fontFamily: Theme.typography.header,
        color: Theme.colors.primary,
    },
    statLabel: {
        fontSize: 11,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: Theme.colors.border,
    },
    summaryCard: {
        backgroundColor: Theme.colors.primaryLight,
        borderRadius: Theme.radii.lg,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Theme.colors.primaryBorder,
    },
    summaryLabel: {
        fontSize: 12,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 15,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
        lineHeight: 22,
    },
    summarySub: {
        fontSize: 13,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textMain,
        marginBottom: 12,
    },
    menuContainer: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Theme.colors.border,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    menuLabel: {
        fontSize: 16,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
    },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        padding: 16,
    },
    signOutText: {
        fontSize: 16,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.error,
    },
});
