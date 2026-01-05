import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyButton } from '../../components/components';
import { ArrowLeft, User, Settings, PieChart, Shield, LogOut } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function Profile({ navigation }) {
    const { user } = useAuth();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (e) {
            console.error(e);
        }
    };

    const menuItems = [
        { label: 'Analytics Dashboard', icon: PieChart, route: 'AnalyticsDashboard' },
        { label: 'Settings', icon: Settings, route: 'Settings' },
        { label: 'Privacy & Security', icon: Shield, route: 'Settings' }, // Reuse settings for now
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                    <Settings size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <User size={40} color={Theme.colors.primary} />
                    </View>
                    <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>12</Text>
                            <Text style={styles.statLabel}>Goals</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>85%</Text>
                            <Text style={styles.statLabel}>Focus</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.stat}>
                            <Text style={styles.statValue}>124</Text>
                            <Text style={styles.statLabel}>Tasks</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Menu</Text>
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={() => item.route && navigation.navigate(item.route)}
                        >
                            <View style={[styles.menuIcon, { backgroundColor: Theme.colors.background }]}>
                                <item.icon size={20} color={Theme.colors.textMain} />
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
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
    },
    content: {
        padding: Theme.spacing.lg,
    },
    profileCard: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius,
        padding: 24,
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.md,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#E0E7FF',
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
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontFamily: Theme.typography.header,
        color: Theme.colors.primary,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textSecondary,
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: Theme.colors.border,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textMain,
        marginBottom: 16,
    },
    menuContainer: {
        backgroundColor: Theme.colors.surface,
        borderRadius: Theme.radius,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Theme.colors.border,
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
    }
});
