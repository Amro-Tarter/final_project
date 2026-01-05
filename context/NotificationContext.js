import React, { createContext, useContext, useState, useCallback } from 'react';
import { NotificationToast } from '../components/NotificationToast';
import { getRandomEncouragement } from '../constants/EncouragementLibrary';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notification, setNotification] = useState({
        visible: false,
        type: 'success',
        message: '',
    });

    const [timerId, setTimerId] = useState(null);

    const showNotification = useCallback((type, message, degree = null) => {
        // If there's an existing timer, clear it to prevent early dismissal
        if (timerId) {
            clearTimeout(timerId);
        }

        let finalMessage = message;
        let finalType = type;

        // If it's pure encouragement or a success with a degree, possibly grab a random message
        if (degree) {
            // 50% chance to show an Encouragement Card instead of just "Success" if it's a success event
            // Or if explicitly 'encouragement' type
            if (type === 'encouragement' || (type === 'success' && Math.random() > 0.3)) {
                finalMessage = getRandomEncouragement(degree);
                finalType = 'encouragement'; // Switch style to encouragement
            }
        }

        setNotification({
            visible: true,
            type: finalType,
            message: finalMessage
        });

        // Auto dismiss logic
        // Warnings/Errors stay a bit longer (5s), Success/Encouragement (4s)
        const duration = (finalType === 'warning' || finalType === 'error') ? 5000 : 4000;

        const newTimer = setTimeout(() => {
            hideNotification();
        }, duration);

        setTimerId(newTimer);
    }, [timerId]);

    const hideNotification = useCallback(() => {
        setNotification(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <NotificationToast
                visible={notification.visible}
                type={notification.type}
                message={notification.message}
                onDismiss={hideNotification}
            />
        </NotificationContext.Provider>
    );
};
