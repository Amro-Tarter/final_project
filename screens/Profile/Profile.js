import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../components/components';
import { User, Settings, PieChart, Trophy, LogOut } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useTasks } from '../../hooks/useTasks';
import { useGoals } from '../../hooks/useGoals';
import { useDiary } from '../../hooks/useDiary';
import { getUserDisplayName, getJourneyStats } from '../../utils/journeyHelpers';

export default function Profile({ navigation }) {
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
        { label: 'Journey Insights', icon: PieChart, route: 'AnalyticsDashboard' },
        { label: 'Celebration Wall', icon: Trophy, route: 'CelebrationWall' },
        { label: 'Settings', icon: Settings, route: 'Settings' },
    ];

    const summaryText = `You've completed ${stats.tasksCompleted} steps and reached ${stats.milestonesReached} pit stops since beginning your journey.`;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Me</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Settings size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <User size={40} color={Theme.colors.primary} />
                    </View>
                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{stats.goalsCompleted}</Text>
                            <Text style={styles.statLabel}>Destinations</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{stats.milestonesReached}</Text>
                            <Text style={styles.statLabel}>Pit Stops</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>{stats.tasksCompleted}</Text>
                            <Text style={styles.statLabel}>Steps</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Personal Journey Summary</Text>
                    <Text style={styles.summaryText}>{summaryText}</Text>
                    <Text style={styles.summarySub}>
                        {stats.reflectionsWritten} reflections written · {stats.momentum}% momentum
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Menu</Text>
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}
                            onPress={() => item.route && navigation.navigate(item.route)}
                        >
                            <View style={styles.menuIcon}>
                                <item.icon size={20} color={Theme.colors.primary} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                    <LogOut size={20} color={Theme.colors.error} style={{ marginRight: 12 }} />
                    <Text style={styles.signOutText}>Sign Out</Text>
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
