import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Theme } from '../components';
import { useAppTheme } from '../../context/ThemeContext';

export function ProgressRing({ progress = 0, size = 56, strokeWidth = 5 }) {
    const animatedProgress = useSharedValue(0);
    const pct = Math.min(Math.max(progress, 0), 100);

    useEffect(() => {
        animatedProgress.value = withTiming(pct, { duration: 800 });
    }, [pct]);

    const fillStyle = useAnimatedStyle(() => ({
        width: `${animatedProgress.value}%`,
    }));

    return (
        <View style={[styles.wrap, { width: size, height: size }]}>
            <View style={[styles.track, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth }]}>
                <View style={styles.inner}>
                    <Text style={styles.label}>{Math.round(pct)}%</Text>
                </View>
            </View>
            <View style={[styles.fillContainer, { width: size, height: size, borderRadius: size / 2 }]}>
                <Animated.View style={[styles.fillArc, fillStyle]} />
            </View>
        </View>
    );
}

export function ProgressBar({ progress = 0, height = 8, color }) {
    const { colors } = useAppTheme();
    const barColor = color || colors.primary;
    const animatedProgress = useSharedValue(0);
    const pct = Math.min(Math.max(progress, 0), 100);

    useEffect(() => {
        animatedProgress.value = withTiming(pct, { duration: 700 });
    }, [pct]);

    const barStyle = useAnimatedStyle(() => ({
        width: `${animatedProgress.value}%`,
    }));

    return (
        <View style={[styles.barTrack, { height, borderRadius: height, backgroundColor: colors.border }]}>
            <Animated.View style={[styles.barFill, { height, borderRadius: height, backgroundColor: barColor }, barStyle]} />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    track: {
        borderColor: 'rgba(255,255,255,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 13,
        fontFamily: Theme.typography.subHeader,
        color: '#fff',
    },
    fillContainer: {
        position: 'absolute',
        overflow: 'hidden',
        opacity: 0.5,
    },
    fillArc: {
        height: '100%',
        backgroundColor: '#fff',
    },
    barTrack: {
        width: '100%',
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
    },
    barFill: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
});
