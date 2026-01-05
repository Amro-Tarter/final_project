import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { Theme } from '../components/components';
import { Check, Info, AlertCircle, X, Sparkles } from 'lucide-react-native';

export const NotificationToast = ({
    visible,
    type = 'success', // success, encouragement, warning, error
    message,
    onDismiss
}) => {
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
                    bg: '#F0FDF4', // Green 50
                    border: '#BBF7D0', // Green 200
                    text: '#166534', // Green 800
                    icon: Check,
                    iconColor: '#22C55E' // Green 500
                };
            case 'encouragement':
                return {
                    bg: '#EEF2FF', // Indigo 50
                    border: '#C7D2FE', // Indigo 200
                    text: '#3730A3', // Indigo 800
                    icon: Sparkles,
                    iconColor: '#6366F1' // Indigo 500
                };
            case 'warning':
                return {
                    bg: '#FFFBEB', // Amber 50
                    border: '#FDE68A', // Amber 200
                    text: '#92400E', // Amber 800
                    icon: Info,
                    iconColor: '#F59E0B' // Amber 500
                };
            case 'error':
                return {
                    bg: '#FFF1F2', // Rose 50
                    border: '#FECDD3', // Rose 200
                    text: '#9F1239', // Rose 800
                    icon: AlertCircle,
                    iconColor: '#F43F5E' // Rose 500
                };
            default:
                return {
                    bg: '#F8FAFC',
                    border: '#E2E8F0',
                    text: '#1E293B',
                    icon: Info,
                    iconColor: '#64748B'
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
