import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyCheckbox, MyConfirmAlert } from '../../../components/components';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, BellRing, LogOut } from 'lucide-react-native';
import { registerForPushNotificationsAsync, scheduleFeatureReminder } from '../../../services/notificationService';
import { useNotifications } from '../../../context/NotificationContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { useAppTheme } from '../../../context/ThemeContext';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';

export default function Settings({ navigation }) {
    const { showNotification } = useNotifications();
    const { t, language, changeLanguage } = useLanguage();
    const { user } = useAuth();
    const { isDarkMode, setDarkMode, colors } = useAppTheme();

    const [pushEnabled, setPushEnabled] = useState(true);
    const [isScheduling, setIsScheduling] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);

    const handleTestNotification = async () => {
        setIsScheduling(true);
        try {
            const status = await registerForPushNotificationsAsync();
            if (Platform.OS !== 'web' && status !== 'granted') {
                showNotification('error', t('notifPermRequired'));
                return;
            }

            const triggerDate = new Date(Date.now() + 5000);
            await scheduleFeatureReminder(
                'test-notif-' + Date.now(),
                t('testNotifTitle'),
                t('testNotifBody'),
                triggerDate,
                'test'
            );
            showNotification('success', t('notifTestScheduled'));
        } catch (error) {
            console.error('Test notification failed:', error);
            showNotification('error', t('notifTestFailed'));
        } finally {
            setIsScheduling(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (e) {
            console.error(e);
        }
    };

    const handleResetData = async () => {
        if (!user) return;
        try {
            const batch = writeBatch(db);
            const collections = ['tasks', 'goals', 'diary_entries'];

            for (const col of collections) {
                const q = query(collection(db, col), where('userId', '==', user.uid));
                const snap = await getDocs(q);
                snap.forEach(doc => batch.delete(doc.ref));
            }

            await batch.commit();
            setAlertVisible(false);
            showNotification('success', t('dataResetSuccess'), 3);
        } catch (e) {
            console.error("Error resetting data:", e);
            showNotification('error', t('dataResetError'));
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={colors.textMain} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textMain }]}>{t('settings')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <MotiView
                    from={{ opacity: 0, translateY: 15 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400 }}
                >
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('notifications')}</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <MyCheckbox
                            label={t('pushNotifications')}
                            checked={pushEnabled}
                            onPress={() => setPushEnabled(!pushEnabled)}
                        />
                    </View>
                </MotiView>

                <MotiView
                    from={{ opacity: 0, translateY: 15 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: 100 }}
                >
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('preferences')}</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <MyCheckbox
                            label={t('darkMode')}
                            checked={isDarkMode}
                            onPress={() => setDarkMode(!isDarkMode)}
                        />
                    </View>
                </MotiView>

                <MotiView
                    from={{ opacity: 0, translateY: 15 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: 150 }}
                >
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('language')}</Text>
                    <View style={[styles.card, { padding: 0, backgroundColor: colors.surface, borderColor: colors.border, overflow: 'hidden' }]}>
                        <TouchableOpacity
                            style={[
                                styles.langBtn, 
                                language === 'en' && [styles.langBtnActive, { backgroundColor: colors.primaryLight }]
                            ]}
                            onPress={() => changeLanguage('en')}
                        >
                            <Text style={[styles.langText, { color: colors.textMain }, language === 'en' && [styles.langTextActive, { color: colors.primary }]]}>English</Text>
                        </TouchableOpacity>
                        <View style={[styles.dividerFull, { backgroundColor: colors.border }]} />
                        <TouchableOpacity
                            style={[styles.langBtn, language === 'he' && [styles.langBtnActive, { backgroundColor: colors.primaryLight }]]}
                            onPress={() => changeLanguage('he')}
                        >
                            <Text style={[styles.langText, { color: colors.textMain }, language === 'he' && [styles.langTextActive, { color: colors.primary }]]}>עברית (Hebrew)</Text>
                        </TouchableOpacity>
                        <View style={[styles.dividerFull, { backgroundColor: colors.border }]} />
                        <TouchableOpacity
                            style={[
                                styles.langBtn, 
                                language === 'ar' && [styles.langBtnActive, { backgroundColor: colors.primaryLight }]
                            ]}
                            onPress={() => changeLanguage('ar')}
                        >
                            <Text style={[styles.langText, { color: colors.textMain }, language === 'ar' && [styles.langTextActive, { color: colors.primary }]]}>العربية (Arabic)</Text>
                        </TouchableOpacity>
                    </View>
                </MotiView>

                <MotiView
                    from={{ opacity: 0, translateY: 15 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: 200 }}
                >
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('systemVerification')}</Text>
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                            Test if notifications are working on your device.
                        </Text>
                        <TouchableOpacity
                            style={[styles.testButtonWrapper, isScheduling && { opacity: 0.7 }]}
                            onPress={handleTestNotification}
                            disabled={isScheduling}
                        >
                            <LinearGradient
                                colors={Theme.gradients.hero}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.testButtonGradient}
                            >
                                <BellRing size={20} color="#FFF" />
                                <Text style={styles.testButtonText}>
                                    {isScheduling ? t('scheduling') : t('testNotification')}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </MotiView>

                <MotiView
                    from={{ opacity: 0, translateY: 15 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: 300 }}
                >
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('account')}</Text>

                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: colors.primaryLight }]} onPress={handleSignOut}>
                            <LogOut size={20} color={colors.primary} style={{ marginRight: 12 }} />
                            <Text style={[styles.signOutText, { color: colors.primary }]}>{t('signOut')}</Text>
                        </TouchableOpacity>
                    </View>
                </MotiView>

                <MotiView
                    from={{ opacity: 0, translateY: 15 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 400, delay: 350 }}
                    style={styles.dangerZone}
                >
                    <TouchableOpacity 
                        style={[styles.dangerButton, { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 }]}
                        onPress={() => setAlertVisible(true)}
                    >
                        <Text style={[styles.dangerText, { color: colors.error }]}>{t('resetAccountData') || 'Reset Account Data'}</Text>
                    </TouchableOpacity>
                </MotiView>

                <View style={styles.footer}>
                    <Text style={[styles.version, { color: colors.textSecondary }]}>Nova Journey v1.0.0</Text>
                    <Text style={[styles.credit, { color: colors.textSecondary }]}>Crafted for your success 🚀</Text>
                </View>

            </ScrollView>

            <MyConfirmAlert
                visible={alertVisible}
                title="Reset All Data?"
                message="This will permanently delete all your tasks, goals, and diaries. Your account will remain active. This cannot be undone."
                onConfirm={handleResetData}
                onCancel={() => setAlertVisible(false)}
            />
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
        paddingBottom: 40,
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
        borderRadius: Theme.radii.lg,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.float,
    },
    dividerFull: {
        height: 1,
        backgroundColor: Theme.colors.border,
        width: '100%',
    },
    langBtn: {
        padding: 16,
        backgroundColor: 'transparent',
    },
    langBtnActive: {
        backgroundColor: Theme.colors.primaryLight,
    },
    langText: {
        fontSize: 16,
        fontFamily: Theme.typography.body,
        color: Theme.colors.textMain,
    },
    langTextActive: {
        fontFamily: Theme.typography.subHeader,
        color: Theme.colors.primary,
    },
    signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: Theme.radii.md,
},
    signOutText: {
    fontSize: 16,
    fontFamily: Theme.typography.subHeader,
    color: Theme.colors.primary,
},
    dangerButton: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: 'transparent',
        borderRadius: Theme.radii.md,
        marginBottom: 12,
        shadowOpacity: 0,
        elevation: 0,
    },
    dangerText: {
    color: Theme.colors.error,
    fontFamily: Theme.typography.subHeader,
    fontSize: 16,
},
    dangerInfo: {
    fontSize: 12,
    color: Theme.colors.error,
    fontFamily: Theme.typography.body,
    textAlign: 'center',
},
    infoText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    fontFamily: Theme.typography.body,
    marginBottom: 16,
    lineHeight: 18,
},
    testButtonWrapper: {
    borderRadius: 12,
    ...Theme.shadows.glow,
},
    testButtonGradient: {
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
