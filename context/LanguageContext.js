import React, { createContext, useContext, useState, useEffect } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../constants/translations';
import { MyCustomAlert } from '../components/components';

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
                I18nManager.forceRTL(isRTL);
                setAlertData({
                    title: t('languageChanged'),
                    message: t('restartAppLayout'),
                    onClose: () => {
                        setAlertData(null);
                        setLanguage(newLang);
                    }
                });
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
            {alertData && (
                <MyCustomAlert
                    visible={!!alertData}
                    title={alertData.title}
                    message={alertData.message}
                    onClose={alertData.onClose}
                />
            )}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
