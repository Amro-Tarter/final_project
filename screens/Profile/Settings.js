import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyCheckbox, MyButton } from '../../components/components';
import { ArrowLeft, BellRing } from 'lucide-react-native';
import { registerForPushNotificationsAsync, scheduleFeatureReminder } from '../../services/notificationService';
import { useNotifications } from '../../context/NotificationContext';

export default function Settings({ navigation }) {
    const { showNotification } = useNotifications();
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);

    const handleTestNotification = async () => {
        setIsScheduling(true);
        try {
            const status = await registerForPushNotificationsAsync();
            if (status !== 'granted') {
                showNotification('error', 'Notification permissions are required ❌');
                return;
            }

            const triggerDate = new Date(Date.now() + 5000);
            await scheduleFeatureReminder(
                'test-notif-' + Date.now(),
                'Test Notification 🚀',
                'It works! Achievements Ahead is ready to keep you on track.',
                triggerDate,
                'test'
            );
            showNotification('success', 'Test scheduled! Minimize the app — notification in 5s 🔔');
        } catch (error) {
            console.error('Test notification failed:', error);
            showNotification('error', 'Failed to schedule notification 🚫');
        } finally {
            setIsScheduling(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textMain} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.card}>
                    <MyCheckbox
                        label="Push Notifications"
                        checked={pushEnabled}
                        onPress={() => setPushEnabled(!pushEnabled)}
                    />
                    <View style={styles.divider} />
                    <MyCheckbox
                        label="Email Digests"
                        checked={emailEnabled}
                        onPress={() => setEmailEnabled(!emailEnabled)}
                    />
                </View>

                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.card}>
                    <MyCheckbox
                        label="Enable AI Companion"
                        checked={aiEnabled}
                        onPress={() => setAiEnabled(!aiEnabled)}
                    />
                    <View style={styles.divider} />
                    <MyCheckbox
                        label="Dark Mode"
                        checked={darkMode}
                        onPress={() => setDarkMode(!darkMode)}
                    />
                </View>

                <Text style={styles.sectionTitle}>System Verification</Text>
                <View style={styles.card}>
                    <Text style={styles.infoText}>
                        Test if notifications are working on your device.
                    </Text>
                    <TouchableOpacity
                        style={[styles.testButton, isScheduling && { opacity: 0.7 }]}
                        onPress={handleTestNotification}
                        disabled={isScheduling}
                    >
                        <BellRing size={20} color="#FFF" />
                        <Text style={styles.testButtonText}>
                            {isScheduling ? 'Scheduling...' : 'Send Test Notification (5s)'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>Account</Text>
                <TouchableOpacity style={styles.dangerButton}>
                    <Text style={styles.dangerText}>Delete Account</Text>
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
    sectionTitle: {
        fontSize: 14,
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.textSecondary,
        marginTop: 16,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        padding: 16,
        borderRadius: Theme.radius,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    divider: {
        height: 1,
        backgroundColor: Theme.colors.border,
        marginVertical: 12,
    },
    dangerButton: {
        marginTop: 32,
        alignItems: 'center',
        padding: 16,
    },
    dangerText: {
        color: Theme.colors.error,
        fontFamily: Theme.typography.subHeader,
        fontSize: 16,
    },
    infoText: {
        fontSize: 13,
        color: Theme.colors.textSecondary,
        fontFamily: Theme.typography.body,
        marginBottom: 16,
        lineHeight: 18,
    },
    testButton: {
        backgroundColor: Theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 10,
    },
    testButtonText: {
        color: '#FFF',
        fontFamily: Theme.typography.subHeader,
        fontSize: 16,
    }
});
