import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { Theme } from '../components/components';
import { Check, Info, AlertCircle, X, Sparkles } from 'lucide-react-native';
import { useAppTheme } from '../context/ThemeContext';

export const NotificationToast = ({
    visible,
    type = 'success', // success, encouragement, warning, error
    message,
    onDismiss
}) => {
    const { colors } = useAppTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-50)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: -50,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible && fadeAnim._value === 0) return null;

    const getStyle = () => {
        switch (type) {
            case 'success':
                return {
                    bg: colors.successLight,
                    border: colors.success,
                    text: colors.success,
                    icon: Check,
                    iconColor: colors.success
                };
            case 'encouragement':
                return {
                    bg: colors.primaryLight,
                    border: colors.primaryBorder,
                    text: colors.primary,
                    icon: Sparkles,
                    iconColor: colors.primary
                };
            case 'warning':
                return {
                    bg: colors.warningLight,
                    border: colors.warningBorder,
                    text: colors.warningText,
                    icon: Info,
                    iconColor: colors.warning
                };
            case 'error':
                return {
                    bg: colors.errorLight,
                    border: colors.error,
                    text: colors.error,
                    icon: AlertCircle,
                    iconColor: colors.error
                };
            default:
                return {
                    bg: colors.surface,
                    border: colors.border,
                    text: colors.textMain,
                    icon: Info,
                    iconColor: colors.textSecondary
                };
        }
    };

    const styleConfig = getStyle();
    const IconComponent = styleConfig.icon;

    return (
        <Animated.View style={[
            styles.container,
            {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
            }
        ]}>
            <TouchableOpacity
                style={[
                    styles.card,
                    { backgroundColor: styleConfig.bg, borderColor: styleConfig.border }
                ]}
                onPress={onDismiss}
                activeOpacity={0.9}
            >
                <View style={styles.iconContainer}>
                    <IconComponent size={24} color={styleConfig.iconColor} />
                </View>
                <Text style={[styles.message, { color: styleConfig.text }]}>
                    {message}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40, // Below status bar
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    iconContainer: {
        marginRight: 16,
    },
    message: {
        flex: 1,
        fontSize: 15,
        fontFamily: Theme.typography.subHeader,
        lineHeight: 22,
    }
});
