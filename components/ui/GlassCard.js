import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../context/ThemeContext';

export function GlassCard({ style, children, onPress, activeOpacity = 0.9, ...props }) {
    const { isDarkMode, colors } = useAppTheme();
    const bgImage = isDarkMode 
        ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=1000&auto=format&fit=crop';

    const content = (
        <>
            <Image 
                source={{ uri: bgImage }} 
                style={[StyleSheet.absoluteFillObject, { opacity: isDarkMode ? 0.35 : 0.25 }]} 
                resizeMode="cover" 
            />
            <View style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'hidden' }}>
                {children}
            </View>
        </>
    );

    const baseStyle = [
        styles.base, 
        { backgroundColor: colors.surface, borderColor: colors.border }, 
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
