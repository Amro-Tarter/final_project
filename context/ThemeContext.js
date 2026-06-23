import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LightColors = {
    primary: "#4F46E5",
    primaryLight: "#EEF2FF",
    primaryLightAlt: "#EFF6FF",
    secondary: "#818CF8",
    secondaryLight: "#F5F3FF",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    textMain: "#1E293B",
    textSecondary: "#64748B",
    border: "#E2E8F0",
    primaryBorder: "#E0E7FF",
    success: "#10B981",
    successLight: "#ECFDF5",
    error: "#EF4444",
    errorLight: "#FEF2F2",
    warning: "#F59E0B",
    warningLight: "#FFF7ED",
    warningBorder: "#FED7AA",
    warningText: "#C2410C",
    placeholder: "#94A3B8",
    overlay: "rgba(15, 23, 42, 0.4)",
    heroGradient: ['#4F46E5', '#6366F1', '#818CF8'], // Indigo for light mode to match primary color
};

export const DarkColors = {
    primary: "#6366F1", 
    primaryLight: "#312E81",
    primaryLightAlt: "#3730A3",
    secondary: "#818CF8",
    secondaryLight: "#4338CA",
    background: "#0F172A", 
    surface: "#1E293B", 
    textMain: "#F8FAFC", 
    textSecondary: "#94A3B8", 
    border: "#334155", 
    primaryBorder: "#4338CA",
    success: "#34D399",
    successLight: "#064E3B",
    error: "#F87171",
    errorLight: "#7F1D1D",
    warning: "#FBBF24",
    warningLight: "#78350F",
    warningBorder: "#92400E",
    warningText: "#FEF3C7",
    placeholder: "#64748B",
    overlay: "rgba(0, 0, 0, 0.6)",
    heroGradient: ['#4F46E5', '#6366F1', '#818CF8'], // Original indigo for dark mode
};

const ThemeContext = createContext();

export function AppThemeProvider({ children }) {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const storedThemeMode = await AsyncStorage.getItem('appThemeMode');
                if (storedThemeMode) {
                    setThemeMode(storedThemeMode);
                } else {
                    const oldStoredTheme = await AsyncStorage.getItem('appTheme');
                    if (oldStoredTheme) {
                        setThemeMode(oldStoredTheme);
                    }
                }
            } catch (error) {
                console.error('Failed to load theme', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadTheme();
    }, []);

    const changeThemeMode = async (mode) => {
        try {
            await AsyncStorage.setItem('appThemeMode', mode);
            setThemeMode(mode);
        } catch (error) {
            console.error('Failed to save theme', error);
        }
    };

    const isDarkMode = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';

    const toggleTheme = async () => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        await changeThemeMode(newTheme);
    };

    const setDarkMode = async (value) => {
        const newTheme = value ? 'dark' : 'light';
        await changeThemeMode(newTheme);
    }

    const themeColors = isDarkMode ? DarkColors : LightColors;

    if (!isLoaded) return null;

    return (
        <ThemeContext.Provider value={{ isDarkMode, themeMode, changeThemeMode, toggleTheme, setDarkMode, colors: themeColors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useAppTheme() {
    return useContext(ThemeContext);
}
