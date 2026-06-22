import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { translations } from '../constants/translations';
import { Alert } from 'react-native';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');
    const [isLoaded, setIsLoaded] = useState(false);
    const [alertData, setAlertData] = useState(null);

    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const storedLang = await AsyncStorage.getItem('appLanguage');
                if (storedLang) {
                    const isRTL = storedLang === 'he' || storedLang === 'ar';
                    if (I18nManager.isRTL !== isRTL) {
                        I18nManager.allowRTL(isRTL);
                        I18nManager.swapLeftAndRightInRTL(isRTL);
                        I18nManager.forceRTL(isRTL);
                        try {
                            await Updates.reloadAsync();
                            return;
                        } catch (e) {
                            Alert.alert(
                                translations[storedLang]?.languageChanged || 'Language Changed',
                                translations[storedLang]?.restartAppLayout || 'To apply the layout changes, please restart the app.',
                                [{ text: 'OK' }]
                            );
                        }
                    }
                    setLanguage(storedLang);
                }
            } catch (error) {
                console.error('Failed to load language', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadLanguage();
    }, []);

    const changeLanguage = async (newLang) => {
        if (newLang === language) return;
        
        try {
            await AsyncStorage.setItem('appLanguage', newLang);
            
            const isRTL = newLang === 'he' || newLang === 'ar';
            if (I18nManager.isRTL !== isRTL) {
                I18nManager.allowRTL(isRTL);
                I18nManager.swapLeftAndRightInRTL(isRTL);
                I18nManager.forceRTL(isRTL);
                setLanguage(newLang);
                
                try {
                    await Updates.reloadAsync();
                } catch (e) {
                    Alert.alert(
                        translations[newLang]?.languageChanged || 'Language Changed',
                        translations[newLang]?.restartAppLayout || 'To apply the layout changes, please restart the app.',
                        [{ text: "OK" }]
                    );
                }
            } else {
                setLanguage(newLang);
            }
        } catch (error) {
            console.error('Failed to change language', error);
        }
    };

    const t = (key, params = {}) => {
        let str = translations[language]?.[key] || translations['en']?.[key] || key;
        if (typeof str === 'string') {
            Object.keys(params).forEach(p => {
                str = str.replace(new RegExp(`{${p}}`, 'g'), params[p]);
            });
        }
        return str;
    };

    if (!isLoaded) return null;

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t, isRTL: language === 'he' || language === 'ar' }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
