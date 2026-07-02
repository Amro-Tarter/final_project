import React, { useMemo } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../context/ThemeContext';

export function GlassCard({ style, contentStyle, children, onPress, activeOpacity = 0.9, ...props }) {
    const { isDarkMode, colors } = useAppTheme();
    const bgImage = isDarkMode 
        ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1000&auto=format&fit=crop';

    const textureTransform = useMemo(() => {
        const rotations = ['0deg', '90deg', '180deg', '270deg'];
        const scales = [1.2, 1.5, 1.8, 2.0];
        return {
            transform: [
                { rotate: rotations[Math.floor(Math.random() * rotations.length)] },
                { scaleX: Math.random() > 0.5 ? 1 : -1 },
                { scaleY: Math.random() > 0.5 ? 1 : -1 },
                { scale: scales[Math.floor(Math.random() * scales.length)] }
            ]
        };
    }, []);

    const content = (
        <>
            {isDarkMode && (
                <LinearGradient
                    colors={colors.heroGradient || ['#4F46E5', '#6366F1', '#818CF8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />
            )}
            <Image 
                source={{ uri: bgImage }} 
                style={[StyleSheet.absoluteFillObject, { opacity: isDarkMode ? 0.4 : 0.3 }, textureTransform]} 
                resizeMode="cover" 
            />
            <View style={[{ position: 'relative', zIndex: 1, flex: 1, overflow: 'hidden' }, contentStyle]}>
                {children}
            </View>
        </>
    );

    const baseStyle = [
        styles.base, 
        { 
            backgroundColor: isDarkMode ? 'transparent' : colors.surface, 
            borderColor: colors.border 
        }, 
        style
    ];

    if (onPress) {
        return (
            <TouchableOpacity style={baseStyle} onPress={onPress} activeOpacity={activeOpacity} {...props}>
                {content}
            </TouchableOpacity>
        );
    }

    return (
        <View style={baseStyle} {...props}>
            {content}
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        overflow: 'hidden',
    }
});
