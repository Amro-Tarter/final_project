import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, LogoHeader, MyButton } from '../components/components';
import { Target, TrendingUp, Heart } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';

export default function WelcomeScreen({ navigation }) {
    const { colors } = useAppTheme();
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.contentContainer}>
                <LogoHeader
                    title="Achievements Ahead"
                    subtitle="Your personal growth companion. Discover the path forward."
                    style={{ marginTop: Theme.spacing.xxl }}
                />

                <View style={styles.featuresBox}>
                    <View style={styles.featureRow}>
                        <Target size={28} color={colors.primary} />
                        <Text style={[styles.featureText, { color: colors.textMain }]}>Set Meaningful Goals</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <TrendingUp size={28} color={colors.success} />
                        <Text style={[styles.featureText, { color: colors.textMain }]}>Track Your Progress</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Heart size={28} color={colors.secondary} />
                        <Text style={[styles.featureText, { color: colors.textMain }]}>Reflect & Grow</Text>
                    </View>
                </View>

                <View style={{ flex: 1 }} />

                <View style={styles.buttonContainer}>
                    <MyButton
                        title="Sign Up"
                        onPress={() => navigation.navigate('SignUp')}
                        style={styles.signupButton}
                    />
                    <MyButton
                        title="Log In"
                        type="secondary"
                        onPress={() => navigation.navigate('Login')}
                        style={styles.loginButton}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    contentContainer: {
        flex: 1,
        padding: Theme.spacing.lg,
    },
    featuresBox: {
        marginTop: Theme.spacing.xxxl,
        paddingHorizontal: Theme.spacing.md,
        gap: Theme.spacing.xl,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Theme.spacing.md,
    },
    featureText: {
        fontSize: 18,
        fontFamily: Theme.typography.header,
        color: Theme.colors.textPrimary,
    },
    buttonContainer: {
        gap: Theme.spacing.md,
        marginBottom: Theme.spacing.xl,
    },
    signupButton: {
        width: '100%',
    },
    loginButton: {
        width: '100%',
    },
});
