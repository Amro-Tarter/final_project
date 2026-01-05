import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, MyCheckbox } from '../../components/components';
import { ArrowLeft } from 'lucide-react-native';

export default function Settings({ navigation }) {
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

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
    }
});
